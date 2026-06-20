// Local "seen" tracking for the admin bell — flags new inquiries and new users
// the admin hasn't looked at yet. Mirrors notifCache but for the admin feed.

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'admin_seen';

interface Seen {
  inquiries: string[];
  users: string[];
}

async function load(): Promise<Seen> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return { inquiries: [], users: [] };
    const parsed = JSON.parse(raw) as Partial<Seen>;
    return { inquiries: parsed.inquiries ?? [], users: parsed.users ?? [] };
  } catch {
    return { inquiries: [], users: [] };
  }
}

async function save(s: Seen): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* best-effort */
  }
}

export const adminNotifCache = {
  async unseenCount(inquiryIds: string[], userIds: string[]): Promise<number> {
    const s = await load();
    const inq = new Set(s.inquiries);
    const usr = new Set(s.users);
    return inquiryIds.filter((id) => !inq.has(id)).length + userIds.filter((id) => !usr.has(id)).length;
  },

  async markInquiriesSeen(ids: string[]): Promise<void> {
    const s = await load();
    s.inquiries = [...new Set([...s.inquiries, ...ids])];
    await save(s);
  },

  async markUsersSeen(ids: string[]): Promise<void> {
    const s = await load();
    s.users = [...new Set([...s.users, ...ids])];
    await save(s);
  },

  async markAllSeen(inquiryIds: string[], userIds: string[]): Promise<void> {
    const s = await load();
    s.inquiries = [...new Set([...s.inquiries, ...inquiryIds])];
    s.users = [...new Set([...s.users, ...userIds])];
    await save(s);
  },
};
