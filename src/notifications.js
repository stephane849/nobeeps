import { Beeper } from './beeper';

let pollInterval = null;
let lastUnreadMap = {};
let navRef = null;

function hashId(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) { h = (Math.imul(31, h) + str.charCodeAt(i)) | 0; }
  return Math.abs(h) % 2147483647 || 1;
}

async function getPlugin() {
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    return LocalNotifications;
  } catch (e) { return null; }
}

export async function initNotifications() {
  const plugin = await getPlugin();
  if (!plugin) return;
  try {
    const { display } = await plugin.requestPermissions();
    if (display !== 'granted') return;
    await plugin.createChannel({
      id: 'messages',
      name: 'Messages',
      importance: 3,
      visibility: 1,
      vibration: true,
    });
    plugin.addListener('localNotificationActionPerformed', (action) => {
      const chatId = action.notification?.extra?.chatId;
      if (chatId && navRef) navRef('thread', { id: chatId });
    });
  } catch (e) {}
}

export function startMessagePolling(nav) {
  navRef = nav;
  if (pollInterval) return;
  pollInterval = setInterval(async () => {
    if (!Beeper.state.connected || !Beeper.state.reachable) return;
    const chats = await Beeper.getChats();
    if (!chats) return;
    const toNotify = [];
    for (const chat of chats) {
      const prev = lastUnreadMap[chat.id] ?? 0;
      if (chat.unread > prev) {
        toNotify.push({
          id: hashId(chat.id),
          title: chat.name,
          body: chat.snippet || 'New message',
          extra: { chatId: chat.id },
          channelId: 'messages',
          schedule: { at: new Date(Date.now() + 100) },
        });
      }
      lastUnreadMap[chat.id] = chat.unread;
    }
    if (toNotify.length) {
      const plugin = await getPlugin();
      if (plugin) plugin.schedule({ notifications: toNotify }).catch(() => {});
    }
  }, 60000);
}

export function stopMessagePolling() {
  if (pollInterval) { clearInterval(pollInterval); pollInterval = null; }
}
