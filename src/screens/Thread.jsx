import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '../icons';
import { StatusBar, Header, Wave } from '../ui';
import { DATA } from '../data';

export function Thread({ nav, route, t }) {
  const id = route.params.id;
  const c = DATA.byId[id];
  const base = DATA.THREADS[id] || [{ day: "Today" }];
  window.__sent = window.__sent || {};
  const [extra, setExtra] = useState((window.__sent && window.__sent[id]) || []);
  const bodyRef = useRef(null);
  const msgs = base.concat(extra);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [extra.length]);

  function send(text) {
    if (!text || !text.trim()) return;
    const m = { from: "me", t: "14:03", text: text.trim() };
    (window.__sent[id] = window.__sent[id] || []).push(m);
    setExtra(e => e.concat([m]));
  }

  const quick = ["On my way ☺", "Call you at 16:30", "Thank you", "Not right now"];

  return (
    <React.Fragment>
      <StatusBar label="" />
      <Header
        title={c.name}
        sub={t.noReceipts ? (c.group ? c.num : "Reply when you can") : "online"}
        onBack={() => nav("list")}
        right={
          <React.Fragment>
            <button className="header__btn" aria-label="Call" onClick={() => nav("call", { id })}><Icon.Phone /></button>
            <button className="header__btn" aria-label="More"><Icon.More /></button>
          </React.Fragment>
        }
      />
      <div className="body" ref={bodyRef}>
        <div className={"thread" + (t.flat ? " flat" : "")}>
          {msgs.map((m, i) => {
            if (m.day) return <div className="daystamp" key={"d" + i}>{m.day}</div>;
            const me = m.from === "me";
            return (
              <div className={"msg" + (me ? " me" : "")} key={i}>
                {t.flat && <span className="msg__author">{me ? "You" : (m.author || c.name.split(" ")[0])}</span>}
                <div className="msg__bubble">
                  {m.kind === "voice"
                    ? <VoiceBubble dur={m.dur} onOpen={() => nav("voice", { id, dur: m.dur, from: me ? "You" : c.name })} />
                    : m.text}
                </div>
                <span className="msg__meta">
                  {m.t}{me && !t.noReceipts ? " · delivered" : ""}
                </span>
              </div>
            );
          })}
          {t.mindful && (
            <div className="daystamp" style={{ borderStyle: "dashed", opacity: .7 }}>
              Held until 16:30 · arrives calmly
            </div>
          )}
        </div>
      </div>
      <QuickReplies items={quick} onPick={send} />
      <ComposerBar id={id} onSend={send} onCompose={() => nav("compose", { id })} onVoice={() => nav("voice", { id, record: true })} />
    </React.Fragment>
  );
}

function VoiceBubble({ dur, onOpen }) {
  return (
    <button className="voicemsg" onClick={onOpen}
      style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", padding: 0, font: "inherit" }}>
      <span className="voicemsg__play"><Icon.Play size={16} /></span>
      <span className="voicemsg__wave"><Wave n={16} /></span>
      <span className="voicemsg__time">{dur}</span>
    </button>
  );
}

function QuickReplies({ items, onPick }) {
  return (
    <div className="quickreplies">
      {items.map((q, i) => <button className="chip" key={i} onClick={() => onPick(q)}>{q}</button>)}
    </div>
  );
}

function ComposerBar({ onCompose, onVoice }) {
  return (
    <div className="composer">
      <button className="iconbtn" aria-label="Camera"><Icon.Camera /></button>
      <button className="composer__field placeholder" onClick={onCompose}
        style={{ cursor: "text", textAlign: "left" }}>
        Write a message…
      </button>
      <button className="iconbtn iconbtn--round" aria-label="Voice message" onClick={onVoice}>
        <Icon.Mic />
      </button>
    </div>
  );
}
