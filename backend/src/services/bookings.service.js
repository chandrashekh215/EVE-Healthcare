const prisma = require('../config/db');
const { NotFoundError, BadRequestError, ForbiddenError, ConflictError } = require('../utils/errors');

class BookingsService {
  /**
   * Create a new booking for the authenticated user
   */
  async createBooking(userId, { testId, appointmentDatetime }) {
    const appointmentDate = new Date(appointmentDatetime);
    if (isNaN(appointmentDate.getTime())) {
      throw new BadRequestError('Invalid appointment datetime format');
    }

    if (appointmentDate <= new Date()) {
      throw new BadRequestError('Appointment datetime must be in the future');
    }

    // Retrieve diagnostic test to snapshot live price and centre reference
    const test = await prisma.diagnosticTest.findUnique({
      where: { id: testId },
      include: { centre: true },
    });

    if (!test) {
      throw new NotFoundError(`Diagnostic test with ID '${testId}' not found`);
    }

    const booking = await prisma.booking.create({
      data: {
        userId,
        testId: test.id,
        centreId: test.centreId,
        appointmentDatetime: appointmentDate,
        amount: test.price, // Price snapshot
        status: 'PENDING',
      },
      include: {
        test: {
          select: { id: true, name: true, price: true },
        },
        centre: {
          select: { id: true, name: true, location: true },
        },
      },
    });

    return booking;
  }

  /**
   * Get paginated list of bookings owned by the authenticated user
   */
  async getUserBookings(userId, queryParams) {
    const page = Number(queryParams.page) || 1;
    const pageSize = Number(queryParams.pageSize) || 10;
    const skip = (page - 1) * pageSize;

    const where = { userId };

    const [items, totalItems] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          test: {
            select: { id: true, name: true, price: true },
          },
          centre: {
            select: { id: true, name: true, location: true },
          },
          payment: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.booking.count({ where }),
    ]);

    return {
      items,
      totalItems,
      page,
      pageSize,
    };
  }

  /**
   * Get booking details by ID (enforcing ownership)
   */
  async getBookingById(userId, bookingId) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        test: {
          select: { id: true, name: true, price: true },
        },
        centre: {
          select: { id: true, name: true, location: true },
        },
        payment: true,
      },
    });

    if (!booking) {
      throw new NotFoundError(`Booking with ID '${bookingId}' not found`);
    }

    if (booking.userId !== userId) {
      throw new ForbiddenError('You do not have permission to access this booking');
    }

    return booking;
  }

  /**
   * Cancel a booking (only if status is PENDING or CONFIRMED; clean return if CANCELLED)
   */
  async cancelBooking(userId, bookingId) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundError(`Booking with ID '${bookingId}' not found`);
    }

    if (booking.userId !== userId) {
      throw new ForbiddenError('You do not have permission to cancel this booking');
    }

    // Clean idempotent response if already cancelled
    if (booking.status === 'CANCELLED') {
      return {
        message: 'Booking is already cancelled',
        booking,
      };
    }

    if (booking.status === 'FAILED') {
      throw new ConflictError('Cannot cancel a booking with status FAILED');
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'CANCELLED' },
      include: {
        test: {
          select: { id: true, name: true, price: true },
        },
        centre: {
          select: { id: true, name: true, location: true },
        },
      },
    });

    return {
      message: 'Booking cancelled successfully',
      booking: updatedBooking,
    };
  }
}

module.exports = new BookingsService();
