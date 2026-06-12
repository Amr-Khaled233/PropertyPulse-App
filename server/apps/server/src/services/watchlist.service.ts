// Watchlist service — manage saved properties and alert preferences.

import { watchlistRepository } from '../repositories/watchlist.repository.js';
import { propertyService } from './property.service.js';
import type { WatchlistItem } from '@propertypulse/shared-types';
import type { PropertyAlert } from '../models/watchlist.model.js';

export const watchlistService = {
  list(userId: string): Promise<WatchlistItem[]> {
    return watchlistRepository.listForUser(userId);
  },

  async add(input: {
    userId: string;
    propertyId: string;
    notes?: string;
    notifyOnChange?: boolean;
  }): Promise<WatchlistItem> {
    // Ensure the property exists before saving it.
    await propertyService.getById(input.propertyId);
    return watchlistRepository.add(input);
  },

  remove(userId: string, id: string): Promise<void> {
    return watchlistRepository.remove(userId, id);
  },

  listAlerts(userId: string): Promise<PropertyAlert[]> {
    return watchlistRepository.listAlerts(userId);
  },
};
