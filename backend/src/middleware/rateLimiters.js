const rateLimit = require('express-rate-limit');
const { errorResponse } = require('../utils/apiResponse');

/**
 * Rate limiter for POST /auth/login
 * Limits each IP to 10 requests per 15 minutes.
 */
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return errorResponse(res, 429, 'Too many login attempts from this IP. Please try again after 15 minutes.');
  },
});

/**
 * Rate limiter for POST /payments/webhook
 * Limits each IP to 60 requests per 1 minute.
 */
const webhookRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return errorResponse(res, 429, 'Too many webhook requests from this IP. Please try again after 1 minute.');
  },
});

module.exports = {
  loginRateLimiter,
  webhookRateLimiter,
};
