/* icons.jsx — monoline 1-bit icons for E Ink. 2px strokes, currentColor. */
(function(){
  const S = ({children, size=24, sw=2, fill="none", vb=24, style}) => (
    <svg width={size} height={size} viewBox={`0 0 ${vb} ${vb}`} fill={fill}
         stroke="currentColor" strokeWidth={sw} strokeLinecap="round"
         strokeLinejoin="round" style={style} aria-hidden="true">{children}</svg>
  );

  const Icon = {
    Back:   (p)=> <S {...p}><path d="M15 5 L8 12 L15 19"/></S>,
    Chevron:(p)=> <S {...p}><path d="M9 5 L16 12 L9 19"/></S>,
    Search: (p)=> <S {...p}><circle cx="11" cy="11" r="6.5"/><path d="M16 16 L21 21"/></S>,
    Plus:   (p)=> <S {...p}><path d="M12 5 V19 M5 12 H19"/></S>,
    Close:  (p)=> <S {...p}><path d="M6 6 L18 18 M18 6 L6 18"/></S>,
    Check:  (p)=> <S {...p}><path d="M5 12.5 L10 17.5 L19 6.5"/></S>,
    More:   (p)=> <S {...p}><circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none"/></S>,
    Phone:  (p)=> <S {...p}><path d="M6.5 4 H10 L11.5 8.5 L9 10.5 C10 13 11 14 13.5 15 L15.5 12.5 L20 14 V17.5 C20 18.6 19 19.6 17.8 19.4 C10 18.4 5.6 14 4.6 6.2 C4.4 5 5.4 4 6.5 4 Z"/></S>,
    Video:  (p)=> <S {...p}><rect x="3.5" y="7" width="12" height="10" rx="2"/><path d="M15.5 11 L20.5 8 V16 L15.5 13 Z"/></S>,
    Mic:    (p)=> <S {...p}><rect x="9" y="3.5" width="6" height="11" rx="3"/><path d="M5.5 11.5 C5.5 15.5 8.4 18 12 18 C15.6 18 18.5 15.5 18.5 11.5 M12 18 V21 M8.5 21 H15.5"/></S>,
    Send:   (p)=> <S {...p}><path d="M4 12 L20 4 L14 20 L11.5 13 Z"/></S>,
    Play:   (p)=> <S {...p}><path d="M8 5 L19 12 L8 19 Z" fill="currentColor" stroke="none"/></S>,
    Pause:  (p)=> <S {...p}><path d="M8 5 V19 M16 5 V19" strokeWidth={p&&p.sw?p.sw:3}/></S>,
    Person: (p)=> <S {...p}><circle cx="12" cy="8" r="4"/><path d="M4.5 20 C4.5 15.6 8 13.5 12 13.5 C16 13.5 19.5 15.6 19.5 20"/></S>,
    People: (p)=> <S {...p}><circle cx="9" cy="8.5" r="3.3"/><path d="M3.5 19 C3.5 15.3 6 13.6 9 13.6 C12 13.6 14.5 15.3 14.5 19"/><path d="M15.5 6 C17.3 6 18.6 7.4 18.6 9.2 C18.6 10.6 17.8 11.7 16.7 12.2 M16.5 13.8 C18.8 14.1 20.5 15.7 20.5 18.6"/></S>,
    Gear:   (p)=> <S {...p}><circle cx="12" cy="12" r="3.2"/><path d="M12 2.8 V5 M12 19 V21.2 M21.2 12 H19 M5 12 H2.8 M18.5 5.5 L17 7 M7 17 L5.5 18.5 M18.5 18.5 L17 17 M7 7 L5.5 5.5"/></S>,
    Sliders:(p)=> <S {...p}><path d="M4 7 H20 M4 12 H20 M4 17 H20"/><circle cx="9" cy="7" r="2.2" fill="var(--paper)"/><circle cx="15" cy="12" r="2.2" fill="var(--paper)"/><circle cx="8" cy="17" r="2.2" fill="var(--paper)"/></S>,
    Bell:   (p)=> <S {...p}><path d="M6 16 C6 16 7 14.5 7 11 C7 7.5 9 5.5 12 5.5 C15 5.5 17 7.5 17 11 C17 14.5 18 16 18 16 Z M10 19 C10.4 20 11.1 20.5 12 20.5 C12.9 20.5 13.6 20 14 19"/></S>,
    BellOff:(p)=> <S {...p}><path d="M6 16 C6 16 7 14.5 7 11 C7 9.6 7.3 8.5 7.9 7.6 M9.5 5.9 C10.2 5.6 11 5.5 12 5.5 C15 5.5 17 7.5 17 11 C17 13 17.4 14.3 17.7 15 M6 16 H16 M10 19 C10.4 20 11.1 20.5 12 20.5 C12.9 20.5 13.6 20 14 19 M4 4 L20 20"/></S>,
    Moon:   (p)=> <S {...p}><path d="M19 13.5 C18 14.2 16.8 14.6 15.5 14.6 C11.9 14.6 9 11.7 9 8.1 C9 6.8 9.4 5.6 10 4.6 C6.6 5.3 4 8.3 4 12 C4 16.2 7.4 19.6 11.6 19.6 C15.3 19.6 18.3 17 19 13.5 Z"/></S>,
    Camera: (p)=> <S {...p}><path d="M4 8 H7 L8.5 5.5 H15.5 L17 8 H20 V18 H4 Z"/><circle cx="12" cy="12.5" r="3.4"/></S>,
    Speaker:(p)=> <S {...p}><path d="M4 9 H7 L11.5 5 V19 L7 15 H4 Z"/><path d="M14.5 9 C15.6 10 15.6 14 14.5 15 M17 7 C19 9 19 15 17 17"/></S>,
    MuteMic:(p)=> <S {...p}><rect x="9" y="3.5" width="6" height="9" rx="3"/><path d="M5.5 11.5 C5.5 15.5 8.4 18 12 18 C13 18 14 17.8 14.8 17.4 M18.5 11.5 C18.5 13 18.1 14.2 17.5 15.2 M12 18 V21 M8.5 21 H15.5 M4 4 L20 20"/></S>,
    Add:    (p)=> <S {...p}><circle cx="12" cy="12" r="8.5"/><path d="M12 8 V16 M8 12 H16"/></S>,
    Clock:  (p)=> <S {...p}><circle cx="12" cy="12" r="8.5"/><path d="M12 7 V12 L15.5 14"/></S>,
    Leaf:   (p)=> <S {...p}><path d="M19 5 C19 5 17 4.5 13 5.5 C8 6.7 5 10 5 14.5 C5 16.5 5.7 18 5.7 18 C5.7 18 8 14 12 11.5 C9.5 14.5 7.5 17.5 7.5 19.5 M19 5 C19.5 9 18 14 13.5 16 C11 17.1 8.5 17 7.5 16.8"/></S>,
    Reply:  (p)=> <S {...p}><path d="M10 7 L5 12 L10 17 M5 12 H14 C17.3 12 20 14.7 20 18 V19"/></S>,
    Archive:(p)=> <S {...p}><rect x="4" y="5" width="16" height="4"/><path d="M5.5 9 V19 H18.5 V9 M9.5 13 H14.5"/></S>,
  };

  window.Icon = Icon;
})();
