const pino = require('pino');
const pinoHttp = require('pino-http');
const { v4: uuidv4 } = require('uuid');

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
});

const requestLogger = pinoHttp({
  logger,
  genReqId: function (req) {
    return req.headers['x-request-id'] || uuidv4();
  },
  customLogLevel: function (req, res, err) {
    if (res.statusCode >= 500 || err) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
});

module.exports = {
  logger,
  requestLogger,
};
