// Watchlist state (zustand) shared across Search / Detail / Portfolio so the
// star toggle stays in sync everywhere. Backed by the backend watchlistService.

import { create } from 'zustand';
import { watchlistService, type WatchlistEntry } from '../services/api/watchlistService';

interface WatchlistState {
  entries: WatchlistEntry[];
  loading: boolean;
  loaded: boolean;
  error: string | null;
  load: () => Promise<void>;
  isWatched: (propertyId: string) => boolean;
  entryId: (propertyId: string) => string | undefined;
  toggle: (propertyId: string) => Promise<void>;
  reset: () => void;
}

export const useWatchlistStore = create<WatchlistState>((set, get) => ({
  entries: [],
  loading: false,
  loaded: false,
  error: null,

  async load() {
    set({ loading: true, error: null });
    try {
      const entries = await watchlistService.list();
      set({ entries, loading: false, loaded: true });
    } catch (e) {
      set({ loading: false, error: e instanceof Error ? e.message : 'Failed to load watchlist' });
    }
  },

  isWatched(propertyId) {
    return get().entries.some((e) => e.propertyId === propertyId);
  },

  entryId(propertyId) {
    return get().entries.find((e) => e.propertyId === propertyId)?.id;
  },

  async toggle(propertyId) {
    const existing = get().entries.find((e) => e.propertyId === propertyId);
    // Optimistic update.
    if (existing) {
      set({ entries: get().entries.filter((e) => e.propertyId !== propertyId) });
      try {
        await watchlistService.remove(existing.id);
      } catch {
        await get().load();
      }
    } else {
      try {
        await watchlistService.add(propertyId);
        await get().load();
      } catch (e) {
        set({ error: e instanceof Error ? e.message : 'Failed to update watchlist' });
      }
    }
  },

  reset() {
    set({ entries: [], loaded: false, error: null });
  },
}));
