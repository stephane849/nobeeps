import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '../icons';
import { Header, Wave } from '../ui';
import { DATA } from '../data';
import { Beeper, poll } from '../beeper';

export function Thread({ nav, route, t }) {
  const id = route.params.id;
  const c = DATA.byId[id];
  const [msgs, setMsgs] = useState(null);
  const [failedIds, setFailedIds] = useState(new Set());
  const bodyRef = useRef(null);

  useEffect(() => {
    let alive = true;
    let loaded = false;
    const stop = poll(async () => {
      const live = await Beeper.getMessages(id);
      if (!alive) return;
      if (live) setMsgs(live);
      loaded = true;
    }, 5000);
    return () => { alive = false; stop(); };
  }, [id]);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [msgs?.length]);

  async function send(text) {
    if (!text || !text.trim()) return;
    const tempId = "tmp-" + Date.now();
    const m = { id: tempId, from: "me", t: Beeper.now(), text: text.trim() };
    setMsgs(prev => (prev || []).concat([m]));
    const ok = await Beeper.send(id, text.trim());
    if (!ok) setFailedIds(s => new Set(s).add(tempId));
  }

  const rows = msgs || [];
  const quick = ["On my way ☺", "Call you at 16:30", "Thank you", "Not right now"];

  return (
    <React.Fragment>
      <Header
        title={c ? c.name : id}
        sub={t.noReceipts ? (c?.group ? c?.num : "Reply when you can") : "online"}
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
          {rows.map((m, i) => {
            if (m.day) return <div className="daystamp" key={"d" + i}>{m.day}</div>;
            const me = m.from === "me";
            const failed = m.id && failedIds.has(m.id);
            return (
              <div className={"msg" + (me ? " me" : "")} key={m.id || i}>
                {t.flat && <span className="msg__author">{me ? "You" : (m.author || c?.name?.split(" ")[0])}</span>}
                <div className="msg__bubble">
                  {m.kind === "voice"
                    ? <VoiceBubble dur={m.dur} onOpen={() => nav("voice", { id, dur: m.dur, from: me ? "You" : c?.name, audioUrl: m.audioUrl })} />
                    : m.text}
                </div>
                <span className="msg__meta">
                  {m.t}{me && !t.noReceipts ? " · delivered" : ""}{failed ? " · ✕ failed" : ""}
                </span>
              </div>
            );
          })}
          {rows.length === 0 && (
            <div className="center-note" style={{ minHeight: 160 }}>
              {msgs === null ? "Loading…" : "No messages yet. Say hello."}
            </div>
          )}
          {t.mindful && rows.length > 0 && (
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
