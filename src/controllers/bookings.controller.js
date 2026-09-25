const bookingsService = require('../services/bookings.service');
const { successResponse, paginatedResponse } = require('../utils/apiResponse');

class BookingsController {
  async createBooking(req, res, next) {
    try {
      const booking = await bookingsService.createBooking(req.user.id, req.body);
      return successResponse(res, 201, 'Booking created successfully', booking);
    } catch (error) {
      next(error);
    }
  }

  async getUserBookings(req, res, next) {
    try {
      const { items, totalItems, page, pageSize } = await bookingsService.getUserBookings(
        req.user.id,
        req.query
      );
      return paginatedResponse(res, 200, 'User bookings retrieved successfully', items, page, pageSize, totalItems);
    } catch (error) {
      next(error);
    }
  }

  async getBookingById(req, res, next) {
    try {
      const booking = await bookingsService.getBookingById(req.user.id, req.params.id);
      return successResponse(res, 200, 'Booking details retrieved successfully', booking);
    } catch (error) {
      next(error);
    }
  }

  async cancelBooking(req, res, next) {
    try {
      const result = await bookingsService.cancelBooking(req.user.id, req.params.id);
      return successResponse(res, 200, result.message, result.booking);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new BookingsController();
