import React, { useState } from 'react';
import { Icon } from '../icons';
import { StatusBar, Header, Keyboard } from '../ui';
import { DATA } from '../data';

export function Compose({ nav, route }) {
  const id = route.params.id;
  const c = DATA.byId[id];
  const [text, setText] = useState("");
  const [shift, setShift] = useState(true);

  function commit() {
    window.__pendingSend = { id, text };
    nav("thread", { id });
  }

  return (
    <React.Fragment>
      <StatusBar label="" />
      <Header title={c.name} sub="Composing" onBack={() => nav("thread", { id })} />
      <div className="body" style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
        <div style={{ padding: "20px" }}>
          <div className="msg me" style={{ maxWidth: "100%" }}>
            <div className="msg__bubble" style={{ minHeight: 54, borderRadius: "16px 4px 16px 16px" }}>
              {text || <span style={{ opacity: .4 }}>Take your time…</span>}
            </div>
          </div>
        </div>
      </div>
      <div className="composer">
        <div className={"composer__field" + (text ? "" : " placeholder")} style={{ maxHeight: 120, overflow: "auto" }}>
          {text || "Write a message…"}
        </div>
        <button className="iconbtn iconbtn--solid iconbtn--round" aria-label="Send"
          onClick={commit} disabled={!text}><Icon.Send /></button>
      </div>
      <Keyboard
        shift={shift}
        onShift={() => setShift(s => !s)}
        onKey={(k) => { setText(x => x + k); setShift(false); }}
        onSpace={() => setText(x => x + " ")}
        onDelete={() => setText(x => x.slice(0, -1))}
        onSend={commit}
      />
    </React.Fragment>
  );
}
