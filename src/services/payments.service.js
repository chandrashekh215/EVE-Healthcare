const prisma = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const { NotFoundError, ForbiddenError, ConflictError } = require('../utils/errors');

class PaymentsService {
  /**
   * Process simulated payment for a booking
   */
  async processPayment(userId, { bookingId, simulateFailure }) {
    // 1. Validate booking existence
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundError(`Booking with ID '${bookingId}' not found`);
    }

    // 2. Validate ownership
    if (booking.userId !== userId) {
      throw new ForbiddenError('You do not have permission to pay for this booking');
    }

    // 3. Validate booking status is PENDING
    if (booking.status !== 'PENDING') {
      throw new ConflictError(
        `Cannot process payment for booking with status '${booking.status}'. Only PENDING bookings can be paid.`
      );
    }

    // 4. Double payment check
    const existingPayment = await prisma.payment.findUnique({
      where: { bookingId },
    });

    if (existingPayment) {
      throw new ConflictError(`Payment has already been processed for booking ID '${bookingId}'`);
    }

    // 5. Determine payment outcome (Simulated gateway decision)
    // Rule: Explicit simulateFailure flag triggers FAILED, otherwise SUCCESS
    const isFailure = simulateFailure === true || simulateFailure === 'true';
    const paymentStatus = isFailure ? 'FAILED' : 'SUCCESS';
    const bookingNewStatus = isFailure ? 'FAILED' : 'CONFIRMED';
    const providerReferenceId = `PAY-${uuidv4().substring(0, 8).toUpperCase()}-${Date.now()}`;

    // 6. Execute atomic transaction (prisma.$transaction) to prevent double payment and race conditions
    try {
      const [payment, updatedBooking] = await prisma.$transaction(async (tx) => {
        const newPayment = await tx.payment.create({
          data: {
            bookingId,
            amount: booking.amount,
            status: paymentStatus,
            providerReferenceId,
          },
        });

        const newBooking = await tx.booking.update({
          where: { id: bookingId },
          data: { status: bookingNewStatus },
        });

        return [newPayment, newBooking];
      });

      return {
        payment,
        booking: updatedBooking,
      };
    } catch (error) {
      // Prisma unique constraint violation (P2002) for race conditions on bookingId or providerReferenceId
      if (error.code === 'P2002') {
        throw new ConflictError(`Payment is already being processed or completed for booking ID '${bookingId}'`);
      }
      throw error;
    }
  }
}

module.exports = new PaymentsService();
