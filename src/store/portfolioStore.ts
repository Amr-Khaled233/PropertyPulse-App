import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface PortfolioState {
  savedIds: string[];
  has: (id: string) => boolean;
  toggle: (id: string) => boolean; // returns the new saved state
  add: (id: string) => void;
  remove: (id: string) => void;
}

export const usePortfolioStore = create<PortfolioState>()(
  persist(
    (set, get) => ({
      savedIds: [],
      has: (id) => get().savedIds.includes(id),
      toggle: (id) => {
        const saved = get().savedIds.includes(id);
        set({ savedIds: saved ? get().savedIds.filter((x) => x !== id) : [...get().savedIds, id] });
        return !saved;
      },
      add: (id) => set((s) => (s.savedIds.includes(id) ? s : { savedIds: [...s.savedIds, id] })),
      remove: (id) => set((s) => ({ savedIds: s.savedIds.filter((x) => x !== id) })),
    }),
    { name: 'pp-portfolio', storage: createJSONStorage(() => AsyncStorage) },
  ),
);