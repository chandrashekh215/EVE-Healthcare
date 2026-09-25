const express = require('express');
const bookingsController = require('../controllers/bookings.controller');
const { authenticateJWT } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createBookingSchema, getBookingsSchema } = require('../schemas/booking.schema');

const router = express.Router();

// All booking endpoints require JWT authentication
router.use(authenticateJWT);

/**
 * @swagger
 * /bookings:
 *   post:
 *     summary: Create a diagnostic test booking (status starts PENDING)
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [testId, appointmentDatetime]
 *             properties:
 *               testId:
 *                 type: string
 *               appointmentDatetime:
 *                 type: string
 *                 example: "2026-10-15T10:00:00.000Z"
 *     responses:
 *       201:
 *         description: Booking created with price snapshot
 *       400:
 *         description: Invalid input or appointment date in past
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Test or Centre not found
 *   get:
 *     summary: List authenticated user's own bookings
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: User's bookings
 *       401:
 *         description: Unauthorized
 */
router.post('/', validate(createBookingSchema), bookingsController.createBooking);
router.get('/', validate(getBookingsSchema, 'query'), bookingsController.getUserBookings);

/**
 * @swagger
 * /bookings/{id}:
 *   get:
 *     summary: Get booking details by ID (Owning user only)
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not the booking owner
 *       404:
 *         description: Booking not found
 */
router.get('/:id', bookingsController.getBookingById);

/**
 * @swagger
 * /bookings/{id}/cancel:
 *   post:
 *     summary: Cancel a booking
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking cancelled or clean response if already cancelled
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not owner
 *       404:
 *         description: Booking not found
 */
router.post('/:id/cancel', bookingsController.cancelBooking);

module.exports = router;
