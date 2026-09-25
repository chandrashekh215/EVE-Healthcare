const { hashPassword, comparePassword } = require('../../src/utils/hash');
const { generateToken, verifyToken } = require('../../src/utils/jwt');
const { signupSchema, loginSchema } = require('../../src/schemas/auth.schema');
const { createBookingSchema } = require('../../src/schemas/booking.schema');
const { webhookSchema } = require('../../src/schemas/payment.schema');

describe('Unit Tests - Security Utilities & Zod Schemas', () => {
  describe('Password Hashing & Verification', () => {
    it('should correctly hash a plain text password and verify it', async () => {
      const plainPassword = 'SecretPassword123!';
      const hashed = await hashPassword(plainPassword);

      expect(hashed).toBeDefined();
      expect(hashed).not.toEqual(plainPassword);

      const isMatch = await comparePassword(plainPassword, hashed);
      expect(isMatch).toBe(true);

      const isWrongMatch = await comparePassword('WrongPassword', hashed);
      expect(isWrongMatch).toBe(false);
    });
  });

  describe('JWT Utilities', () => {
    it('should generate a valid JWT token and decode its payload', () => {
      const payload = { id: 'usr_12345', email: 'test@eve.com' };
      const token = generateToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      const decoded = verifyToken(token);
      expect(decoded.id).toEqual(payload.id);
      expect(decoded.email).toEqual(payload.email);
    });

    it('should throw an error when verifying an invalid token', () => {
      expect(() => verifyToken('invalid.token.str')).toThrow();
    });
  });

  describe('Zod Validation Schemas', () => {
    it('should validate correct signup input', () => {
      const valid = { email: 'user@example.com', password: 'password123', name: 'John Doe' };
      const result = signupSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email or short password in signup', () => {
      const invalidEmail = { email: 'not-an-email', password: 'password123', name: 'John' };
      expect(signupSchema.safeParse(invalidEmail).success).toBe(false);

      const shortPassword = { email: 'valid@email.com', password: '123', name: 'John' };
      expect(signupSchema.safeParse(shortPassword).success).toBe(false);
    });

    it('should reject past appointment datetime in booking schema', () => {
      const pastDate = new Date(Date.now() - 3600000).toISOString();
      const invalidBooking = { testId: 'test-uuid-123', appointmentDatetime: pastDate };
      const result = createBookingSchema.safeParse(invalidBooking);
      expect(result.success).toBe(false);
    });

    it('should accept future appointment datetime in booking schema', () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString();
      const validBooking = { testId: 'test-uuid-123', appointmentDatetime: futureDate };
      const result = createBookingSchema.safeParse(validBooking);
      expect(result.success).toBe(true);
    });

    it('should validate webhook payload requirements', () => {
      const validWebhook = { eventId: 'evt_001', bookingId: 'bkg_123', status: 'SUCCESS' };
      expect(webhookSchema.safeParse(validWebhook).success).toBe(true);

      const missingIdentifiers = { eventId: 'evt_002', status: 'SUCCESS' };
      expect(webhookSchema.safeParse(missingIdentifiers).success).toBe(false);
    });
  });
});
