// Watchlist / saved portfolio — consumes the backend (Bearer).
//   GET    /watchlist
//   POST   /watchlist        { propertyId, notes? }
//   DELETE /watchlist/:id
//   GET    /watchlist/alerts

import { apiClient } from './apiClient';
import { propertyService } from './propertyService';
import type { Property } from '../../types/listing';
import type { WatchlistItem } from '../../types/user';

export interface WatchlistEntry extends WatchlistItem {
  property?: Property;
}

export const watchlistService = {
  async list(): Promise<WatchlistEntry[]> {
    const { data } = await apiClient.get<WatchlistItem[]>('/watchlist');
    // Hydrate each saved item with its actual property from the DB.
    return Promise.all(
      data.map(async (item) => ({
        ...item,
        property: await propertyService.getById(item.propertyId).catch(() => undefined),
      })),
    );
  },

  async add(propertyId: string, notes?: string): Promise<WatchlistItem> {
    const { data } = await apiClient.post<WatchlistItem>('/watchlist', { propertyId, notes });
    return data;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete<null>(`/watchlist/${id}`);
  },

  async alerts(): Promise<{ propertyId: string; message: string }[]> {
    const { data } = await apiClient.get<{ propertyId: string; message: string }[]>('/watchlist/alerts');
    return data;
  },
};
