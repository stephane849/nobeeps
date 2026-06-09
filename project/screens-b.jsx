/* screens-b.jsx — Thread, Compose, VoicePlayback, Call */
(function(){
  const { Icon, StatusBar, Header, Avatar, Wave, Keyboard, DATA } = window;
  const { useState, useEffect, useRef } = React;

  /* ---------------- THREAD ---------------- */
  function Thread({ nav, route, t }){
    const id = route.params.id;
    const c = DATA.byId[id];
    const base = DATA.THREADS[id] || [{day:"Today"}];
    const [extra, setExtra] = useState((window.__sent && window.__sent[id]) || []);
    const bodyRef = useRef(null);
    const msgs = base.concat(extra);

    useEffect(()=>{
      if(bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    },[extra.length]);

    function send(text){
      if(!text || !text.trim()) return;
      const m = {from:"me", t:"14:03", text:text.trim()};
      (window.__sent[id] = window.__sent[id] || []).push(m);
      setExtra(e=>e.concat([m]));
    }

    const quick = ["On my way ☺","Call you at 16:30","Thank you","Not right now"];

    return (
      <React.Fragment>
        <StatusBar label=""/>
        <Header
          title={c.name}
          sub={t.noReceipts ? (c.group ? c.num : "Reply when you can") : "online"}
          onBack={()=>nav("list")}
          right={
            <React.Fragment>
              <button className="header__btn" aria-label="Call" onClick={()=>nav("call",{id})}><Icon.Phone/></button>
              <button className="header__btn" aria-label="More"><Icon.More/></button>
            </React.Fragment>
          }
        />
        <div className="body" ref={bodyRef}>
          <div className={"thread"+(t.flat?" flat":"")}>
            {msgs.map((m,i)=>{
              if(m.day) return <div className="daystamp" key={"d"+i}>{m.day}</div>;
              const me = m.from==="me";
              return (
                <div className={"msg"+(me?" me":"")} key={i}>
                  {t.flat && <span className="msg__author">{me?"You":(m.author||c.name.split(" ")[0])}</span>}
                  <div className="msg__bubble">
                    {m.kind==="voice"
                      ? <VoiceBubble dur={m.dur} onOpen={()=>nav("voice",{id, dur:m.dur, from:me?"You":c.name})}/>
                      : m.text}
                  </div>
                  <span className="msg__meta">
                    {m.t}{me && !t.noReceipts ? " · delivered" : ""}
                  </span>
                </div>
              );
            })}
            {t.mindful && (
              <div className="daystamp" style={{borderStyle:"dashed",opacity:.7}}>
                Held until 16:30 · arrives calmly
              </div>
            )}
          </div>
        </div>
        <QuickReplies items={quick} onPick={send}/>
        <ComposerBar id={id} onSend={send} onCompose={()=>nav("compose",{id})} onVoice={()=>nav("voice",{id, record:true})}/>
      </React.Fragment>
    );
  }

  function VoiceBubble({ dur, onOpen }){
    return (
      <button className="voicemsg" onClick={onOpen}
        style={{background:"none",border:"none",color:"inherit",cursor:"pointer",padding:0,font:"inherit"}}>
        <span className="voicemsg__play"><Icon.Play size={16}/></span>
        <span className="voicemsg__wave">
          <Wave n={16}/>
        </span>
        <span className="voicemsg__time">{dur}</span>
      </button>
    );
  }

  function QuickReplies({ items, onPick }){
    return (
      <div className="quickreplies">
        {items.map((q,i)=><button className="chip" key={i} onClick={()=>onPick(q)}>{q}</button>)}
      </div>
    );
  }

  function ComposerBar({ onCompose, onVoice }){
    return (
      <div className="composer">
        <button className="iconbtn" aria-label="Camera"><Icon.Camera/></button>
        <button className="composer__field placeholder" onClick={onCompose}
          style={{cursor:"text",textAlign:"left"}}>
          Write a message…
        </button>
        <button className="iconbtn iconbtn--round" aria-label="Voice message" onClick={onVoice}>
          <Icon.Mic/>
        </button>
      </div>
    );
  }

  /* ---------------- COMPOSE (full keyboard) ---------------- */
  function Compose({ nav, route }){
    const id = route.params.id;
    const c = DATA.byId[id];
    const [text, setText] = useState("");
    const [shift, setShift] = useState(true);

    function commit(){
      // append to thread by stashing on window cache then navigating back
      window.__pendingSend = { id, text };
      nav("thread",{id});
    }

    return (
      <React.Fragment>
        <StatusBar label=""/>
        <Header title={c.name} sub="Composing" onBack={()=>nav("thread",{id})}/>
        <div className="body" style={{display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
          <div style={{padding:"20px"}}>
            <div className="msg me" style={{maxWidth:"100%"}}>
              <div className="msg__bubble" style={{minHeight:54,borderRadius:"16px 4px 16px 16px"}}>
                {text || <span style={{opacity:.4}}>Take your time…</span>}
              </div>
            </div>
          </div>
        </div>
        <div className="composer">
          <div className={"composer__field"+(text?"":" placeholder")} style={{maxHeight:120,overflow:"auto"}}>
            {text || "Write a message…"}
          </div>
          <button className="iconbtn iconbtn--solid iconbtn--round" aria-label="Send"
            onClick={commit} disabled={!text}><Icon.Send/></button>
        </div>
        <Keyboard
          shift={shift}
          onShift={()=>setShift(s=>!s)}
          onKey={(k)=>{ setText(x=>x+k); setShift(false); }}
          onSpace={()=>setText(x=>x+" ")}
          onDelete={()=>setText(x=>x.slice(0,-1))}
          onSend={commit}
        />
      </React.Fragment>
    );
  }

  /* ---------------- VOICE PLAYBACK ---------------- */
  function VoicePlayback({ nav, route }){
    const { id, dur="0:42", from="Theo", record } = route.params;
    const c = DATA.byId[id];
    const total = parseTime(dur);
    const [playing, setPlaying] = useState(false);
    const [pos, setPos] = useState(0);
    const N = 42;

    useEffect(()=>{
      if(!playing) return;
      const iv = setInterval(()=>{
        setPos(p=>{
          if(p >= total){ setPlaying(false); return total; }
          return p + 0.1;
        });
      },100);
      return ()=>clearInterval(iv);
    },[playing,total]);

    const playedBar = Math.floor((pos/total)*N) - 1;
    const heights = Array.from({length:N},(_,i)=> 20 + Math.abs(Math.sin(i*0.9)+Math.cos(i*0.4))*60);

    if(record){
      return <VoiceRecord nav={nav} id={id} c={c}/>;
    }

    return (
      <React.Fragment>
        <StatusBar label=""/>
        <Header title="Voice message" sub={`From ${from}`} onBack={()=>nav("thread",{id})}/>
        <div className="voiceplay">
          <Avatar initials={c.initials} size={88}/>
          <div className="voiceplay__wave">
            {heights.map((h,i)=>(
              <span key={i} className={i<=playedBar?"played":"future"} style={{height:h+"%"}}/>
            ))}
          </div>
          <div className="voiceplay__time">{fmt(pos)} / {dur}</div>
          <div className="voiceplay__bigplay" onClick={()=>setPlaying(p=>!p)}>
            {playing ? <Icon.Pause size={40}/> : <Icon.Play size={40}/>}
          </div>
          <div className="center-note" style={{padding:"0 20px"}}>
            Listen once, at your own pace. Nothing auto-plays here.
          </div>
        </div>
      </React.Fragment>
    );
  }

  function VoiceRecord({ nav, id, c }){
    const [sec, setSec] = useState(0);
    useEffect(()=>{
      const iv = setInterval(()=>setSec(s=>s+0.1),100);
      return ()=>clearInterval(iv);
    },[]);
    const heights = Array.from({length:42},(_,i)=> 20 + Math.abs(Math.sin(i*0.8+sec))*60);
    return (
      <React.Fragment>
        <StatusBar label=""/>
        <Header title={c.name} sub="Recording" onBack={()=>nav("thread",{id})}/>
        <div className="voiceplay">
          <div className="call__status" style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{width:12,height:12,borderRadius:"50%",background:"var(--ink)"}}/> REC
          </div>
          <div className="voiceplay__wave">
            {heights.map((h,i)=><span key={i} className="played" style={{height:h+"%"}}/>)}
          </div>
          <div className="voiceplay__time">{fmt(sec)}</div>
          <div className="contact-actions" style={{maxWidth:300}}>
            <button className="btn" onClick={()=>nav("thread",{id})}>Discard</button>
            <button className="btn btn--solid" onClick={()=>nav("thread",{id})}>
              <Icon.Send size={20}/> Send
            </button>
          </div>
        </div>
      </React.Fragment>
    );
  }

  /* ---------------- CALL ---------------- */
  // Beeper's WhatsApp bridge relays messages, not live voice/video calls — those
  // stay on the phone's WhatsApp. So when the bridge is connected we offer a mindful,
  // async "request a call" (a message the bridge CAN send) instead of ringing.
  function Call({ nav, route }){
    const bridge = window.useBeeper ? window.useBeeper() : { connected:false };
    return bridge.connected
      ? <CallRequest nav={nav} route={route}/>
      : <CallLive nav={nav} route={route}/>;
  }

  function CallRequest({ nav, route }){
    const id = route.params.id;
    const c = DATA.byId[id];
    const first = c.name.split(" ")[0];
    const [sent, setSent] = useState(false);

    function request(){
      const m = { from:"me", t:"14:03", text:`Could we talk when you’re free? No rush — call me whenever suits.` };
      window.__sent = window.__sent || {};
      (window.__sent[id] = window.__sent[id] || []).push(m);
      setSent(true);
    }

    return (
      <div className="callscreen" style={{justifyContent:"center",gap:30}}>
        <Avatar initials={c.initials} size={120}/>
        <div style={{textAlign:"center"}}>
          <div className="call__name" style={{marginTop:0}}>{first}</div>
          <div className="call__status" style={{marginTop:12}}>
            {sent ? "Call requested" : "Calls stay on your phone"}
          </div>
        </div>
        {!sent ? (
          <React.Fragment>
            <p style={{margin:0,fontSize:"var(--fs-small)",lineHeight:1.55,textAlign:"center",opacity:.85,maxWidth:340}}>
              WhatsApp voice &amp; video calls aren’t carried over the Beeper bridge — they
              ring on your phone’s WhatsApp. Instead, send {first} a calm request to talk.
            </p>
            <div style={{display:"flex",flexDirection:"column",gap:12,width:"100%",maxWidth:340}}>
              <button className="btn btn--solid" onClick={request}>
                <Icon.Phone size={20}/> Request a call
              </button>
              <button className="btn" onClick={()=>nav("thread",{id})}>Back to chat</button>
            </div>
          </React.Fragment>
        ) : (
          <React.Fragment>
            <p style={{margin:0,fontSize:"var(--fs-small)",lineHeight:1.55,textAlign:"center",opacity:.85,maxWidth:340}}>
              Sent. {first} will see it at their next quiet delivery and can ring you back
              on WhatsApp when the moment’s right.
            </p>
            <button className="btn btn--solid" style={{maxWidth:340}} onClick={()=>nav("thread",{id})}>
              <Icon.Check size={20}/> Done
            </button>
          </React.Fragment>
        )}
      </div>
    );
  }

  function CallLive({ nav, route }){
    const c = DATA.byId[route.params.id];
    const [sec, setSec] = useState(0);
    const [mute, setMute] = useState(false);
    const [spk, setSpk] = useState(false);
    useEffect(()=>{
      const iv = setInterval(()=>setSec(s=>s+1),1000);
      return ()=>clearInterval(iv);
    },[]);
    return (
      <div className="screen-inner callscreen">
        <div style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
          <div className="call__avatar">{c.initials}</div>
          <div className="call__name">{c.name.split(" ")[0]}</div>
          <div className="call__status">{c.num}</div>
          <div className="call__timer">{fmt(sec)}</div>
        </div>
        <div className="call__actions">
          <div className="call__action">
            <button className={"iconbtn iconbtn--round"+(mute?" active":"")} onClick={()=>setMute(m=>!m)}>
              {mute ? <Icon.MuteMic size={26}/> : <Icon.Mic size={26}/>}
            </button>
            <span>{mute?"Muted":"Mute"}</span>
          </div>
          <div className="call__action">
            <button className={"iconbtn iconbtn--round"+(spk?" active":"")} onClick={()=>setSpk(s=>!s)}>
              <Icon.Speaker size={26}/>
            </button>
            <span>Speaker</span>
          </div>
          <div className="call__action">
            <button className="iconbtn iconbtn--round"><Icon.Add size={26}/></button>
            <span>Add</span>
          </div>
        </div>
        <div className="call__action call__end">
          <button className="iconbtn iconbtn--round" style={{width:78,height:78}}
            onClick={()=>nav("thread",{id:route.params.id})}>
            <Icon.Phone size={30} style={{transform:"rotate(135deg)"}}/>
          </button>
          <span style={{fontSize:12,letterSpacing:".08em",textTransform:"uppercase",marginTop:8}}>End</span>
        </div>
      </div>
    );
  }

  function parseTime(s){ const [m,sec]=s.split(":").map(Number); return m*60+sec; }
  function fmt(t){ t=Math.max(0,Math.floor(t)); const m=Math.floor(t/60); const s=t%60;
    return m+":"+String(s).padStart(2,"0"); }

  Object.assign(window, { Thread, Compose, VoicePlayback, Call });
})();
