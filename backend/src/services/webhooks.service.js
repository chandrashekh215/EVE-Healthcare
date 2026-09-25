const prisma = require('../config/db');
const { NotFoundError, BadRequestError } = require('../utils/errors');
const { executeWebhookWithRetry } = require('../utils/retry');
const { v4: uuidv4 } = require('uuid');

class WebhooksService {
  /**
   * Process payment webhook idempotently with retry handling
   */
  async processPaymentWebhook({ eventId, bookingId, providerReferenceId, status, payload }) {
    if (!eventId) {
      throw new BadRequestError('eventId is required');
    }

    if (!bookingId && !providerReferenceId) {
      throw new BadRequestError('Either bookingId or providerReferenceId must be provided');
    }

    // 1. Check if eventId already exists (Idempotency lookup check)
    const existingEvent = await prisma.webhookEvent.findUnique({
      where: { eventId },
    });

    if (existingEvent) {
      return {
        processed: false,
        duplicate: true,
        message: `Webhook event '${eventId}' has already been processed`,
        eventId,
      };
    }

    // 2. Resolve booking ID
    let targetBookingId = bookingId;

    if (!targetBookingId && providerReferenceId) {
      const payment = await prisma.payment.findUnique({
        where: { providerReferenceId },
      });
      if (payment) {
        targetBookingId = payment.bookingId;
      }
    }

    if (!targetBookingId) {
      throw new NotFoundError('Referenced booking or payment record does not exist');
    }

    const booking = await prisma.booking.findUnique({
      where: { id: targetBookingId },
    });

    if (!booking) {
      throw new NotFoundError(`Referenced booking '${targetBookingId}' does not exist`);
    }

    // 3. Process new event atomically with exponential backoff retries on transient errors
    try {
      const result = await executeWebhookWithRetry(eventId, async () => {
        return await prisma.$transaction(async (tx) => {
          // Record WebhookEvent to guarantee idempotency via DB UNIQUE constraint on eventId
          const webhookRecord = await tx.webhookEvent.create({
            data: {
              eventId,
              bookingId: targetBookingId,
              providerReferenceId: providerReferenceId || `WH-${uuidv4().substring(0, 8)}`,
              status,
              payload: payload || {},
            },
          });

          const targetPaymentStatus = status === 'SUCCESS' ? 'SUCCESS' : 'FAILED';
          const targetBookingStatus = status === 'SUCCESS' ? 'CONFIRMED' : 'FAILED';

          // Upsert Payment record
          const payment = await tx.payment.upsert({
            where: { bookingId: targetBookingId },
            update: {
              status: targetPaymentStatus,
              providerReferenceId: providerReferenceId || `WH-${uuidv4().substring(0, 8)}`,
            },
            create: {
              bookingId: targetBookingId,
              amount: booking.amount,
              status: targetPaymentStatus,
              providerReferenceId: providerReferenceId || `WH-${uuidv4().substring(0, 8)}`,
            },
          });

          // Update Booking status
          const updatedBooking = await tx.booking.update({
            where: { id: targetBookingId },
            data: { status: targetBookingStatus },
          });

          return { webhookRecord, payment, booking: updatedBooking };
        });
      });

      return {
        processed: true,
        duplicate: false,
        message: 'Webhook processed successfully',
        eventId,
        data: result,
      };
    } catch (error) {
      // Handle unique constraint failure in case of concurrent duplicate request race condition
      if (error.code === 'P2002' && error.meta?.target?.includes('eventId')) {
        return {
          processed: false,
          duplicate: true,
          message: `Webhook event '${eventId}' has already been processed`,
          eventId,
        };
      }
      throw error;
    }
  }
}

module.exports = new WebhooksService();
