const { app } = require('./app');
const { env } = require('./config/env');
const { closePool } = require('./config/db');
const logger = require('./utils/logger');

const server = app.listen(env.port, () => {
  logger.info('server_started', { port: env.port, nodeEnv: env.nodeEnv, apiPrefix: env.apiPrefix });
});

let shuttingDown = false;
async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info('server_shutdown_started', { signal });
  const timer = setTimeout(() => process.exit(1), 10000);
  timer.unref();
  server.close(async () => {
    try {
      await closePool();
      logger.info('server_shutdown_complete', { signal });
      process.exit(0);
    } catch (error) {
      logger.error('server_shutdown_failed', { signal, error });
      process.exit(1);
    }
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', error => logger.error('unhandled_rejection', { error }));
process.on('uncaughtException', error => {
  logger.error('uncaught_exception', { error });
  shutdown('uncaughtException');
});
