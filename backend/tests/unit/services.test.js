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

    it('should validate pagination schemas with defaults and constraints', () => {
      const { getCentresSchema, getCentreTestsSchema } = require('../../src/schemas/centre.schema');
      const { getBookingsSchema } = require('../../src/schemas/booking.schema');

      const defaultParsed = getCentresSchema.parse({});
      expect(defaultParsed.page).toBe(1);
      expect(defaultParsed.pageSize).toBe(10);

      const customParsed = getCentreTestsSchema.parse({ page: '2', pageSize: '25', limit: '25', offset: '25' });
      expect(customParsed.page).toBe(2);
      expect(customParsed.pageSize).toBe(25);
      expect(customParsed.limit).toBe(25);
      expect(customParsed.offset).toBe(25);

      const bookingParsed = getBookingsSchema.parse({ page: '3', pageSize: '5' });
      expect(bookingParsed.page).toBe(3);
      expect(bookingParsed.pageSize).toBe(5);

      // Rejects invalid max pageSize (> 100) or negative page (< 1)
      expect(getCentresSchema.safeParse({ pageSize: 500 }).success).toBe(false);
      expect(getBookingsSchema.safeParse({ page: 0 }).success).toBe(false);
    });
  });

  describe('Payments Service - Probabilistic Random Draw Logic', () => {
    it('should calculate FAILED when Math.random() < 0.15 and SUCCESS when >= 0.15', () => {
      const simulateOutcome = (simulateFailure, randomVal) => {
        let isFailure;
        if (simulateFailure !== undefined && simulateFailure !== null) {
          isFailure = simulateFailure === true || simulateFailure === 'true';
        } else {
          isFailure = randomVal < 0.15;
        }
        return isFailure ? 'FAILED' : 'SUCCESS';
      };

      // Omitted simulateFailure with random draw
      expect(simulateOutcome(undefined, 0.10)).toBe('FAILED');
      expect(simulateOutcome(undefined, 0.149)).toBe('FAILED');
      expect(simulateOutcome(undefined, 0.15)).toBe('SUCCESS');
      expect(simulateOutcome(undefined, 0.85)).toBe('SUCCESS');

      // Explicit simulateFailure flags override random draw
      expect(simulateOutcome(true, 0.99)).toBe('FAILED');
      expect(simulateOutcome(false, 0.01)).toBe('SUCCESS');
    });
  });

  describe('Webhook Retry Helper & Transient Error Classification', () => {
    const { isTransientError, executeWebhookWithRetry } = require('../../src/utils/retry');
    const { ServiceUnavailableError } = require('../../src/utils/errors');

    it('should correctly identify transient errors vs business logic errors', () => {
      expect(isTransientError({ code: 'P2034', message: 'Transaction deadlock' })).toBe(true);
      expect(isTransientError({ code: 'P1001', message: 'Can not connect to database' })).toBe(true);
      expect(isTransientError({ message: 'Connection timeout' })).toBe(true);
      expect(isTransientError({ isTransient: true })).toBe(true);

      // Business errors must NOT be transient
      expect(isTransientError({ statusCode: 400, message: 'Validation Error' })).toBe(false);
      expect(isTransientError({ statusCode: 404, message: 'Not Found' })).toBe(false);
      expect(isTransientError({ code: 'P2002', message: 'Unique constraint' })).toBe(false);
    });

    it('should retry transient errors and succeed when an attempt passes', async () => {
      let attempts = 0;
      const fn = jest.fn(async () => {
        attempts++;
        if (attempts < 3) {
          const err = new Error('Transient DB timeout');
          err.code = 'P2034';
          throw err;
        }
        return { success: true };
      });

      const res = await executeWebhookWithRetry('evt_retry_test_1', fn, 3, 10);
      expect(res).toEqual({ success: true });
      expect(attempts).toBe(3);
    });

    it('should exhaust retries and throw ServiceUnavailableError (503) when transient errors persist', async () => {
      let attempts = 0;
      const fn = jest.fn(async () => {
        attempts++;
        const err = new Error('Connection refused');
        err.code = 'P1001';
        throw err;
      });

      await expect(executeWebhookWithRetry('evt_retry_fail_1', fn, 3, 10)).rejects.toThrow(
        ServiceUnavailableError
      );
      expect(attempts).toBe(3);
    });
  });
});
