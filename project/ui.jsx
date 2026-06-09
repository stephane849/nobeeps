/* ui.jsx — shared primitives: StatusBar, Header, Avatar, Keyboard, Wave */
(function(){
  const { Icon } = window;

  function StatusBar({ label="WhatsApp", dnd=true }){
    return (
      <div className="statusbar">
        <span>{label}</span>
        <div className="sb-right">
          {dnd && <Icon.Moon size={15} sw={1.6}/>}
          <span>14:02</span>
          <span className="sb-batt">
            <span className="sb-batt__shell"><span className="sb-batt__fill" style={{width:"72%"}}/></span>
          </span>
        </div>
      </div>
    );
  }

  function Header({ title, sub, onBack, right }){
    return (
      <div className="header">
        {onBack && (
          <button className="header__btn" onClick={onBack} aria-label="Back">
            <Icon.Back/>
          </button>
        )}
        <div className="header__center">
          <span className="header__title">{title}</span>
          {sub && <span className="header__sub">{sub}</span>}
        </div>
        {right}
      </div>
    );
  }

  function Avatar({ initials, filled, square, size }){
    const cls = ["avatar"];
    if(filled) cls.push("avatar--filled");
    if(square) cls.push("avatar--sq");
    const style = size ? {width:size,height:size,fontSize:Math.round(size*0.4)} : undefined;
    return <span className={cls.join(" ")} style={style}>{initials}</span>;
  }

  // Generic per-network mark (a bordered chip with a simple glyph — not a brand logo).
  function NetGlyph({ network, size=24 }){
    const box = { width:size, height:size, borderRadius:size*0.28,
      border:"1.5px solid var(--ink)", display:"flex", alignItems:"center",
      justifyContent:"center", flex:"0 0 auto", color:"var(--ink)" };
    const inner = Math.round(size*0.62);
    const glyph = network==="telegram"
      ? <Icon.Send size={inner} sw={1.7}/>
      : <Icon.Phone size={inner} sw={1.7}/>;
    return <span style={box} aria-label={network}>{glyph}</span>;
  }

  // Tiny inline tag used on chat rows to show which network a chat came from.
  function NetTag({ network }){
    if(!network) return null;
    const label = network==="telegram" ? "TG" : "WA";
    return <span className="nettag">{label}</span>;
  }

  // deterministic-ish waveform bars
  function Wave({ n=22, played=-1, heights }){
    const bars = [];
    for(let i=0;i<n;i++){
      const h = heights ? heights[i%heights.length] : (25 + Math.abs(Math.sin(i*1.7))*70);
      const cls = played<0 ? "" : (i<=played ? "played" : "future");
      bars.push(<span key={i} className={cls} style={{height:h+"%"}}/>);
    }
    return bars;
  }

  // On-screen QWERTY keyboard
  const ROWS = [
    ["q","w","e","r","t","y","u","i","o","p"],
    ["a","s","d","f","g","h","j","k","l"],
    ["z","x","c","v","b","n","m"],
  ];
  function Keyboard({ onKey, onSpace, onDelete, onSend, shift, onShift }){
    return (
      <div className="keyboard">
        {ROWS.map((row,ri)=>(
          <div className="kbrow" key={ri}>
            {ri===2 && (
              <button className="key key--fn" onClick={onShift}
                style={shift?{background:"var(--ink)",color:"var(--paper)"}:undefined}>⇧</button>
            )}
            {row.map(k=>(
              <button className="key" key={k} onClick={()=>onKey(shift?k.toUpperCase():k)}>
                {shift?k.toUpperCase():k}
              </button>
            ))}
            {ri===2 && (
              <button className="key key--fn" onClick={onDelete} aria-label="Delete">⌫</button>
            )}
          </div>
        ))}
        <div className="kbrow">
          <button className="key key--wide">123</button>
          <button className="key" style={{maxWidth:42}}>,</button>
          <button className="key key--space" onClick={onSpace}>space</button>
          <button className="key" style={{maxWidth:42}}>.</button>
          <button className="key key--wide" onClick={onSend}
            style={{background:"var(--ink)",color:"var(--paper)"}}>send</button>
        </div>
      </div>
    );
  }

  Object.assign(window, { StatusBar, Header, Avatar, NetGlyph, NetTag, Wave, Keyboard });
})();
