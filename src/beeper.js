import { useState, useEffect } from 'react';

const LS_KEY = "mudita_beeper_v2";
export const DEFAULT_BASE = "";

export const NETWORKS = {
  whatsapp: {
    id: "whatsapp", label: "WhatsApp", bridge: "mautrix-whatsapp", idKey: "number",
    blurb: "Links as a companion device, the same way WhatsApp Web does.",
    steps: [
      ["Open ", "WhatsApp", " on your phone"],
      ["Tap ", "Settings → Linked Devices", ""],
      ["Tap ", "Link a Device", " and scan this code"],
    ],
    calls: false, demoAccount: { name: "You", number: "+46 70 555 0182" },
  },
  telegram: {
    id: "telegram", label: "Telegram", bridge: "mautrix-telegram", idKey: "username",
    blurb: "Links as a desktop session via Telegram's device QR.",
    steps: [
      ["Open ", "Telegram", " on your phone"],
      ["Tap ", "Settings → Devices", ""],
      ["Tap ", "Link Desktop Device", " and scan this code"],
    ],
    calls: false, demoAccount: { name: "You", username: "@you" },
  },
};
export const NET_IDS = Object.keys(NETWORKS);

function routePath(name, net, id) {
  switch (name) {
    case "health":      return "/v0/health";
    case "login":       return `/v0/accounts/${net}/login`;
    case "loginStatus": return `/v0/accounts/${net}/login/${encodeURIComponent(id)}`;
    case "chats":       return "/v0/chats?limit=60";
    case "messages":    return `/v0/chats/${encodeURIComponent(id)}/messages`;
    case "send":        return `/v0/chats/${encodeURIComponent(id)}/messages`;
    case "logout":      return `/v0/accounts/${net}`;
    default:            return "/v0/health";
  }
}

function load() { try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; } catch (e) { return {}; } }
function save(s) { try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch (e) {} }

const state = Object.assign({
  baseUrl: DEFAULT_BASE,
  token: "",
  reachable: null,
  demo: true,
  lastSync: null,
  nets: {
    whatsapp: { connected: false, account: null },
    telegram: { connected: false, account: null },
  },
}, load());

state.nets = state.nets || {};
NET_IDS.forEach(n => { state.nets[n] = state.nets[n] || { connected: false, account: null }; });

const listeners = new Set();

function snapshot() {
  const s = JSON.parse(JSON.stringify(state));
  s.connectedNets = NET_IDS.filter(n => s.nets[n].connected);
  s.connected = s.connectedNets.length > 0;
  const first = s.connectedNets[0];
  s.account = first ? s.nets[first].account : null;
  return s;
}
function emit() { const snap = snapshot(); listeners.forEach(fn => { try { fn(snap); } catch (e) {} }); }
function setState(patch) { Object.assign(state, patch); save(state); emit(); }
function setNet(net, patch) { state.nets[net] = Object.assign({}, state.nets[net], patch); save(state); emit(); }

function headers() {
  const h = { "Content-Type": "application/json" };
  if (state.token) h["Authorization"] = "Bearer " + state.token;
  return h;
}
function urlFor(path) {
  if (!state.baseUrl) throw new Error("No Beeper endpoint configured");
  return state.baseUrl.replace(/\/$/, "") + path;
}

async function req(path, opts = {}, timeout = 4000) {
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(urlFor(path), Object.assign({ headers: headers(), signal: ctrl.signal }, opts));
    clearTimeout(to);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const ct = res.headers.get("content-type") || "";
    return ct.includes("json") ? await res.json() : await res.text();
  } catch (e) { clearTimeout(to); throw e; }
}

// ── connection lifecycle ────────────────────────────────────────────────────

async function ping() {
  try { await req(routePath("health"), { method: "GET" }, 3500); setState({ reachable: true }); return true; }
  catch (e) { setState({ reachable: false }); return false; }
}

async function startLogin(net) {
  try {
    const r = await req(routePath("login", net), { method: "POST", body: "{}" }, 6000);
    setState({ reachable: true });
    return { qr: r.qr || r.qr_code || null, loginId: r.login_id || r.id || null };
  } catch (e) { setState({ reachable: false }); return null; }
}

async function loginStatus(net, loginId) {
  try { return await req(routePath("loginStatus", net, loginId), { method: "GET" }, 4000); }
  catch (e) { return null; }
}

