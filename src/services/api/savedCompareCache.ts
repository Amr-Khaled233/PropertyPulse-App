// Saved AI comparisons — persisted on-device (AsyncStorage). Stores the compared
// property ids + a snapshot label so the user can re-open a comparison later.

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'saved_compares';

export interface SavedCompare {
  id: string;
  ids: string; // comma-separated property ids (re-run via /compare?ids=)
  titles: string[];
  verdict: string;
  savedAt: string;
}

export const savedCompareCache = {
  async list(): Promise<SavedCompare[]> {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as SavedCompare[]) : [];
    } catch {
      return [];
    }
  },

  async save(item: Omit<SavedCompare, 'id' | 'savedAt'>): Promise<void> {
    const list = await this.list();
    const entry: SavedCompare = { ...item, id: `cmp_${Date.now().toString(36)}`, savedAt: new Date().toISOString() };
    // De-dupe by the same set of ids (keep the newest).
    const deduped = list.filter((x) => x.ids !== item.ids);
    await AsyncStorage.setItem(KEY, JSON.stringify([entry, ...deduped]));
  },

  async remove(id: string): Promise<void> {
    const list = (await this.list()).filter((x) => x.id !== id);
    await AsyncStorage.setItem(KEY, JSON.stringify(list));
  },
};
