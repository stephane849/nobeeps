/* screens-a.jsx — ChatList, Contacts, ContactDetail, Settings, LockNotification */
(function(){
  const { Icon, StatusBar, Header, Avatar, NetGlyph, NetTag, DATA } = window;
  const { useState, useEffect } = React;

  /* ---------------- CHAT LIST ---------------- */
  function ChatList({ nav, t }){
    const bridge = window.useBeeper ? window.useBeeper() : { connected:false, demo:true };
    const [live, setLive] = useState(null); // live chats from the bridge, or null

    useEffect(()=>{
      let alive = true;
      if(bridge.connected && window.Beeper){
        window.Beeper.getChats().then(arr=>{ if(alive && arr) setLive(arr); });
      } else { setLive(null); }
      return ()=>{ alive=false; };
    },[bridge.connected]);

    // normalize to a single render shape whether demo or live
    let rows = live || DATA.CHATS.map(c=>{
      const p = DATA.byId[c.id];
      return { id:c.id, name:p.name, initials:p.initials, unread:c.unread,
        time:c.time, snippet:c.snippet, group:c.group, pinned:c.pinned, network:c.network };
    });
    // when bridges are linked, only show chats from connected networks
    if(bridge.connected && bridge.connectedNets){
      rows = rows.filter(c=> !c.network || bridge.connectedNets.includes(c.network));
    }
    const netsShown = new Set(rows.map(c=>c.network).filter(Boolean));
    const showTags = netsShown.size > 1;

    return (
      <React.Fragment>
        <StatusBar label="Messages"/>
        <Header
          title="Messages"
          right={
            <React.Fragment>
              <button className="header__btn" aria-label="Search"><Icon.Search/></button>
              <button className="header__btn" aria-label="New message"
                onClick={()=>nav("contacts",{pick:true})}><Icon.Plus/></button>
            </React.Fragment>
          }
        />
        {!bridge.connected && (
          <button className="bridge-cta" onClick={()=>nav("settings")}>
            <Icon.People size={18}/>
            <span>Connect WhatsApp or Telegram through a Beeper bridge</span>
            <Icon.Chevron size={18} style={{opacity:.5}}/>
          </button>
        )}
        {t.mindful && (
          <div className="batch-banner">
            <Icon.Clock size={17} sw={1.8}/>
            <span><span className="next">Next delivery 16:30</span> · 3 messages waiting quietly</span>
          </div>
        )}
        <div className="body">
          {rows.map(c=>(
            <button className="chatrow" key={c.id} onClick={()=>nav("thread",{id:c.id})}>
              <Avatar initials={c.initials} square={c.group} filled={c.pinned}/>
              <span className="chatrow__main">
                <span className="chatrow__top">
                  <span className="chatrow__name">{c.name}</span>
                  <span className="chatrow__time">{c.time}</span>
                </span>
                <span className="chatrow__bottom">
                  <span className="chatrow__snippet-wrap">
                    {showTags && <NetTag network={c.network}/>}
                    <span className={"chatrow__snippet"+(c.unread?" unread":"")}>{c.snippet}</span>
                  </span>
                  {c.unread>0 && <span className="unread-count">{c.unread}</span>}
                </span>
              </span>
            </button>
          ))}
          <div className="center-note" style={{minHeight:120}}>
            {bridge.connected
              ? (bridge.demo ? "Bridge linked · showing demo data (Beeper API not reachable from here)."
                             : "You’re all caught up. Nothing else needs you right now.")
              : "You’re all caught up. Nothing else needs you right now."}
          </div>
        </div>
        <TabBar nav={nav} active="messages"/>
      </React.Fragment>
    );
  }

  /* ---------------- TAB BAR ---------------- */
  function TabBar({ nav, active }){
    const tabs = [
      { id:"messages", label:"Messages", icon:Icon.Reply, go:()=>nav("list") },
      { id:"contacts", label:"Contacts", icon:Icon.People, go:()=>nav("contacts") },
      { id:"settings", label:"Settings", icon:Icon.Gear, go:()=>nav("settings") },
    ];
    return (
      <div className="tabbar">
        {tabs.map(tb=>(
          <button key={tb.id} className={"tab"+(active===tb.id?" active":"")} onClick={tb.go}>
            <tb.icon size={22}/>
            <span>{tb.label}</span>
          </button>
        ))}
      </div>
    );
  }

  /* ---------------- CONTACTS ---------------- */
  function Contacts({ nav, route }){
    const pick = route.params && route.params.pick;
    const sorted = [...DATA.CONTACTS].sort((a,b)=>a.name.localeCompare(b.name));
    const groups = {};
    sorted.forEach(c=>{
      const L = c.name[0].toUpperCase();
      (groups[L] = groups[L] || []).push(c);
    });
    return (
      <React.Fragment>
        <StatusBar label="Contacts"/>
        <Header
          title={pick ? "New message" : "Contacts"}
          onBack={()=>nav("list")}
          right={!pick && <button className="header__btn" aria-label="Add contact"><Icon.Add/></button>}
        />
        <div className="body">
          {Object.keys(groups).map(L=>(
            <div key={L}>
              <div className="alpha">{L}</div>
              {groups[L].map(c=>(
                <button className="chatrow" key={c.id}
                  onClick={()=> pick ? nav("thread",{id:c.id}) : nav("contact",{id:c.id})}>
                  <Avatar initials={c.initials} square={c.group}/>
                  <span className="chatrow__main">
                    <span className="chatrow__name">{c.name}</span>
                    {c.note && <span className="chatrow__snippet">{c.note}</span>}
                  </span>
                  {!pick && <Icon.Chevron size={20} style={{opacity:.4}}/>}
                </button>
              ))}
            </div>
          ))}
          <div style={{height:24}}/>
        </div>
        {!pick && <TabBar nav={nav} active="contacts"/>}
      </React.Fragment>
    );
  }

  /* ---------------- CONTACT DETAIL ---------------- */
  function ContactDetail({ nav, route }){
    const c = DATA.byId[route.params.id];
    return (
      <React.Fragment>
        <StatusBar label="Contact"/>
        <Header title="" onBack={()=>nav("contacts")}
          right={<button className="header__btn" aria-label="More"><Icon.More/></button>}/>
        <div className="body">
          <div className="contact-hero">
            <Avatar initials={c.initials} square={c.group}/>
            <span className="contact-hero__name">{c.name}</span>
            <span className="contact-hero__num">{c.num}</span>
            <div className="contact-actions">
              <button className="btn" onClick={()=>nav("thread",{id:c.id})}>
                <Icon.Reply size={20}/> Message
              </button>
              <button className="btn" onClick={()=>nav("call",{id:c.id})}>
                <Icon.Phone size={20}/> Call
              </button>
            </div>
          </div>
          <div className="grouplabel">Presence</div>
          <div className="settingrow" style={{cursor:"default"}}>
            <Icon.Leaf size={22}/>
            <span className="settingrow__label">
              <span className="settingrow__name">No last-seen pressure</span>
              <span className="settingrow__desc">You won’t see when they were online, and they won’t see you.</span>
            </span>
          </div>
          <div className="settingrow" style={{cursor:"default"}}>
            <Icon.Clock size={22}/>
            <span className="settingrow__label">
              <span className="settingrow__name">Replies on your time</span>
              <span className="settingrow__desc">Messages from {c.name.split(" ")[0]} arrive at your next quiet delivery.</span>
            </span>
          </div>
          <div className="grouplabel">Details</div>
          <div className="settingrow" style={{cursor:"default"}}>
            <span className="settingrow__label">
              <span className="settingrow__name">{c.num}</span>
              <span className="settingrow__desc">Mobile</span>
            </span>
            <Icon.Phone size={20} style={{opacity:.5}}/>
          </div>
          <div style={{height:24}}/>
        </div>
      </React.Fragment>
    );
  }

  /* ---------------- SETTINGS ---------------- */
  function Toggle({ on, onClick }){
    return <span className={"toggle"+(on?" on":"")} onClick={onClick}><span className="toggle__knob"/></span>;
  }

  function Settings({ nav, t, setT }){
    const flip = (k)=> setT(k, !t[k]);
    const bridge = window.useBeeper ? window.useBeeper() : { nets:{} };
    const NETS = window.Beeper ? window.Beeper.NETWORKS : {};
    const order = window.Beeper ? window.Beeper.NET_IDS : [];
    return (
      <React.Fragment>
        <StatusBar label="Settings"/>
        <Header title="Settings" onBack={()=>nav("list")}/>
        <div className="body">
          <div className="grouplabel">Accounts</div>
          {order.map(nid=>{
            const meta = NETS[nid];
            const st = (bridge.nets && bridge.nets[nid]) || { connected:false };
            const acct = st.account || {};
            const sub = st.connected
              ? "Linked via Beeper · "+(acct.number||acct.username||meta.bridge)
              : "Connect through a Beeper bridge";
            return (
              <button className="settingrow" key={nid} onClick={()=>nav("connect",{network:nid})}>
                <NetGlyph network={nid} size={26}/>
                <span className="settingrow__label">
                  <span className="settingrow__name">{meta.label}</span>
                  <span className="settingrow__desc">{sub}</span>
                </span>
                <span className="settingrow__val">{st.connected?"Linked":"Connect"}</span>
                <Icon.Chevron size={20} style={{opacity:.4}}/>
              </button>
            );
          })}
          <div className="grouplabel">Mindful messaging</div>
          <div className="settingrow">
            <Icon.Clock size={22}/>
            <span className="settingrow__label">
              <span className="settingrow__name">Batched delivery</span>
              <span className="settingrow__desc">Hold non-urgent messages, deliver three times a day.</span>
            </span>
            <Toggle on={t.mindful} onClick={()=>flip("mindful")}/>
          </div>
          <div className="settingrow">
            <Icon.Leaf size={22}/>
            <span className="settingrow__label">
              <span className="settingrow__name">Hide read receipts</span>
              <span className="settingrow__desc">No blue ticks. Reply when you’re ready, without guilt.</span>
            </span>
            <Toggle on={t.noReceipts} onClick={()=>flip("noReceipts")}/>
          </div>
          <div className="settingrow">
            <Icon.BellOff size={22}/>
            <span className="settingrow__label">
              <span className="settingrow__name">Silent by default</span>
              <span className="settingrow__desc">A single daily summary. No buzzing, no badges.</span>
            </span>
            <Toggle on={t.silent} onClick={()=>flip("silent")}/>
          </div>
          <div className="grouplabel">Display</div>
          <div className="settingrow">
            <Icon.Moon size={22}/>
            <span className="settingrow__label">
              <span className="settingrow__name">Inverted E Ink</span>
              <span className="settingrow__desc">White on black. Easier in low light.</span>
            </span>
            <Toggle on={t.invert} onClick={()=>flip("invert")}/>
          </div>
          <div className="settingrow" onClick={()=>setT("compact", !t.compact)}>
            <Icon.Sliders size={22}/>
            <span className="settingrow__label">
              <span className="settingrow__name">Text size</span>
              <span className="settingrow__desc">Comfortable spacing for long reading.</span>
            </span>
            <span className="settingrow__val">{t.compact?"Compact":"Comfortable"}</span>
          </div>
          <div className="settingrow" onClick={()=>setT("flat", !t.flat)}>
            <Icon.Reply size={22}/>
            <span className="settingrow__label">
              <span className="settingrow__name">Conversation style</span>
              <span className="settingrow__desc">How messages are laid out in a thread.</span>
            </span>
            <span className="settingrow__val">{t.flat?"Typographic":"Bubbles"}</span>
          </div>
          <div className="grouplabel">About</div>
          <div className="settingrow" style={{cursor:"default"}}>
            <span className="settingrow__label">
              <span className="settingrow__name">WhatsApp for Kompakt</span>
              <span className="settingrow__desc">Mindful build · v1.0 · E Ink optimised</span>
            </span>
          </div>
          <div style={{height:24}}/>
        </div>
      </React.Fragment>
    );
  }

  /* ---------------- LOCK / NOTIFICATION ---------------- */
  function LockNotification({ nav, t }){
    return (
      <div className="notif">
        <StatusBar label=""/>
        <div className="notif__clock">
          <div className="notif__time">14:02</div>
          <div className="notif__date">Monday · 8 June</div>
        </div>
        <div className="notif__card">
          <div className="notif__head">
            <Avatar initials="ML" size={44}/>
            <span className="notif__count">{t.mindful ? "Quiet delivery" : "New message"}</span>
          </div>
          <div className="notif__msg">
            {t.mindful
              ? "3 messages gathered for you this afternoon."
              : "“Walking by the canal — call when you’re free?”"}
          </div>
          <div className="notif__from">
            {t.mindful ? "From Maya, the allotment group, and Theo" : "Maya Lindqvist · now"}
          </div>
          <div className="notif__foot">
            <button className="btn" onClick={()=>nav("list")}>Open later</button>
            <button className="btn btn--solid" onClick={()=>nav(t.mindful?"list":"thread",{id:"maya"})}>
              {t.mindful ? "Read now" : "Reply"}
            </button>
          </div>
        </div>
        <div className="notif__hint">Press the key to wake · swipe up to open</div>
      </div>
    );
  }

  Object.assign(window, { ChatList, Contacts, ContactDetail, Settings, LockNotification, TabBar, Toggle });
})();
