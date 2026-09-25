const express = require('express');
const webhooksController = require('../controllers/webhooks.controller');
const validate = require('../middleware/validate');
const { webhookRateLimiter } = require('../middleware/rateLimiters');
const { webhookSchema } = require('../schemas/payment.schema');

const router = express.Router();

/**
 * @swagger
 * /payments/webhook:
 *   post:
 *     summary: Idempotent payment webhook endpoint
 *     tags: [Webhooks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [eventId, status]
 *             properties:
 *               eventId:
 *                 type: string
 *                 example: "evt_123456789"
 *               bookingId:
 *                 type: string
 *               providerReferenceId:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [SUCCESS, FAILED, PENDING]
 *                 example: "SUCCESS"
 *     responses:
 *       200:
 *         description: Webhook processed safely (returns 200 for duplicate eventId without double execution)
 *       400:
 *         description: Malformed payload
 *       404:
 *         description: Referenced booking not found
 */
router.post('/webhook', webhookRateLimiter, validate(webhookSchema), webhooksController.handlePaymentWebhook);

module.exports = router;
