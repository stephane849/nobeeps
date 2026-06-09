import React, { useState, useEffect } from 'react';
import { Icon } from '../icons';
import { Header, Avatar, NetTag } from '../ui';
import { useBeeper, Beeper, poll } from '../beeper';

export function ChatList({ nav, t }) {
  const bridge = useBeeper();
  const [live, setLive] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!bridge.connected) { setLive(null); setLoading(false); return; }
    let alive = true;
    setLoading(true);
    const stop = poll(async () => {
      const arr = await Beeper.getChats();
      if (!alive) return;
      setLoading(false);
      if (arr) setLive(arr);
    }, 10000);
    return () => { alive = false; stop(); };
  }, [bridge.connected]);

  const rows = live || [];
  const netsShown = new Set(rows.map(c => c.network).filter(Boolean));
  const showTags = netsShown.size > 1;

  return (
    <React.Fragment>
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
          <span>Connect WhatsApp or Telegram to get started</span>
          <Icon.Chevron size={18} style={{ opacity: .5 }} />
        </button>
      )}
      {t.mindful && rows.length > 0 && (
        <div className="batch-banner">
          <Icon.Clock size={17} sw={1.8} />
          <span><span className="next">Next delivery 16:30</span> · messages waiting quietly</span>
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
        {bridge.connected && rows.length === 0 && (
          <div className="center-note" style={{ minHeight: 200 }}>
            {loading ? "Loading messages…" : "No messages yet. You're all caught up."}
          </div>
        )}
        {!bridge.connected && (
          <div className="center-note" style={{ minHeight: 200, flexDirection: "column", gap: 16 }}>
            <span>No messages yet.</span>
            <button className="btn btn--solid" style={{ width: "auto", padding: "12px 24px" }}
              onClick={() => nav("settings")}>
              Connect an account
            </button>
          </div>
        )}
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
