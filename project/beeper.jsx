/* beeper.jsx — multi-network bridge client via the Beeper Desktop API.
 *
 * Beeper bridges chat networks (WhatsApp, Telegram, …) over the Matrix protocol.
 * The Beeper Desktop API is a fully-local HTTP API (default http://127.0.0.1:23373)
 * exposed by Beeper Desktop / Beeper Server, with SDKs for JS/Python/Go/PHP.
 * This module pings the local API, runs each network's login (QR companion-device
 * pairing), lists/sends messages, and gracefully falls back to bundled DEMO data
 * when the API is unreachable (any sandboxed/hosted preview, or before Beeper is set up).
 *
 * NOTE: exact REST routes vary by Beeper Desktop API version. The shapes below are the
 * documented form; if your installed version differs, adjust route() — the rest of the
 * app talks only to this module's methods, so nothing else changes.
 */
(function(){
  const LS_KEY = "mudita_beeper_v2";
  const DEFAULT_BASE = "http://127.0.0.1:23373";

  // Per-network metadata (labels, bridge name, pairing copy, demo identity).
  const NETWORKS = {
    whatsapp: {
      id:"whatsapp", label:"WhatsApp", bridge:"mautrix-whatsapp", idKey:"number",
      blurb:"Links as a companion device, the same way WhatsApp Web does.",
      steps:[["Open ","WhatsApp"," on your phone"],
             ["Tap ","Settings → Linked Devices",""],
             ["Tap ","Link a Device"," and scan this code"]],
      calls:false, demoAccount:{ name:"You", number:"+46 70 555 0182" },
    },
    telegram: {
      id:"telegram", label:"Telegram", bridge:"mautrix-telegram", idKey:"username",
      blurb:"Links as a desktop session via Telegram's device QR.",
      steps:[["Open ","Telegram"," on your phone"],
             ["Tap ","Settings → Devices",""],
             ["Tap ","Link Desktop Device"," and scan this code"]],
      calls:false, demoAccount:{ name:"You", username:"@you" },
    },
  };
  const NET_IDS = Object.keys(NETWORKS);

  function route(name, net, id){
    switch(name){
      case "health":      return "/v0/health";
      case "login":       return `/v0/accounts/${net}/login`;            // POST → {login_id, qr}
      case "loginStatus": return `/v0/accounts/${net}/login/${encodeURIComponent(id)}`;
      case "chats":       return "/v0/chats?limit=60";
      case "send":        return `/v0/chats/${encodeURIComponent(id)}/messages`;
      case "logout":      return `/v0/accounts/${net}`;
    }
  }

  function load(){ try{ return JSON.parse(localStorage.getItem(LS_KEY))||{}; }catch(e){ return {}; } }
  function save(s){ try{ localStorage.setItem(LS_KEY, JSON.stringify(s)); }catch(e){} }

  const state = Object.assign({
    baseUrl: DEFAULT_BASE,
    token: "",
    reachable: null,        // reached the local Beeper API? null=unknown
    demo: true,             // serving bundled demo data
    lastSync: null,
    nets: { whatsapp:{ connected:false, account:null },
            telegram:{ connected:false, account:null } },
  }, load());
  // migrate older shape / ensure all networks present
  state.nets = state.nets || {};
  NET_IDS.forEach(n=>{ state.nets[n] = state.nets[n] || { connected:false, account:null }; });

  const listeners = new Set();
  function snapshot(){
    const s = JSON.parse(JSON.stringify(state));
    s.connectedNets = NET_IDS.filter(n=>s.nets[n].connected);
    s.connected = s.connectedNets.length>0;               // any network linked
    const first = s.connectedNets[0];
    s.account = first ? s.nets[first].account : null;     // convenience for simple reads
    return s;
  }
  function emit(){ const snap = snapshot(); listeners.forEach(fn=>{ try{ fn(snap); }catch(e){} }); }
  function setState(patch){ Object.assign(state, patch); save(state); emit(); }
  function setNet(net, patch){ state.nets[net] = Object.assign({}, state.nets[net], patch); save(state); emit(); }

  function headers(){
    const h = { "Content-Type":"application/json" };
    if(state.token) h["Authorization"] = "Bearer " + state.token;
    return h;
  }
  function url(path){ return state.baseUrl.replace(/\/$/,"") + path; }

  async function req(path, opts={}, timeout=4000){
    const ctrl = new AbortController();
    const to = setTimeout(()=>ctrl.abort(), timeout);
    try{
      const res = await fetch(url(path), Object.assign({ headers:headers(), signal:ctrl.signal }, opts));
      clearTimeout(to);
      if(!res.ok) throw new Error("HTTP "+res.status);
      const ct = res.headers.get("content-type")||"";
      return ct.includes("json") ? await res.json() : await res.text();
    }catch(e){ clearTimeout(to); throw e; }
  }

  /* ---- connection lifecycle ---- */
  async function ping(){
    try{ await req(route("health"), { method:"GET" }, 3500); setState({ reachable:true }); return true; }
    catch(e){ setState({ reachable:false }); return false; }
  }

  // Begin login for a network. Returns {qr, loginId} or null if API unreachable.
  async function startLogin(net){
    try{
      const r = await req(route("login", net), { method:"POST", body:"{}" }, 6000);
      setState({ reachable:true });
      return { qr: r.qr || r.qr_code || null, loginId: r.login_id || r.id || null };
    }catch(e){ setState({ reachable:false }); return null; }
  }

  async function loginStatus(net, loginId){
    try{ return await req(route("loginStatus", net, loginId), { method:"GET" }, 4000); }
    catch(e){ return null; }
  }

  function markLinked(net, account){
    setNet(net, { connected:true, account: account || NETWORKS[net].demoAccount });
    setState({ demo: state.reachable ? false : true, lastSync: Date.now() });
  }

  async function disconnect(net){
    if(state.reachable){ try{ await req(route("logout", net), { method:"DELETE" }, 4000); }catch(e){} }
    setNet(net, { connected:false, account:null });
  }

  /* ---- data: live when connected+reachable, else bundled demo ---- */
  function mapChat(c){
    return {
      id: c.id || c.chat_id,
      name: c.title || c.name || "Unknown",
      initials: (c.title||c.name||"?").split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase(),
      unread: c.unread_count || 0,
      time: c.last_activity_label || "",
      snippet: (c.last_message && (c.last_message.text||"")) || "",
      group: c.type === "group",
      network: c.network || c.bridge || null,
      live: true,
    };
  }
  async function getChats(){
    const snap = snapshot();
    if(snap.connected && state.reachable){
      try{
        const r = await req(route("chats"), { method:"GET" }, 6000);
        const arr = (r.chats || r.items || r || []).map(mapChat)
          .filter(c=> !c.network || snap.connectedNets.includes(c.network));
        if(arr.length){ setState({ lastSync:Date.now() }); return arr; }
      }catch(e){ /* fall through to demo */ }
    }
    return null; // signal: use bundled DATA
  }
  async function send(chatId, text){
    if(snapshot().connected && state.reachable){
      try{
        await req(route("send", null, chatId), { method:"POST", body: JSON.stringify({ text }) }, 6000);
        return true;
      }catch(e){ return false; }
    }
    return false;
  }

  function subscribe(fn){ listeners.add(fn); fn(snapshot()); return ()=>listeners.delete(fn); }

  window.Beeper = {
    DEFAULT_BASE, NETWORKS, NET_IDS,
    get state(){ return snapshot(); },
    setConfig:(patch)=>setState(patch),
    subscribe, ping, startLogin, loginStatus, markLinked, disconnect, getChats, send,
  };

  window.useBeeper = function useBeeper(){
    const [s, setS] = React.useState(snapshot());
    React.useEffect(()=> subscribe(setS), []);
    return s;
  };
})();
