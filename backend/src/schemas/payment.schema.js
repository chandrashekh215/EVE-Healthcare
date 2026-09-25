const { z } = require('zod');

const createPaymentSchema = z.object({
  bookingId: z.string().min(1, { message: 'bookingId is required' }),
  simulateFailure: z.boolean().optional(),
});

const webhookSchema = z.object({
  eventId: z.string().min(1, { message: 'eventId is required' }),
  bookingId: z.string().optional(),
  providerReferenceId: z.string().optional(),
  status: z.enum(['SUCCESS', 'FAILED', 'PENDING'], {
    errorMap: () => ({ message: 'status must be SUCCESS, FAILED, or PENDING' }),
  }),
}).refine(
  (data) => data.bookingId || data.providerReferenceId,
  { message: 'Either bookingId or providerReferenceId must be provided' }
);

module.exports = {
  createPaymentSchema,
  webhookSchema,
};
