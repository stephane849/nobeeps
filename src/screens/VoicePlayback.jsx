import React, { useState, useEffect, useRef } from 'react';
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
  const { id, dur = "0:42", from = "Theo", record, audioUrl } = route.params;
  const c = DATA.byId[id];

  if (record) {
    return <VoiceRecord nav={nav} id={id} c={c} />;
  }

  const total = parseTime(dur);
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(0);
  const audioRef = useRef(null);
  const N = 42;

  useEffect(() => {
    if (!audioUrl || !audioRef.current) return;
    const audio = audioRef.current;
    const onTime = () => setPos(audio.currentTime);
    const onEnd = () => { setPlaying(false); setPos(audio.duration || total); };
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnd);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnd);
    };
  }, [audioUrl, total]);

  useEffect(() => {
    if (audioUrl) return;
    if (!playing) return;
    const iv = setInterval(() => {
      setPos(p => {
        if (p >= total) { setPlaying(false); return total; }
        return p + 0.1;
      });
    }, 100);
    return () => clearInterval(iv);
  }, [playing, total, audioUrl]);

  function togglePlay() {
    if (audioUrl && audioRef.current) {
      if (playing) {
        audioRef.current.pause();
        setPlaying(false);
      } else {
        audioRef.current.play().catch(() => {});
        setPlaying(true);
      }
    } else {
      setPlaying(p => !p);
    }
  }

  const displayPos = audioUrl && audioRef.current ? audioRef.current.currentTime : pos;
  const displayTotal = audioUrl && audioRef.current && audioRef.current.duration
    ? audioRef.current.duration : total;
  const playedBar = Math.floor((displayPos / displayTotal) * N) - 1;
  const heights = Array.from({ length: N }, (_, i) => 20 + Math.abs(Math.sin(i * 0.9) + Math.cos(i * 0.4)) * 60);

  return (
    <React.Fragment>
      <StatusBar label="" />
      <Header title="Voice message" sub={`From ${from}`} onBack={() => nav("thread", { id })} />
      {audioUrl && <audio ref={audioRef} src={audioUrl} preload="auto" style={{ display: "none" }} />}
      <div className="voiceplay">
        <Avatar initials={c ? c.initials : "?"} size={88} />
        <div className="voiceplay__wave">
          {heights.map((h, i) => (
            <span key={i} className={i <= playedBar ? "played" : "future"} style={{ height: h + "%" }} />
          ))}
        </div>
        <div className="voiceplay__time">{fmt(displayPos)} / {fmt(displayTotal)}</div>
        <div className="voiceplay__bigplay" onClick={togglePlay}>
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
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => {
    const iv = setInterval(() => setSec(s => s + 0.1), 100);
    navigator.mediaDevices?.getUserMedia({ audio: true }).then(stream => {
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = e => chunksRef.current.push(e.data);
      mr.start();
      mediaRef.current = mr;
    }).catch(() => {});
    return () => {
      clearInterval(iv);
      if (mediaRef.current && mediaRef.current.state !== 'inactive') {
        mediaRef.current.stop();
        mediaRef.current.stream?.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  function discard() {
    if (mediaRef.current && mediaRef.current.state !== 'inactive') {
      mediaRef.current.stop();
      mediaRef.current.stream?.getTracks().forEach(t => t.stop());
    }
    nav("thread", { id });
  }

  const heights = Array.from({ length: 42 }, (_, i) => 20 + Math.abs(Math.sin(i * 0.8 + sec)) * 60);
  return (
    <React.Fragment>
      <StatusBar label="" />
      <Header title={c ? c.name : id} sub="Recording" onBack={discard} />
      <div className="voiceplay">
        <div className="call__status" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 12, height: 12, borderRadius: "50%", background: "var(--ink)" }} /> REC
        </div>
        <div className="voiceplay__wave">
          {heights.map((h, i) => <span key={i} className="played" style={{ height: h + "%" }} />)}
        </div>
        <div className="voiceplay__time">{fmt(sec)}</div>
        <div className="contact-actions" style={{ maxWidth: 300 }}>
          <button className="btn" onClick={discard}>Discard</button>
          <button className="btn btn--solid" onClick={discard}>
            <Icon.Send size={20} /> Send
          </button>
        </div>
      </div>
    </React.Fragment>
  );
}
