import React from 'react';
import { Icon } from '../icons';
import { StatusBar, Header, Avatar } from '../ui';
import { DATA } from '../data';

export function ContactDetail({ nav, route }) {
  const c = DATA.byId[route.params.id];
  return (
    <React.Fragment>
      <StatusBar label="Contact" />
      <Header title="" onBack={() => nav("contacts")}
        right={<button className="header__btn" aria-label="More"><Icon.More /></button>} />
      <div className="body">
        <div className="contact-hero">
          <Avatar initials={c.initials} square={c.group} />
          <span className="contact-hero__name">{c.name}</span>
          <span className="contact-hero__num">{c.num}</span>
          <div className="contact-actions">
            <button className="btn" onClick={() => nav("thread", { id: c.id })}>
              <Icon.Reply size={20} /> Message
            </button>
            <button className="btn" onClick={() => nav("call", { id: c.id })}>
              <Icon.Phone size={20} /> Call
            </button>
          </div>
        </div>
        <div className="grouplabel">Presence</div>
        <div className="settingrow" style={{ cursor: "default" }}>
          <Icon.Leaf size={22} />
          <span className="settingrow__label">
            <span className="settingrow__name">No last-seen pressure</span>
            <span className="settingrow__desc">You won't see when they were online, and they won't see you.</span>
          </span>
        </div>
        <div className="settingrow" style={{ cursor: "default" }}>
          <Icon.Clock size={22} />
          <span className="settingrow__label">
            <span className="settingrow__name">Replies on your time</span>
            <span className="settingrow__desc">Messages from {c.name.split(" ")[0]} arrive at your next quiet delivery.</span>
          </span>
        </div>
        <div className="grouplabel">Details</div>
        <div className="settingrow" style={{ cursor: "default" }}>
          <span className="settingrow__label">
            <span className="settingrow__name">{c.num}</span>
            <span className="settingrow__desc">Mobile</span>
          </span>
          <Icon.Phone size={20} style={{ opacity: .5 }} />
        </div>
        <div style={{ height: 24 }} />
      </div>
    </React.Fragment>
  );
}
