const request = require('supertest');
const app = require('../../src/app');
const prisma = require('../../src/config/db');

describe('EVE Healthcare System Integration Tests', () => {
  let user1Token;
  let user1Id;
  let user2Token;
  let user2Id;
  let centreId;
  let testId;
  let bookingId;

  beforeAll(async () => {
    // Clean database before running test suite
    await prisma.webhookEvent.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.diagnosticTest.deleteMany();
    await prisma.diagnosticCentre.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    // Clean database and disconnect client after test suite
    await prisma.webhookEvent.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.diagnosticTest.deleteMany();
    await prisma.diagnosticCentre.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe('1. Authentication Endpoints', () => {
    it('POST /auth/signup - should register user 1', async () => {
      const res = await request(app)
        .post('/auth/signup')
        .send({
          email: 'alice@example.com',
          password: 'password123',
          name: 'Alice Johnson',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.email).toBe('alice@example.com');
      expect(res.body.data).not.toHaveProperty('password');
      user1Id = res.body.data.id;
    });

    it('POST /auth/signup - should register user 2', async () => {
      const res = await request(app)
        .post('/auth/signup')
        .send({
          email: 'bob@example.com',
          password: 'password123',
          name: 'Bob Smith',
        });

      expect(res.statusCode).toBe(201);
      user2Id = res.body.data.id;
    });

    it('POST /auth/signup - should reject duplicate email', async () => {
      const res = await request(app)
        .post('/auth/signup')
        .send({
          email: 'alice@example.com',
          password: 'password123',
          name: 'Alice Duplicate',
        });

      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('POST /auth/login - should authenticate user 1 and return JWT token', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'alice@example.com',
          password: 'password123',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      user1Token = res.body.data.token;
    });

    it('POST /auth/login - should authenticate user 2 and return JWT token', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'bob@example.com',
          password: 'password123',
        });

      expect(res.statusCode).toBe(200);
      user2Token = res.body.data.token;
    });

    it('POST /auth/login - should reject invalid password', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'alice@example.com',
          password: 'wrongpassword',
        });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('2. Diagnostic Centres & Tests Endpoints', () => {
    it('POST /centres - should reject unauthenticated request with 401', async () => {
      const res = await request(app)
        .post('/centres')
        .send({
          name: 'Unauth Centre',
          location: 'Unauthorized Loc',
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('POST /centres - should create a diagnostic centre when authenticated', async () => {
      const res = await request(app)
        .post('/centres')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          name: 'Metro Diagnostics',
          location: '123 Health Ave, New York',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.name).toBe('Metro Diagnostics');
      centreId = res.body.data.id;
    });

    it('GET /centres - should list centres with pagination', async () => {
      const res = await request(app)
        .get('/centres?page=1&pageSize=10');

      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body).toHaveProperty('pagination');
    });

    it('POST /centres/:id/tests - should reject unauthenticated request with 401', async () => {
      const res = await request(app)
        .post(`/centres/${centreId}/tests`)
        .send({
          name: 'Comprehensive Blood Panel',
          price: 150.00,
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('POST /centres/:id/tests - should add a diagnostic test to centre when authenticated', async () => {
      const res = await request(app)
        .post(`/centres/${centreId}/tests`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          name: 'Comprehensive Blood Panel',
          price: 150.00,
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.price).toBe(150.00);
      testId = res.body.data.id;
    });

    it('GET /centres/:id - should get centre detail with tests', async () => {
      const res = await request(app)
        .get(`/centres/${centreId}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.tests.length).toBe(1);
      expect(res.body.data.tests[0].name).toBe('Comprehensive Blood Panel');
    });

    it('GET /tests - search tests by name filter', async () => {
      const res = await request(app)
        .get('/tests?name=Blood');

      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('3. Booking System Endpoints', () => {
    it('POST /bookings - should reject booking with appointment in the past', async () => {
      const pastDate = new Date(Date.now() - 3600000).toISOString();
      const res = await request(app)
        .post('/bookings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          testId,
          appointmentDatetime: pastDate,
        });

      expect(res.statusCode).toBe(400);
    });

    it('POST /bookings - should create a booking with snapshot price', async () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString();
      const res = await request(app)
        .post('/bookings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          testId,
          appointmentDatetime: futureDate,
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.status).toBe('PENDING');
      expect(res.body.data.amount).toBe(150.00); // Snapshot price matches test price
      bookingId = res.body.data.id;
    });

    it('GET /bookings - should list authenticated user\'s bookings', async () => {
      const res = await request(app)
        .get('/bookings')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].id).toBe(bookingId);
    });

    it('GET /bookings/:id - should reject access when non-owner user requests booking', async () => {
      const res = await request(app)
        .get(`/bookings/${bookingId}`)
        .set('Authorization', `Bearer ${user2Token}`); // User 2 attempts to view User 1 booking

      expect(res.statusCode).toBe(403);
    });

    it('GET /bookings/:id - should allow owner to view booking detail', async () => {
      const res = await request(app)
        .get(`/bookings/${bookingId}`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.id).toBe(bookingId);
    });
  });

  describe('4. Simulated Payments Endpoints', () => {
    it('POST /payments - should simulate successful payment and confirm booking', async () => {
      const res = await request(app)
        .post('/payments')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          bookingId,
          simulateFailure: false,
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.payment.status).toBe('SUCCESS');
      expect(res.body.data.booking.status).toBe('CONFIRMED');
    });

    it('POST /payments - double payment attempt should return 409 Conflict', async () => {
      const res = await request(app)
        .post('/payments')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          bookingId,
        });

      expect(res.statusCode).toBe(409); // Already CONFIRMED
    });
  });

  describe('5. Payment Webhook Idempotency', () => {
    let webhookBookingId;

    beforeAll(async () => {
      // Create a fresh PENDING booking for testing webhooks
      const futureDate = new Date(Date.now() + 172800000).toISOString();
      const bookingRes = await request(app)
        .post('/bookings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          testId,
          appointmentDatetime: futureDate,
        });
      webhookBookingId = bookingRes.body.data.id;
    });

    it('POST /payments/webhook - first event processing should succeed (200 OK)', async () => {
      const eventId = `evt_test_${Date.now()}`;
      const res = await request(app)
        .post('/payments/webhook')
        .send({
          eventId,
          bookingId: webhookBookingId,
          status: 'SUCCESS',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.processed).toBe(true);
      expect(res.body.data.duplicate).toBe(false);

      // Verify DB booking status updated to CONFIRMED
      const bookingInDb = await prisma.booking.findUnique({ where: { id: webhookBookingId } });
      expect(bookingInDb.status).toBe('CONFIRMED');
    });

    it('POST /payments/webhook - sending duplicate eventId MUST return 200 OK and duplicate flag without double execution', async () => {
      const duplicateEventId = 'evt_duplicate_constant_123';

      // First call
      const res1 = await request(app)
        .post('/payments/webhook')
        .send({
          eventId: duplicateEventId,
          bookingId: webhookBookingId,
          status: 'SUCCESS',
        });

      expect(res1.statusCode).toBe(200);
      expect(res1.body.data.processed).toBe(true);

      // Count webhook events in DB
      const count1 = await prisma.webhookEvent.count({ where: { eventId: duplicateEventId } });
      expect(count1).toBe(1);

      // SECOND call with EXACT same eventId
      const res2 = await request(app)
        .post('/payments/webhook')
        .send({
          eventId: duplicateEventId,
          bookingId: webhookBookingId,
          status: 'SUCCESS',
        });

      expect(res2.statusCode).toBe(200);
      expect(res2.body.data.duplicate).toBe(true);
      expect(res2.body.data.processed).toBe(false);

      // Count webhook events in DB remains 1
      const count2 = await prisma.webhookEvent.count({ where: { eventId: duplicateEventId } });
      expect(count2).toBe(1);
    });

    it('POST /payments/webhook - should retry on transient DB failure and succeed when retried', async () => {
      const retryEventId = `evt_transient_retry_${Date.now()}`;
      let attempts = 0;
      const originalTx = prisma.$transaction.bind(prisma);

      const spyTx = jest.spyOn(prisma, '$transaction').mockImplementation(async (cb) => {
        attempts++;
        if (attempts <= 2) {
          const err = new Error('Database connection deadlock simulated');
          err.code = 'P2034';
          throw err;
        }
        return await originalTx(cb);
      });

      const res = await request(app)
        .post('/payments/webhook')
        .send({
          eventId: retryEventId,
          bookingId: webhookBookingId,
          status: 'SUCCESS',
        });

      spyTx.mockRestore();

      expect(res.statusCode).toBe(200);
      expect(res.body.data.processed).toBe(true);
      expect(attempts).toBe(3);
    });

    it('POST /payments/webhook - should return 503 Service Unavailable when all retries are exhausted on transient errors', async () => {
      const exhaustedEventId = `evt_transient_exhausted_${Date.now()}`;
      const spyTx = jest.spyOn(prisma, '$transaction').mockImplementation(async () => {
        const err = new Error('Database connection refused');
        err.code = 'P1001';
        throw err;
      });

      const res = await request(app)
        .post('/payments/webhook')
        .send({
          eventId: exhaustedEventId,
          bookingId: webhookBookingId,
          status: 'SUCCESS',
        });

      spyTx.mockRestore();

      expect(res.statusCode).toBe(503);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('failed after 3 attempts');

      // Verify event was NOT recorded in DB
      const eventInDb = await prisma.webhookEvent.findUnique({ where: { eventId: exhaustedEventId } });
      expect(eventInDb).toBeNull();
    });

    it('POST /bookings/:id/cancel - calling cancel on already confirmed booking updates status to CANCELLED', async () => {
      const res = await request(app)
        .post(`/bookings/${webhookBookingId}/cancel`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.status).toBe('CANCELLED');
    });

    it('POST /bookings/:id/cancel - calling cancel on already cancelled booking returns clean 200 response', async () => {
      const res = await request(app)
        .post(`/bookings/${webhookBookingId}/cancel`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toContain('already cancelled');
    });
  });
});
