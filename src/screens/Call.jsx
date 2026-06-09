import React, { useState, useEffect } from 'react';
import { Icon } from '../icons';
import { Avatar } from '../ui';
import { DATA } from '../data';
import { useBeeper } from '../beeper';

function fmt(t) {
  t = Math.max(0, Math.floor(t));
  const m = Math.floor(t / 60);
  const s = t % 60;
  return m + ":" + String(s).padStart(2, "0");
}

export function Call({ nav, route }) {
  const bridge = useBeeper();
  return bridge.connected
    ? <CallRequest nav={nav} route={route} />
    : <CallLive nav={nav} route={route} />;
}

function CallRequest({ nav, route }) {
  const id = route.params.id;
  const c = DATA.byId[id];
  const first = c.name.split(" ")[0];
  const [sent, setSent] = useState(false);

  function request() {
    const m = { from: "me", t: "14:03", text: `Could we talk when you're free? No rush — call me whenever suits.` };
    window.__sent = window.__sent || {};
    (window.__sent[id] = window.__sent[id] || []).push(m);
    setSent(true);
  }

  return (
    <div className="callscreen" style={{ justifyContent: "center", gap: 30 }}>
      <Avatar initials={c.initials} size={120} />
      <div style={{ textAlign: "center" }}>
        <div className="call__name" style={{ marginTop: 0 }}>{first}</div>
        <div className="call__status" style={{ marginTop: 12 }}>
          {sent ? "Call requested" : "Calls stay on your phone"}
        </div>
      </div>
      {!sent ? (
        <React.Fragment>
          <p style={{ margin: 0, fontSize: "var(--fs-small)", lineHeight: 1.55, textAlign: "center", opacity: .85, maxWidth: 340 }}>
            WhatsApp voice &amp; video calls aren't carried over the Beeper bridge — they
            ring on your phone's WhatsApp. Instead, send {first} a calm request to talk.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 340 }}>
            <button className="btn btn--solid" onClick={request}>
              <Icon.Phone size={20} /> Request a call
            </button>
            <button className="btn" onClick={() => nav("thread", { id })}>Back to chat</button>
          </div>
        </React.Fragment>
      ) : (
        <React.Fragment>
          <p style={{ margin: 0, fontSize: "var(--fs-small)", lineHeight: 1.55, textAlign: "center", opacity: .85, maxWidth: 340 }}>
            Sent. {first} will see it at their next quiet delivery and can ring you back
            on WhatsApp when the moment's right.
          </p>
          <button className="btn btn--solid" style={{ maxWidth: 340 }} onClick={() => nav("thread", { id })}>
            <Icon.Check size={20} /> Done
          </button>
        </React.Fragment>
      )}
    </div>
  );
}

function CallLive({ nav, route }) {
  const c = DATA.byId[route.params.id];
  const [sec, setSec] = useState(0);
  const [mute, setMute] = useState(false);
  const [spk, setSpk] = useState(false);
  useEffect(() => {
    const iv = setInterval(() => setSec(s => s + 1), 1000);
    return () => clearInterval(iv);
  }, []);
  return (
    <div className="callscreen">
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div className="call__avatar">{c.initials}</div>
        <div className="call__name">{c.name.split(" ")[0]}</div>
        <div className="call__status">{c.num}</div>
        <div className="call__timer">{fmt(sec)}</div>
      </div>
      <div className="call__actions">
        <div className="call__action">
          <button className={"iconbtn iconbtn--round" + (mute ? " active" : "")} onClick={() => setMute(m => !m)}>
            {mute ? <Icon.MuteMic size={26} /> : <Icon.Mic size={26} />}
          </button>
          <span>{mute ? "Muted" : "Mute"}</span>
        </div>
        <div className="call__action">
          <button className={"iconbtn iconbtn--round" + (spk ? " active" : "")} onClick={() => setSpk(s => !s)}>
            <Icon.Speaker size={26} />
          </button>
          <span>Speaker</span>
        </div>
        <div className="call__action">
          <button className="iconbtn iconbtn--round"><Icon.Add size={26} /></button>
          <span>Add</span>
        </div>
      </div>
      <div className="call__action call__end">
        <button className="iconbtn iconbtn--round" style={{ width: 78, height: 78 }}
          onClick={() => nav("thread", { id: route.params.id })}>
          <Icon.Phone size={30} style={{ transform: "rotate(135deg)" }} />
        </button>
        <span style={{ fontSize: 12, letterSpacing: ".08em", textTransform: "uppercase", marginTop: 8 }}>End</span>
      </div>
    </div>
  );
}
