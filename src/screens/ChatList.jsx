import React, { useState, useEffect } from 'react';
import { Icon } from '../icons';
import { StatusBar, Header, Avatar, NetTag } from '../ui';
import { DATA } from '../data';
import { useBeeper, Beeper, poll } from '../beeper';

export function ChatList({ nav, t }) {
  const bridge = useBeeper();
  const [live, setLive] = useState(null);

  useEffect(() => {
    if (!bridge.connected) { setLive(null); return; }
    let alive = true;
    const stop = poll(async () => {
      const arr = await Beeper.getChats();
      if (alive && arr) setLive(arr);
    }, 10000);
    return () => { alive = false; stop(); };
  }, [bridge.connected]);

  let rows = live || DATA.CHATS.map(c => {
    const p = DATA.byId[c.id];
    return {
      id: c.id, name: p.name, initials: p.initials, unread: c.unread,
      time: c.time, snippet: c.snippet, group: c.group, pinned: c.pinned, network: c.network
    };
  });
  if (bridge.connected && bridge.connectedNets) {
    rows = rows.filter(c => !c.network || bridge.connectedNets.includes(c.network));
  }
  const netsShown = new Set(rows.map(c => c.network).filter(Boolean));
  const showTags = netsShown.size > 1;

  return (
    <React.Fragment>
      <StatusBar label="Messages" />
      <Header
        title="Messages"
        right={
          <React.Fragment>
            <button className="header__btn" aria-label="Search"><Icon.Search /></button>
            <button className="header__btn" aria-label="New message"
              onClick={() => nav("contacts", { pick: true })}><Icon.Plus /></button>
          </React.Fragment>
        }
      />
      {!bridge.connected && (
        <button className="bridge-cta" onClick={() => nav("settings")}>
          <Icon.People size={18} />
          <span>Connect WhatsApp or Telegram through a Beeper bridge</span>
          <Icon.Chevron size={18} style={{ opacity: .5 }} />
        </button>
      )}
      {t.mindful && (
        <div className="batch-banner">
          <Icon.Clock size={17} sw={1.8} />
          <span><span className="next">Next delivery 16:30</span> · 3 messages waiting quietly</span>
        </div>
      )}
      <div className="body">
        {rows.map(c => (
          <button className="chatrow" key={c.id} onClick={() => nav("thread", { id: c.id })}>
            <Avatar initials={c.initials} square={c.group} filled={c.pinned} />
            <span className="chatrow__main">
              <span className="chatrow__top">
                <span className="chatrow__name">{c.name}</span>
                <span className="chatrow__time">{c.time}</span>
              </span>
              <span className="chatrow__bottom">
                <span className="chatrow__snippet-wrap">
                  {showTags && <NetTag network={c.network} />}
                  <span className={"chatrow__snippet" + (c.unread ? " unread" : "")}>{c.snippet}</span>
                </span>
                {c.unread > 0 && <span className="unread-count">{c.unread}</span>}
              </span>
            </span>
          </button>
        ))}
        <div className="center-note" style={{ minHeight: 120 }}>
          {bridge.connected
            ? (bridge.demo ? "Bridge linked · showing demo data (Beeper API not reachable from here)."
              : "You're all caught up. Nothing else needs you right now.")
            : "You're all caught up. Nothing else needs you right now."}
        </div>
      </div>
      <TabBar nav={nav} active="messages" />
    </React.Fragment>
  );
}

export function TabBar({ nav, active }) {
  const tabs = [
    { id: "messages", label: "Messages", icon: Icon.Reply, go: () => nav("list") },
    { id: "contacts", label: "Contacts", icon: Icon.People, go: () => nav("contacts") },
    { id: "settings", label: "Settings", icon: Icon.Gear, go: () => nav("settings") },
  ];
  return (
    <div className="tabbar">
      {tabs.map(tb => (
        <button key={tb.id} className={"tab" + (active === tb.id ? " active" : "")} onClick={tb.go}>
          <tb.icon size={22} />
          <span>{tb.label}</span>
        </button>
      ))}
    </div>
  );
}
