import React, { useState, useEffect } from 'react';
import { Icon } from '../icons';
import { StatusBar, Header, Avatar, Wave } from '../ui';
import { DATA } from '../data';

function parseTime(s) { const [m, sec] = s.split(":").map(Number); return m * 60 + sec; }
function fmt(t) {
  t = Math.max(0, Math.floor(t));
  const m = Math.floor(t / 60);
  const s = t % 60;
  return m + ":" + String(s).padStart(2, "0");
}

export function VoicePlayback({ nav, route }) {
  const { id, dur = "0:42", from = "Theo", record } = route.params;
  const c = DATA.byId[id];

  if (record) {
    return <VoiceRecord nav={nav} id={id} c={c} />;
  }

  const total = parseTime(dur);
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(0);
  const N = 42;

  useEffect(() => {
    if (!playing) return;
    const iv = setInterval(() => {
      setPos(p => {
        if (p >= total) { setPlaying(false); return total; }
        return p + 0.1;
      });
    }, 100);
    return () => clearInterval(iv);
  }, [playing, total]);

  const playedBar = Math.floor((pos / total) * N) - 1;
  const heights = Array.from({ length: N }, (_, i) => 20 + Math.abs(Math.sin(i * 0.9) + Math.cos(i * 0.4)) * 60);

  return (
    <React.Fragment>
      <StatusBar label="" />
      <Header title="Voice message" sub={`From ${from}`} onBack={() => nav("thread", { id })} />
      <div className="voiceplay">
        <Avatar initials={c.initials} size={88} />
        <div className="voiceplay__wave">
          {heights.map((h, i) => (
            <span key={i} className={i <= playedBar ? "played" : "future"} style={{ height: h + "%" }} />
          ))}
        </div>
        <div className="voiceplay__time">{fmt(pos)} / {dur}</div>
        <div className="voiceplay__bigplay" onClick={() => setPlaying(p => !p)}>
          {playing ? <Icon.Pause size={40} /> : <Icon.Play size={40} />}
        </div>
        <div className="center-note" style={{ padding: "0 20px" }}>
          Listen once, at your own pace. Nothing auto-plays here.
        </div>
      </div>
    </React.Fragment>
  );
}

function VoiceRecord({ nav, id, c }) {
  const [sec, setSec] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setSec(s => s + 0.1), 100);
    return () => clearInterval(iv);
  }, []);
  const heights = Array.from({ length: 42 }, (_, i) => 20 + Math.abs(Math.sin(i * 0.8 + sec)) * 60);
  return (
    <React.Fragment>
      <StatusBar label="" />
      <Header title={c.name} sub="Recording" onBack={() => nav("thread", { id })} />
      <div className="voiceplay">
        <div className="call__status" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 12, height: 12, borderRadius: "50%", background: "var(--ink)" }} /> REC
        </div>
        <div className="voiceplay__wave">
          {heights.map((h, i) => <span key={i} className="played" style={{ height: h + "%" }} />)}
        </div>
        <div className="voiceplay__time">{fmt(sec)}</div>
        <div className="contact-actions" style={{ maxWidth: 300 }}>
          <button className="btn" onClick={() => nav("thread", { id })}>Discard</button>
          <button className="btn btn--solid" onClick={() => nav("thread", { id })}>
            <Icon.Send size={20} /> Send
          </button>
        </div>
      </div>
    </React.Fragment>
  );
}
