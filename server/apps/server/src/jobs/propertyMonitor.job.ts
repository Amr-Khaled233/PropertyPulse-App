// Job: scan the watchlist, detect changes and trigger alerts via the monitoring agent.

import { monitorWatchedProperties } from '../ai/agents/monitoringAgent.js';
import { logger } from '../utils/logger.js';

export async function runPropertyMonitor(): Promise<void> {
  try {
    const alerts = await monitorWatchedProperties();
    logger.info({ alerts }, 'propertyMonitor job finished');
  } catch (err) {
    logger.error(err, 'propertyMonitor job failed');
  }
}
