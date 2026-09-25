const express = require('express');
const paymentsController = require('../controllers/payments.controller');
const { authenticateJWT } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createPaymentSchema } = require('../schemas/payment.schema');

const router = express.Router();

/**
 * @swagger
 * /payments:
 *   post:
 *     summary: Simulate payment for a PENDING booking
 *     tags: [Payments]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bookingId]
 *             properties:
 *               bookingId:
 *                 type: string
 *               simulateFailure:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Payment processed and booking updated atomically
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not booking owner
 *       404:
 *         description: Booking not found
 *       409:
 *         description: Conflict - Booking not PENDING or double payment attempt
 */
router.post('/', authenticateJWT, validate(createPaymentSchema), paymentsController.processPayment);

module.exports = router;
