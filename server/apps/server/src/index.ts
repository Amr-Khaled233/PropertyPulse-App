// Server entry point — boots the HTTP server and background jobs.

import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { startScheduler } from './jobs/scheduler.js';

const app = createApp();

app.listen(env.PORT, () => {
  logger.info(`PropertyPulse API listening on http://localhost:${env.PORT}`);
  startScheduler();
});
