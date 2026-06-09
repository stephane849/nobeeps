/* data.js — mock content. Calm, human, deliberately un-busy. */

// Conversations for the chat list + threads keyed by id.
export const CONTACTS = [
  { id:"maya",   name:"Maya Lindqvist", initials:"ML", num:"+46 70 555 0182", note:"Sister" },
  { id:"theo",   name:"Theo Park",      initials:"TP", num:"+1 415 555 0147", note:"" },
  { id:"garden", name:"Allotment Plot 12", initials:"12", num:"4 members", note:"Group", group:true },
  { id:"dad",    name:"Dad",            initials:"D",  num:"+46 70 555 0090", note:"" },
  { id:"rumi",   name:"Rumi Okonkwo",   initials:"RO", num:"+44 7700 900145", note:"Book club" },
  { id:"clara",  name:"Clara Voss",     initials:"CV", num:"+49 151 5550 998", note:"" },
  { id:"jonas",  name:"Jonas Berg",     initials:"JB", num:"+46 73 555 0231", note:"Climbing" },
  { id:"amara",  name:"Amara Diallo",   initials:"AD", num:"+221 77 555 014", note:"" },
  { id:"eli",    name:"Eli Tan",        initials:"ET", num:"+65 8555 0177", note:"" },
  { id:"nan",    name:"Nan",            initials:"N",  num:"+46 70 555 0044", note:"Grandmother" },
  // Telegram contacts
  { id:"lena",   name:"Lena Sørensen",   initials:"LS", num:"@lena_s", note:"Telegram" },
  { id:"climb",  name:"Boulder Crew",     initials:"BC", num:"212 members", note:"Telegram group", group:true },
  { id:"pavel",  name:"Pavel Novak",      initials:"PN", num:"@pavelmakes", note:"Telegram" },
];

export const byId = Object.fromEntries(CONTACTS.map(c => [c.id, c]));

export const CHATS = [
  { id:"maya", network:"whatsapp", unread:2, time:"14:02", pinned:true,
    snippet:"Walking by the canal — call when you're free?" },
  { id:"lena", network:"telegram", unread:1, time:"13:40",
    snippet:"The exhibition opens Friday — come?" },
  { id:"garden", network:"whatsapp", unread:0, time:"12:30", group:true,
    snippet:"Theo: I'll bring the seed potatoes Saturday" },
  { id:"theo", network:"whatsapp", unread:0, time:"09:15", snippet:"Voice message · 0:42" },
  { id:"climb", network:"telegram", unread:0, time:"09:02", group:true,
    snippet:"Pavel: anyone free for the morning session?" },
  { id:"rumi", network:"whatsapp", unread:0, time:"Yesterday", snippet:"You: Loved chapter four. Let's discuss Sunday." },
  { id:"dad", network:"whatsapp", unread:0, time:"Yesterday", snippet:"Thanks for the photos ☺" },
  { id:"pavel", network:"telegram", unread:0, time:"Mon", snippet:"You: Sending the route topo now" },
  { id:"clara", network:"whatsapp", unread:0, time:"Mon", snippet:"You: Sounds good — no rush at all" },
  { id:"jonas", network:"whatsapp", unread:0, time:"Sun", snippet:"Crag was perfect. Next week?" },
  { id:"nan", network:"whatsapp", unread:0, time:"Sun", snippet:"You: I'll ring you after supper x" },
];

// message threads
export const THREADS = {
  maya:[
    { day:"Today" },
    { from:"maya", t:"13:48", text:"Morning. The light on the water is unreal right now." },
    { from:"maya", t:"13:49", kind:"voice", dur:"0:24" },
    { from:"me",   t:"13:55", text:"Sounds lovely. I'm heading out in a bit — save me a bench?" },
    { from:"maya", t:"14:01", text:"Walking by the canal — call when you're free?" },
    { from:"maya", t:"14:02", text:"No rush though. Whenever suits." },
  ],
  garden:[
    { day:"Today" },
    { from:"rumi", t:"11:50", text:"Plot's looking wild after the rain.", author:"Rumi" },
    { from:"theo", t:"12:28", text:"I'll bring the seed potatoes Saturday", author:"Theo" },
    { from:"me",   t:"12:30", text:"Perfect. I've got compost sorted." },
  ],
  theo:[
    { day:"Today" },
    { from:"theo", t:"09:10", text:"Recorded you a little something from the trail." },
    { from:"theo", t:"09:15", kind:"voice", dur:"0:42" },
  ],
  rumi:[
    { day:"Yesterday" },
    { from:"rumi", t:"20:02", text:"What did you make of the ending?" },
    { from:"me",   t:"21:30", text:"Loved chapter four. Let's discuss Sunday." },
  ],
  dad:[
    { day:"Yesterday" },
    { from:"me",   t:"18:00", text:"Sent you a few from the garden." },
    { from:"dad",  t:"18:40", text:"Thanks for the photos ☺" },
  ],
  lena:[
    { day:"Today" },
    { from:"lena", t:"13:30", text:"Finally hung the last piece this morning." },
    { from:"lena", t:"13:40", text:"The exhibition opens Friday — come?" },
  ],
  climb:[
    { day:"Today" },
    { from:"pavel", t:"08:55", text:"Conditions look good for the slab project.", author:"Pavel" },
    { from:"pavel", t:"09:02", text:"Anyone free for the morning session?", author:"Pavel" },
  ],
  pavel:[
    { day:"Monday" },
    { from:"pavel", t:"19:10", text:"Did you ever map out the new line?" },
    { from:"me",    t:"19:25", text:"Sending the route topo now" },
  ],
};

export const DATA = { CONTACTS, byId, CHATS, THREADS };
