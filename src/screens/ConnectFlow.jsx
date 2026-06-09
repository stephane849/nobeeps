import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '../icons';
import { StatusBar, Header, NetGlyph } from '../ui';
import { Beeper, useBeeper, NETWORKS } from '../beeper';

function FauxQR({ seed = "mudita", size = 25 }) {
  const cells = [];
  let h = 2166136261;
  function rng(i) {
    let x = (h ^ (i * 2654435761)) >>> 0;
    x ^= x << 13; x >>>= 0; x ^= x >> 17; x ^= x << 5; x >>>= 0;
    return (x % 100) / 100;
  }
  for (let i = 0; i < seed.length; i++) { h = (h ^ seed.charCodeAt(i)) * 16777619 >>> 0; }
  function isFinder(r, c) {
    const inBox = (R, C) => r >= R && r < R + 7 && c >= C && c < C + 7;
    const ring = (R, C) => { const rr = r - R, cc = c - C; return rr === 0 || rr === 6 || cc === 0 || cc === 6 || (rr >= 2 && rr <= 4 && cc >= 2 && cc <= 4); };
    if (inBox(0, 0)) return ring(0, 0);
    if (inBox(0, size - 7)) return ring(0, size - 7);
    if (inBox(size - 7, 0)) return ring(size - 7, 0);
    return null;
  }
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const f = isFinder(r, c);
      const on = f === null ? rng(r * size + c) > 0.5 : f;
      cells.push(<div key={r + "-" + c} style={{ background: on ? "var(--ink)" : "var(--paper)" }} />);
    }
  }
  return (
    <div style={{
      display: "grid", gridTemplateColumns: `repeat(${size},1fr)`,
      width: 240, height: 240, border: "6px solid var(--paper)",
      boxShadow: "0 0 0 2px var(--ink)", background: "var(--paper)"
    }}>
      {cells}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, mono }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: "var(--fs-micro)", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", opacity: .85 }}>{label}</span>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        spellCheck={false} autoCapitalize="off" autoCorrect="off"
        style={{
          minHeight: "var(--tap)", border: "var(--hair) solid var(--ink)", borderRadius: 6,
          padding: "12px 14px", fontSize: "var(--fs-small)", fontFamily: mono ? "ui-monospace,Menlo,monospace" : "var(--ff)",
          background: "var(--paper)", color: "var(--ink)", width: "100%"
        }} />
    </label>
  );
}

function Row({ k, v, mono }) {
  return (
    <div className="bridge-row">
      <span className="bridge-row__k">{k}</span>
      <span className="bridge-row__v" style={mono ? { fontFamily: "ui-monospace,Menlo,monospace" } : undefined}>{v}</span>
    </div>
  );
}

