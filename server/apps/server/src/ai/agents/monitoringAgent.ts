// Monitoring agent — scans watched properties for changes and raises alerts.
// Invoked by the scheduled propertyMonitor job.

import { watchlistRepository } from '../../repositories/watchlist.repository.js';
import { propertyRepository } from '../../repositories/property.repository.js';
import { notificationService } from '../../services/notification.service.js';
import { logger } from '../../utils/logger.js';

/** Returns the number of alerts created in this run. */
export async function monitorWatchedProperties(): Promise<number> {
  const items = await watchlistRepository.listAllToNotify();
  let alerts = 0;

  for (const item of items) {
    const property = await propertyRepository.getById(item.propertyId);
    if (!property) continue;

    // TODO: compare against a stored snapshot to detect real price/status changes.
    // Placeholder heuristic: flag properties that are no longer for sale/rent.
    if (property.status === 'sold' || property.status === 'off_market') {
      await notificationService.createAlert({
        userId: item.userId,
        propertyId: item.propertyId,
        kind: 'market_shift',
        message: `"${property.title}" is now ${property.status.replace('_', ' ')}.`,
        payload: { status: property.status },
      });
      alerts += 1;
    }
  }

  logger.info({ watched: items.length, alerts }, 'Monitoring run complete');
  return alerts;
}
