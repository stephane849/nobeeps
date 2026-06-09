import React from 'react';
import { Icon } from '../icons';
import { StatusBar, Header, NetGlyph } from '../ui';
import { useBeeper, Beeper, NET_IDS, NETWORKS } from '../beeper';
import { TabBar } from './ChatList';

function Toggle({ on, onClick }) {
  return (
    <span className={"toggle" + (on ? " on" : "")} onClick={onClick}>
      <span className="toggle__knob" />
    </span>
  );
}

export function Settings({ nav, t, setT }) {
  const flip = (k) => setT(k, !t[k]);
  const bridge = useBeeper();

  return (
    <React.Fragment>
      <StatusBar label="Settings" />
      <Header title="Settings" onBack={() => nav("list")} />
      <div className="body">
        <div className="grouplabel">Accounts</div>
        {NET_IDS.map(nid => {
          const meta = NETWORKS[nid];
          const st = (bridge.nets && bridge.nets[nid]) || { connected: false };
          const acct = st.account || {};
          const sub = st.connected
            ? "Linked via Beeper · " + (acct.number || acct.username || meta.bridge)
            : "Connect through a Beeper bridge";
          return (
            <button className="settingrow" key={nid} onClick={() => nav("connect", { network: nid })}>
              <NetGlyph network={nid} size={26} />
              <span className="settingrow__label">
                <span className="settingrow__name">{meta.label}</span>
                <span className="settingrow__desc">{sub}</span>
              </span>
              <span className="settingrow__val">{st.connected ? "Linked" : "Connect"}</span>
              <Icon.Chevron size={20} style={{ opacity: .4 }} />
            </button>
          );
        })}
        <div className="grouplabel">Mindful messaging</div>
        <div className="settingrow">
          <Icon.Clock size={22} />
          <span className="settingrow__label">
            <span className="settingrow__name">Batched delivery</span>
            <span className="settingrow__desc">Hold non-urgent messages, deliver three times a day.</span>
          </span>
          <Toggle on={t.mindful} onClick={() => flip("mindful")} />
        </div>
        <div className="settingrow">
          <Icon.Leaf size={22} />
          <span className="settingrow__label">
            <span className="settingrow__name">Hide read receipts</span>
            <span className="settingrow__desc">No blue ticks. Reply when you're ready, without guilt.</span>
          </span>
          <Toggle on={t.noReceipts} onClick={() => flip("noReceipts")} />
        </div>
        <div className="settingrow">
          <Icon.BellOff size={22} />
          <span className="settingrow__label">
            <span className="settingrow__name">Silent by default</span>
            <span className="settingrow__desc">A single daily summary. No buzzing, no badges.</span>
          </span>
          <Toggle on={t.silent} onClick={() => flip("silent")} />
        </div>
        <div className="grouplabel">Display</div>
        <div className="settingrow">
          <Icon.Moon size={22} />
          <span className="settingrow__label">
            <span className="settingrow__name">Inverted E Ink</span>
            <span className="settingrow__desc">White on black. Easier in low light.</span>
          </span>
          <Toggle on={t.invert} onClick={() => flip("invert")} />
        </div>
        <div className="settingrow" onClick={() => setT("compact", !t.compact)}>
          <Icon.Sliders size={22} />
          <span className="settingrow__label">
            <span className="settingrow__name">Text size</span>
            <span className="settingrow__desc">Comfortable spacing for long reading.</span>
          </span>
          <span className="settingrow__val">{t.compact ? "Compact" : "Comfortable"}</span>
        </div>
        <div className="settingrow" onClick={() => setT("flat", !t.flat)}>
          <Icon.Reply size={22} />
          <span className="settingrow__label">
            <span className="settingrow__name">Conversation style</span>
            <span className="settingrow__desc">How messages are laid out in a thread.</span>
          </span>
          <span className="settingrow__val">{t.flat ? "Typographic" : "Bubbles"}</span>
        </div>
        <div className="grouplabel">About</div>
        <div className="settingrow" style={{ cursor: "default" }}>
          <span className="settingrow__label">
            <span className="settingrow__name">WhatsApp for Kompakt</span>
            <span className="settingrow__desc">Mindful build · v1.0 · E Ink optimised</span>
          </span>
        </div>
        <div style={{ height: 24 }} />
      </div>
      <TabBar nav={nav} active="settings" />
    </React.Fragment>
  );
}