export function ConnectFlow({ nav, route }) {
  const s = useBeeper();
  const net = (route && route.params && route.params.network) || "whatsapp";
  const meta = NETWORKS[net];
  const netState = (s.nets && s.nets[net]) || { connected: false, account: null };
  const acctVal = (a) => a ? (meta.idKey === "username" ? a.username : a.number) : "";

  const [step, setStep] = useState(netState.connected ? "linked" : "status");
  const [baseUrl, setBaseUrl] = useState(s.baseUrl || Beeper.DEFAULT_BASE);
  const [token, setToken] = useState(s.token || "");
  const [busy, setBusy] = useState(false);
  const [qr, setQr] = useState(null);
  const [reachable, setReachable] = useState(s.reachable);
  const [note, setNote] = useState("");
  const pollRef = useRef(null);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  async function check() {
    setBusy(true); setNote("");
    Beeper.setConfig({ baseUrl, token });
    const ok = await Beeper.ping();
    setReachable(ok);
    setBusy(false);
    setNote(ok ? "Reached Beeper Desktop." :
      "Couldn't reach Beeper at this address. You can still preview the pairing flow in demo mode.");
  }

  async function beginPairing() {
    setBusy(true); setNote("");
    Beeper.setConfig({ baseUrl, token });
    const r = await Beeper.startLogin(net);
    setBusy(false);
    setStep("pair");
    if (r && r.qr) {
      setQr(r.qr);
      if (r.loginId) {
        pollRef.current = setInterval(async () => {
          const st = await Beeper.loginStatus(net, r.loginId);
          if (st && (st.state === "linked" || st.account)) {
            clearInterval(pollRef.current);
            Beeper.markLinked(net, st.account);
            setStep("linked");
          }
        }, 2500);
      }
    } else {
      setQr("demo");
      setReachable(false);
    }
  }

  function demoLink() {
    if (pollRef.current) clearInterval(pollRef.current);
    Beeper.markLinked(net, meta.demoAccount);
    setStep("linked");
  }

  async function unlink() {
    await Beeper.disconnect(net);
    setStep("status");
    setQr(null);
  }

  if (step === "status") {
    const linked = netState.connected;
    return (
      <React.Fragment>
        <StatusBar label={meta.label + " bridge"} />
        <Header title={meta.label} sub="via Beeper bridge" onBack={() => nav("settings")} />
        <div className="body">
          <div className="contact-hero" style={{ gap: 18 }}>
            <div className="bridge-badge"><NetGlyph network={net} size={44} /></div>
            <div style={{ textAlign: "center" }}>
              <div className="contact-hero__name">{meta.label}</div>
              <div className="contact-hero__num">
                {linked ? "Linked · " + acctVal(netState.account) : "Not connected"}
              </div>
            </div>
          </div>
          <div className="section-pad">
            <p style={{ margin: 0, fontSize: "var(--fs-small)", lineHeight: 1.5, opacity: .85 }}>
              This app connects to {meta.label} through a <b>Beeper bridge</b> on the Matrix
              protocol. {meta.blurb} Messages flow into this calm E Ink client.
            </p>
            <button className="btn btn--solid" onClick={() => setStep("config")}>
              <Icon.Add size={20} /> {linked ? "Reconnect" : "Connect " + meta.label}
            </button>
            <div className="bridge-status">
              <Row k="Bridge" v={"Beeper · " + meta.bridge} />
              <Row k="Endpoint" v={s.baseUrl} mono />
              <Row k="Local API" v={s.reachable === null ? "Not checked" : (s.reachable ? "Reachable" : "Unreachable")} />
              <Row k="Mode" v={linked ? (s.demo ? "Linked (demo data)" : "Linked (live)") : "Demo data"} />
            </div>
          </div>
        </div>
      </React.Fragment>
    );
  }

  if (step === "config") {
    return (
      <React.Fragment>
        <StatusBar label={meta.label + " bridge"} />
        <Header title="Beeper bridge" sub={"Link " + meta.label} onBack={() => setStep("status")} />
        <div className="body">
          <div className="section-pad">
            <details style={{ marginBottom: 16 }}>
              <summary style={{ cursor: "pointer", fontSize: "var(--fs-small)", fontWeight: 700, paddingBottom: 8 }}>
                How to set this up
              </summary>
              <ol style={{ margin: "8px 0 0", padding: "0 0 0 18px", fontSize: "var(--fs-micro)", lineHeight: 1.7, opacity: .85 }}>
                <li>On your <b>computer</b>, open a terminal in the app folder and run: <code>node proxy.js</code></li>
                <li>Note the IP address printed (e.g. <code>192.168.1.x</code>)</li>
                <li>Enter <code>http://[that-IP]:23374</code> below and tap Check connection</li>
              </ol>
              <p style={{ margin: "8px 0 0", fontSize: "var(--fs-micro)", opacity: .7, lineHeight: 1.5 }}>
                Beeper Desktop only listens on localhost. The proxy.js script relays it over your WiFi so your phone can reach it.
              </p>
            </details>
            <p style={{ margin: 0, fontSize: "var(--fs-small)", lineHeight: 1.5, opacity: .85 }}>
              Point this client at your running <b>Beeper Desktop</b> via the proxy.
            </p>
            <Field label="Beeper API endpoint" value={baseUrl} onChange={setBaseUrl}
              placeholder="http://192.168.x.x:23374" mono />
            <Field label="Access token (optional)" value={token} onChange={setToken}
              placeholder="Bearer token from Beeper Desktop" mono />
            <button className="btn" onClick={check}>
              {busy ? "Checking…" : "Check connection"}
            </button>
            {reachable !== null && (
              <div className={"reach-pill " + (reachable ? "ok" : "no")}>
                {reachable ? <Icon.Check size={18} /> : <Icon.Close size={18} />}
                <span>{reachable ? "Beeper Desktop reachable" : "Not reachable — demo mode available"}</span>
              </div>
            )}
            {note && <p style={{ margin: 0, fontSize: "var(--fs-micro)", opacity: .75, lineHeight: 1.5 }}>{note}</p>}
            <button className="btn btn--solid" onClick={beginPairing} disabled={busy}>
              <NetGlyph network={net} size={20} /> Link {meta.label}
            </button>
          </div>
        </div>
      </React.Fragment>
    );
  }

  if (step === "pair") {
    return (
      <React.Fragment>
        <StatusBar label={meta.label + " bridge"} />
        <Header title="Link a device" sub={meta.label + " companion"} onBack={() => setStep("config")} />
        <div className="body">
          <div className="pair">
            <FauxQR seed={typeof qr === "string" && qr !== "demo" ? qr : "mudita-kompakt-" + net} />
            <ol className="pair__steps">
              {meta.steps.map((st, i) => (
                <li key={i}>{st[0]}<b>{st[1]}</b>{st[2]}</li>
              ))}
            </ol>
            {reachable
              ? <div className="reach-pill ok"><span className="pulse" /> Waiting for scan…</div>
              : <React.Fragment>
                <div className="reach-pill no">
                  <Icon.Close size={18} />
                  <span>Beeper Desktop not reachable from this preview</span>
                </div>
                <p style={{ margin: "0", fontSize: "var(--fs-micro)", opacity: .75, lineHeight: 1.5, textAlign: "center" }}>
                  In a real install this code links your account. Continue in demo mode to
                  explore the connected experience.
                </p>
                <button className="btn btn--solid" onClick={demoLink}>
                  <Icon.Check size={20} /> Simulate successful link
                </button>
              </React.Fragment>}
          </div>
        </div>
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      <StatusBar label={meta.label + " bridge"} />
      <Header title={meta.label} sub="Bridge connected" onBack={() => nav("settings")} />
      <div className="body">
        <div className="contact-hero" style={{ gap: 18 }}>
          <div className="bridge-badge linked"><Icon.Check size={40} /></div>
          <div style={{ textAlign: "center" }}>
            <div className="contact-hero__name">Linked</div>
            <div className="contact-hero__num">{acctVal(netState.account)}</div>
          </div>
        </div>
        <div className="section-pad">
          <div className="bridge-status">
            <Row k="Account" v={acctVal(netState.account) || "—"} />
            <Row k="Bridge" v={"Beeper · " + meta.bridge} />
            <Row k="Calls" v="On your phone (not bridged)" />
            <Row k="Data" v={s.demo ? "Demo (API not reachable)" : "Live"} />
            <Row k="Last sync" v={s.lastSync ? new Date(s.lastSync).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"} />
          </div>
          <p style={{ margin: 0, fontSize: "var(--fs-small)", lineHeight: 1.5, opacity: .85 }}>
            {meta.label} now arrives on <b>your</b> terms — batched delivery, no read-receipt
            pressure, silent by default. Mindful rules apply on top of the live bridge.
          </p>
          <button className="btn" onClick={() => nav("list")}>Open Messages</button>
          <button className="btn" onClick={unlink} style={{ borderStyle: "dashed" }}>Disconnect {meta.label}</button>
        </div>
      </div>
    </React.Fragment>
  );
}
