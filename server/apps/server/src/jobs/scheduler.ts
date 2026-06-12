// Background job scheduler — registers cron jobs (e.g. property monitoring).

import cron from 'node-cron';
import { logger } from '../utils/logger.js';
import { runPropertyMonitor } from './propertyMonitor.job.js';

export function startScheduler(): void {
  // Every day at 08:00 — check watched properties for changes.
  cron.schedule('0 8 * * *', () => {
    logger.info('Running property monitor job...');
    void runPropertyMonitor();
  });
}
