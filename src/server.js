require('dotenv').config();
const app = require('./app');
const { logger } = require('./middleware/requestLogger');

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  logger.info(`EVE Healthcare Backend Service running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
  logger.info(`Swagger API Documentation available at http://localhost:${PORT}/api-docs`);
});

// Graceful Shutdown
const gracefulShutdown = () => {
  logger.info('Received shutdown signal. Closing HTTP server...');
  server.close(() => {
    logger.info('HTTP server closed. Exiting process.');
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
