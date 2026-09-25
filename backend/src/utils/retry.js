const { logger } = require('../middleware/requestLogger');
const { ServiceUnavailableError } = require('./errors');

/**
 * Determines whether an error is a transient system/database failure.
 * Operational business-logic errors (4xx) are NOT retried.
 */
function isTransientError(err) {
  if (!err) return false;

  // Operational business logic errors (4xx) should never be retried
  if (err.statusCode && err.statusCode < 500) {
    return false;
  }
  if (err.isOperational && err.statusCode && err.statusCode < 500) {
    return false;
  }

  // Prisma unique constraint violation (P2002) is a business/idempotency conflict, not transient
  if (err.code === 'P2002') {
    return false;
  }

  // Prisma transient error codes
  // P1xxx = Database connection errors (P1000, P1001, P1002, P1008, P1017)
  // P2034 = Transaction failed due to write conflict / deadlock
  // P2024 = Timed out fetching a new connection from the pool
  if (err.code && (err.code.startsWith('P1') || err.code === 'P2034' || err.code === 'P2024')) {
    return true;
  }

  // Custom flag or transient message matching
  if (err.isTransient === true) {
    return true;
  }

  const msg = (err.message || '').toLowerCase();
  if (
    msg.includes('connection') ||
    msg.includes('econnrefused') ||
    msg.includes('timeout') ||
    msg.includes('deadlock') ||
    msg.includes('transient') ||
    msg.includes('write conflict')
  ) {
    return true;
  }

  return false;
}

/**
 * Executes a webhook processing function with exponential backoff retries on transient errors.
 *
 * @param {string} eventId - Unique webhook event identifier for logging.
 * @param {Function} fn - Async operation to execute.
 * @param {number} maxAttempts - Maximum number of attempts (default 3).
 * @param {number} initialDelayMs - Base delay in milliseconds (default 100ms).
 */
async function executeWebhookWithRetry(eventId, fn, maxAttempts = 3, initialDelayMs = 100) {
  let attempt = 0;
  // Use shorter delay in test environment to maintain sub-second test runs
  let delay = process.env.NODE_ENV === 'test' ? 10 : initialDelayMs;

  while (attempt < maxAttempts) {
    attempt++;
    const startTime = Date.now();
    try {
      const result = await fn();
      const durationMs = Date.now() - startTime;

      logger.info(
        { eventId, attempt, outcome: 'SUCCESS', durationMs },
        `Webhook event '${eventId}' attempt ${attempt} succeeded`
      );

      return result;
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const transient = isTransientError(error);

      if (transient && attempt < maxAttempts) {
        logger.warn(
          { eventId, attempt, outcome: 'RETRY', durationMs, errorMsg: error.message },
          `Webhook event '${eventId}' attempt ${attempt} failed with transient error. Retrying in ${delay}ms...`
        );

        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 3; // Exponential backoff factor 3 (100ms -> 300ms -> 900ms)
      } else {
        logger.error(
          { eventId, attempt, outcome: 'FAILED', durationMs, errorMsg: error.message, transient },
          `Webhook event '${eventId}' attempt ${attempt} failed permanently`
        );

        if (transient) {
          throw new ServiceUnavailableError(
            `Webhook processing failed after ${maxAttempts} attempts due to transient database error: ${error.message}`
          );
        }

        throw error;
      }
    }
  }
}

module.exports = {
  isTransientError,
  executeWebhookWithRetry,
};
