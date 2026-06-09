import React, { useState, useCallback, useEffect } from 'react';
import { useTweaks, TweaksPanel, TweakSection, TweakToggle, TweakRadio } from './TweaksPanel';
import { ChatList } from './screens/ChatList';
import { Contacts } from './screens/Contacts';
import { ContactDetail } from './screens/ContactDetail';
import { Settings } from './screens/Settings';
import { LockNotification } from './screens/LockNotification';
import { Thread } from './screens/Thread';
import { Compose } from './screens/Compose';
import { VoicePlayback } from './screens/VoicePlayback';
import { Call } from './screens/Call';
import { ConnectFlow } from './screens/ConnectFlow';
import { initNotifications, startMessagePolling, stopMessagePolling } from './notifications';

const isNative = typeof window !== 'undefined' && window?.Capacitor?.isNativePlatform?.() === true;

const DEFAULTS = {
  mindful: true, noReceipts: true, silent: true,
  invert: false, compact: false, flat: false, flash: true,
};

export default function App() {
  const [tweaks, setTweak] = useTweaks(DEFAULTS);
  const [route, setRoute] = useState({ name: "list", params: {} });
  const [flashKey, setFlashKey] = useState(0);
  const reduceMotion = typeof window !== "undefined" &&
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const nav = useCallback((name, params = {}) => {
    setRoute({ name, params });
    if (tweaks.flash && !reduceMotion) {
      const k = Date.now();
      setFlashKey(k);
      setTimeout(() => setFlashKey(cur => cur === k ? 0 : cur), 300);
    }
  }, [tweaks.flash, reduceMotion]);

  useEffect(() => {
    if (isNative) {
      initNotifications();
      startMessagePolling(nav);
      return stopMessagePolling;
    }
  }, [nav]);

  const t = tweaks;
  const setT = (k, v) => setTweak(k, v);

  let screen;
  switch (route.name) {
    case "list":     screen = <ChatList nav={nav} t={t} />; break;
    case "contacts": screen = <Contacts nav={nav} route={route} />; break;
    case "contact":  screen = <ContactDetail nav={nav} route={route} />; break;
    case "settings": screen = <Settings nav={nav} t={t} setT={setT} />; break;
    case "connect":  screen = <ConnectFlow nav={nav} route={route} />; break;
    case "thread":   screen = <Thread nav={nav} route={route} t={t} />; break;
    case "compose":  screen = <Compose nav={nav} route={route} />; break;
    case "voice":    screen = <VoicePlayback nav={nav} route={route} />; break;
    case "call":     screen = <Call nav={nav} route={route} />; break;
    case "lock":     screen = <LockNotification nav={nav} t={t} />; break;
    default:         screen = <ChatList nav={nav} t={t} />;
  }

  return (
    <div className={"app-root" + (t.compact ? " compact" : "") + (isNative ? " native-app" : "")}>
      <div className="stage">
        <div className="kompakt">
          {!isNative && <div className="kompakt__ear" />}
          {!isNative && <div className="kompakt__cam" />}
          {!isNative && <div className="kompakt__btn power" />}
          {!isNative && <div className="kompakt__btn vol" />}
          {!isNative && <div className="kompakt__btn vol2" />}
          {!isNative && <div className="kompakt__key" />}
          {!isNative && <div className="kompakt__brand">mudita</div>}
          <div className={"screen" + (t.invert ? " invert" : "")}>
            {flashKey > 0 && <div className="eink-flash" key={flashKey} />}
            {screen}
          </div>
        </div>
      </div>

      {!isNative && (
        <TweaksPanel title="Tweaks">
          <TweakSection label="Mindful patterns" />
          <TweakToggle label="Batched delivery" value={t.mindful}
            onChange={v => setTweak("mindful", v)} />
          <TweakToggle label="Hide read receipts" value={t.noReceipts}
            onChange={v => setTweak("noReceipts", v)} />
          <TweakToggle label="Silent by default" value={t.silent}
            onChange={v => setTweak("silent", v)} />
          <TweakSection label="E Ink display" />
          <TweakToggle label="Inverted (dark) mode" value={t.invert}
            onChange={v => setTweak("invert", v)} />
          <TweakToggle label="Refresh flash on navigate" value={t.flash}
            onChange={v => setTweak("flash", v)} />
          <TweakRadio label="Text size" value={t.compact ? "compact" : "comfortable"}
            options={["comfortable", "compact"]}
            onChange={v => setTweak("compact", v === "compact")} />
          <TweakRadio label="Conversation style" value={t.flat ? "typographic" : "bubbles"}
            options={["bubbles", "typographic"]}
            onChange={v => setTweak("flat", v === "typographic")} />
          <TweakSection label="Jump to screen" />
          <ScreenJump nav={nav} />
        </TweaksPanel>
      )}
    </div>
  );
}

function ScreenJump({ nav }) {
  const items = [
    ["Lock / notification", "lock", {}],
    ["Messages", "list", {}],
    ["Conversation", "thread", { id: "maya" }],
    ["Compose", "compose", { id: "maya" }],
    ["Voice playback", "voice", { id: "theo", dur: "0:42", from: "Theo" }],
    ["Call", "call", { id: "maya" }],
    ["Contacts", "contacts", {}],
    ["Contact", "contact", { id: "maya" }],
    ["Settings", "settings", {}],
    ["Connect WhatsApp", "connect", { network: "whatsapp" }],
  ];
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {items.map(([label, name, params]) => (
        <button key={label} onClick={() => nav(name, params)}
          style={{
            flex: "1 1 44%", padding: "9px 8px", border: "1.5px solid #2b2b2b",
            borderRadius: 8, background: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600,
            fontFamily: "inherit"
          }}>
          {label}
        </button>
      ))}
    </div>
  );
}