function markLinked(net, account) {
  setNet(net, { connected: true, account: account || NETWORKS[net].demoAccount });
  setState({ demo: state.reachable ? false : true, lastSync: Date.now() });
}

async function disconnect(net) {
  if (state.reachable) { try { await req(routePath("logout", net), { method: "DELETE" }, 4000); } catch (e) {} }
  setNet(net, { connected: false, account: null });
}

// ── chat list ───────────────────────────────────────────────────────────────

function mapChat(c) {
  return {
    id: c.id || c.chat_id,
    name: c.title || c.name || "Unknown",
    initials: (c.title || c.name || "?").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase(),
    unread: c.unread_count || 0,
    time: c.last_activity_label || "",
    snippet: (c.last_message && (c.last_message.text || "")) || "",
    group: c.type === "group",
    network: c.network || c.bridge || null,
    live: true,
  };
}

async function getChats() {
  const snap = snapshot();
  if (snap.connected && state.reachable) {
    try {
      const r = await req(routePath("chats"), { method: "GET" }, 6000);
      const arr = (r.chats || r.items || r || []).map(mapChat)
        .filter(c => !c.network || snap.connectedNets.includes(c.network));
      if (arr.length) { setState({ lastSync: Date.now() }); return arr; }
    } catch (e) { /* fall through */ }
  }
  return null;
}

// ── message thread ──────────────────────────────────────────────────────────

function now() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function mapMessage(m) {
  // Normalise various Beeper API message shapes to local format
  const sender = m.sender_id || m.sender || m.from_id || "";
  const isMe = sender === "me" || m.is_outgoing || m.outgoing || false;
  const text = m.text || m.body || m.content || "";
  const ts = m.timestamp || m.created_at || m.sent_at || null;
  const timeStr = ts
    ? new Date(typeof ts === "number" ? ts * 1000 : ts)
        .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : now();
  const isVoice = m.type === "audio" || m.type === "voice" || m.mime_type?.startsWith("audio/");
  const audioUrl = m.audio_url || m.media_url || (isVoice && m.url) || null;
  const dur = m.duration_label || (m.duration ? formatDur(m.duration) : null);
  return {
    id:       m.id || m.message_id || null,
    from:     isMe ? "me" : (sender || "them"),
    author:   m.sender_name || m.author || null,
    t:        timeStr,
    text:     isVoice ? null : text,
    kind:     isVoice ? "voice" : undefined,
    dur:      isVoice ? (dur || "0:30") : undefined,
    audioUrl: audioUrl || undefined,
  };
}

function formatDur(seconds) {
  const s = Math.round(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

async function getMessages(chatId, limit = 60) {
  const snap = snapshot();
  if (!snap.connected || !state.reachable) return null;
  try {
    const path = routePath("messages", null, chatId) + `?limit=${limit}`;
    const r = await req(path, { method: "GET" }, 6000);
    const raw = r.messages || r.items || (Array.isArray(r) ? r : null);
    if (!raw) return null;
    setState({ lastSync: Date.now() });
    return raw.map(mapMessage);
  } catch (e) {
    return null;
  }
}

function getAudioUrl(messageId) {
  return urlFor(`/v0/messages/${encodeURIComponent(messageId)}/audio`);
}

async function send(chatId, text) {
  if (snapshot().connected && state.reachable) {
    try {
      await req(routePath("send", null, chatId), { method: "POST", body: JSON.stringify({ text }) }, 6000);
      return true;
    } catch (e) { return false; }
  }
  return false;
}

// ── polling helper ──────────────────────────────────────────────────────────

export function poll(fn, intervalMs) {
  fn(); // run immediately
  const id = setInterval(fn, intervalMs);
  return () => clearInterval(id);
}

// ── subscription ────────────────────────────────────────────────────────────

function subscribe(fn) { listeners.add(fn); fn(snapshot()); return () => listeners.delete(fn); }

export const Beeper = {
  DEFAULT_BASE, NETWORKS, NET_IDS,
  get state() { return snapshot(); },
  setConfig: (patch) => setState(patch),
  subscribe, ping, startLogin, loginStatus, markLinked, disconnect,
  getChats, getMessages, getAudioUrl, send, now,
};

export function useBeeper() {
  const [s, setS] = useState(snapshot());
  useEffect(() => subscribe(setS), []);
  return s;
}
