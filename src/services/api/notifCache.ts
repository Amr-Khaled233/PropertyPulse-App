import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'notif_seen';

interface SeenEntry { id: string; status: string }

async function load(): Promise<Map<string, string>> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return new Map();
    return new Map((JSON.parse(raw) as SeenEntry[]).map((e) => [e.id, e.status]));
  } catch {
    return new Map();
  }
}

async function save(map: Map<string, string>): Promise<void> {
  try {
    const entries: SeenEntry[] = [...map.entries()].map(([id, status]) => ({ id, status }));
    await AsyncStorage.setItem(KEY, JSON.stringify(entries));
  } catch {}
}

export const notifCache = {
  /** Returns the number of non-'new' inquiries whose status has changed since last seen. */
  async countUnseen(inquiries: { id: string; status: string }[]): Promise<number> {
    const seen = await load();
    return inquiries.filter(
      (i) => i.status !== 'new' && seen.get(i.id) !== i.status,
    ).length;
  },

  /** Marks all provided inquiries as seen at their current status. */
  async markSeen(inquiries: { id: string; status: string }[]): Promise<void> {
    const seen = await load();
    inquiries.forEach(({ id, status }) => seen.set(id, status));
    await save(seen);
  },
};
