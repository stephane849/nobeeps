import React from 'react';
import { StatusBar } from '../ui';
import { Avatar } from '../ui';

export function LockNotification({ nav, t }) {
  return (
    <div className="notif">
      <StatusBar label="" />
      <div className="notif__clock">
        <div className="notif__time">14:02</div>
        <div className="notif__date">Monday · 8 June</div>
      </div>
      <div className="notif__card">
        <div className="notif__head">
          <Avatar initials="ML" size={44} />
          <span className="notif__count">{t.mindful ? "Quiet delivery" : "New message"}</span>
        </div>
        <div className="notif__msg">
          {t.mindful
            ? "3 messages gathered for you this afternoon."
            : "“Walking by the canal — call when you’re free?”"}
        </div>
        <div className="notif__from">
          {t.mindful ? "From Maya, the allotment group, and Theo" : "Maya Lindqvist · now"}
        </div>
        <div className="notif__foot">
          <button className="btn" onClick={() => nav("list")}>Open later</button>
          <button className="btn btn--solid"
            onClick={() => nav(t.mindful ? "list" : "thread", { id: "maya" })}>
            {t.mindful ? "Read now" : "Reply"}
          </button>
        </div>
      </div>
      <div className="notif__hint">Press the key to wake · swipe up to open</div>
    </div>
  );
}
