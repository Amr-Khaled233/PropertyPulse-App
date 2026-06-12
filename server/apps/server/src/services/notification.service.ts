// Notification service — emit and read property alerts (price drop, new report, market shift).

import { watchlistRepository } from '../repositories/watchlist.repository.js';
import type { PropertyAlert } from '../models/watchlist.model.js';

export const notificationService = {
  createAlert(input: {
    userId: string;
    propertyId: string;
    kind: string;
    message: string;
    payload?: Record<string, unknown>;
  }): Promise<PropertyAlert> {
    // TODO: also push via email / web-push / Expo notifications.
    return watchlistRepository.createAlert(input);
  },

  listForUser(userId: string): Promise<PropertyAlert[]> {
    return watchlistRepository.listAlerts(userId);
  },
};
