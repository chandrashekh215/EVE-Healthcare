const { z } = require('zod');

const createBookingSchema = z.object({
  testId: z.string().min(1, { message: 'testId is required' }),
  appointmentDatetime: z
    .string()
    .datetime({ message: 'appointmentDatetime must be a valid ISO 8601 date string' })
    .refine(
      (val) => new Date(val) > new Date(),
      { message: 'Appointment datetime must be in the future' }
    ),
});

const getBookingsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

module.exports = {
  createBookingSchema,
  getBookingsSchema,
};
