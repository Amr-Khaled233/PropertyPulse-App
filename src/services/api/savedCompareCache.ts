// Saved AI comparisons — the FULL result is persisted on-device (AsyncStorage)
// so a saved comparison can be re-opened as a read-only snapshot WITHOUT
// re-running the AI compare.

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ComparisonResult } from './analysisService';

const KEY = 'saved_compares';

export interface SavedCompare {
  id: string;
  savedAt: string;
  result: ComparisonResult;
}

const idKey = (r: ComparisonResult) => r.candidates.map((c) => c.property.id).sort().join(',');

export const savedCompareCache = {
  async list(): Promise<SavedCompare[]> {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      const arr = raw ? (JSON.parse(raw) as SavedCompare[]) : [];
      // Drop legacy entries saved before the full-result format (no candidates).
      return arr.filter((x) => x && x.result && Array.isArray(x.result.candidates));
    } catch {
      return [];
    }
  },

  async getById(id: string): Promise<SavedCompare | undefined> {
    return (await this.list()).find((x) => x.id === id);
  },

  async save(result: ComparisonResult): Promise<void> {
    const list = await this.list();
    const entry: SavedCompare = { id: `cmp_${Date.now().toString(36)}`, savedAt: new Date().toISOString(), result };
    // De-dupe by the same set of compared properties (keep the newest snapshot).
    const deduped = list.filter((x) => idKey(x.result) !== idKey(result));
    await AsyncStorage.setItem(KEY, JSON.stringify([entry, ...deduped]));
  },

  async remove(id: string): Promise<void> {
    const list = (await this.list()).filter((x) => x.id !== id);
    await AsyncStorage.setItem(KEY, JSON.stringify(list));
  },
};
