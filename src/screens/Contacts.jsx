import React from 'react';
import { Icon } from '../icons';
import { StatusBar, Header, Avatar } from '../ui';
import { DATA } from '../data';
import { TabBar } from './ChatList';

export function Contacts({ nav, route }) {
  const pick = route.params && route.params.pick;
  const sorted = [...DATA.CONTACTS].sort((a, b) => a.name.localeCompare(b.name));
  const groups = {};
  sorted.forEach(c => {
    const L = c.name[0].toUpperCase();
    (groups[L] = groups[L] || []).push(c);
  });
  return (
    <React.Fragment>
      <StatusBar label="Contacts" />
      <Header
        title={pick ? "New message" : "Contacts"}
        onBack={() => nav("list")}
        right={!pick && <button className="header__btn" aria-label="Add contact"><Icon.Add /></button>}
      />
      <div className="body">
        {Object.keys(groups).map(L => (
          <div key={L}>
            <div className="alpha">{L}</div>
            {groups[L].map(c => (
              <button className="chatrow" key={c.id}
                onClick={() => pick ? nav("thread", { id: c.id }) : nav("contact", { id: c.id })}>
                <Avatar initials={c.initials} square={c.group} />
                <span className="chatrow__main">
                  <span className="chatrow__name">{c.name}</span>
                  {c.note && <span className="chatrow__snippet">{c.note}</span>}
                </span>
                {!pick && <Icon.Chevron size={20} style={{ opacity: .4 }} />}
              </button>
            ))}
          </div>
        ))}
        <div style={{ height: 24 }} />
      </div>
      {!pick && <TabBar nav={nav} active="contacts" />}
    </React.Fragment>
  );
}
