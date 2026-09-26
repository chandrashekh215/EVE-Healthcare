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

    it('GET /centres - should support custom page and pageSize query parameters', async () => {
      const res = await request(app)
        .get('/centres?page=1&pageSize=1');

      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.pageSize).toBe(1);
      expect(res.body.pagination).toHaveProperty('total');
      expect(res.body.pagination).toHaveProperty('totalPages');
    });

    it('GET /centres - should support limit and offset query parameters', async () => {
      const res = await request(app)
        .get('/centres?limit=1&offset=0');

      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.pagination.pageSize).toBe(1);
    });

    it('GET /centres - should return empty data array for out-of-range page', async () => {
      const res = await request(app)
        .get('/centres?page=999&pageSize=10');

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toEqual([]);
      expect(res.body.pagination.page).toBe(999);
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

    it('GET /centres/:id/tests - should retrieve paginated tests for a centre', async () => {
      const res = await request(app)
        .get(`/centres/${centreId}/tests?page=1&pageSize=10`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].name).toBe('Comprehensive Blood Panel');
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.totalItems).toBe(1);
    });

    it('GET /centres/:id/tests - should return empty array for out-of-range page', async () => {
      const res = await request(app)
        .get(`/centres/${centreId}/tests?page=999&pageSize=10`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toEqual([]);
      expect(res.body.pagination.page).toBe(999);
    });

    it('GET /centres/:id/tests - should return 404 for non-existent centre', async () => {
      const res = await request(app)
        .get('/centres/non-existent-centre-id/tests');

      expect(res.statusCode).toBe(404);
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

  describe('3. Booking System Endpoints & Status Lifecycle', () => {
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

    it('POST /bookings - should create a booking with snapshot price (PENDING status)', async () => {
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

    it('GET /bookings - should list authenticated user\'s bookings with pagination', async () => {
      const res = await request(app)
        .get('/bookings?page=1&pageSize=10')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].id).toBe(bookingId);
      expect(res.body).toHaveProperty('pagination');
    });

    it('GET /bookings - should return empty data for out-of-range page', async () => {
      const res = await request(app)
        .get('/bookings?page=999&pageSize=10')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toEqual([]);
      expect(res.body.pagination.page).toBe(999);
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

    it('POST /bookings/:id/cancel - should allow owner to cancel a PENDING booking (PENDING -> CANCELLED)', async () => {
      // Create a dedicated PENDING booking to cancel
      const futureDate = new Date(Date.now() + 86400000).toISOString();
      const createRes = await request(app)
        .post('/bookings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ testId, appointmentDatetime: futureDate });

      const tempBookingId = createRes.body.data.id;

      const cancelRes = await request(app)
        .post(`/bookings/${tempBookingId}/cancel`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(cancelRes.statusCode).toBe(200);
      expect(cancelRes.body.data.status).toBe('CANCELLED');
    });

    it('POST /payments - should reject payment for a CANCELLED booking with 409 Conflict', async () => {
      // Create and cancel a booking
      const futureDate = new Date(Date.now() + 86400000).toISOString();
      const createRes = await request(app)
        .post('/bookings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ testId, appointmentDatetime: futureDate });

      const tempId = createRes.body.data.id;
      await request(app)
        .post(`/bookings/${tempId}/cancel`)
        .set('Authorization', `Bearer ${user1Token}`);

      const payRes = await request(app)
        .post('/payments')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ bookingId: tempId, simulateFailure: false });

      expect(payRes.statusCode).toBe(409);
    });

    it('POST /bookings/:id/cancel - non-owner cancellation attempt should return 403 Forbidden', async () => {
      const res = await request(app)
        .post(`/bookings/${bookingId}/cancel`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(res.statusCode).toBe(403);
    });
  });

  describe('4. Simulated Payments Endpoints & Status Transitions (CONFIRMED & FAILED)', () => {
    let failedBookingId;

    it('POST /payments - should simulate successful payment and confirm booking (PENDING -> CONFIRMED)', async () => {
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

    it('POST /payments - double payment attempt on CONFIRMED booking should return 409 Conflict', async () => {
      const res = await request(app)
        .post('/payments')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          bookingId,
        });

      expect(res.statusCode).toBe(409); // Already CONFIRMED
    });

    it('POST /payments - should simulate failed payment (PENDING -> FAILED)', async () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString();
      const createRes = await request(app)
        .post('/bookings')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ testId, appointmentDatetime: futureDate });

      failedBookingId = createRes.body.data.id;

      const payRes = await request(app)
        .post('/payments')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          bookingId: failedBookingId,
          simulateFailure: true,
        });

      expect(payRes.statusCode).toBe(200);
      expect(payRes.body.data.payment.status).toBe('FAILED');
      expect(payRes.body.data.booking.status).toBe('FAILED');
    });

    it('POST /bookings/:id/cancel - cancelling a FAILED booking should return 409 Conflict', async () => {
      const res = await request(app)
        .post(`/bookings/${failedBookingId}/cancel`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.statusCode).toBe(409);
    });

    it('POST /payments - attempting payment on a FAILED booking should return 409 Conflict', async () => {
      const res = await request(app)
        .post('/payments')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ bookingId: failedBookingId });

      expect(res.statusCode).toBe(409);
    });
  });

  describe('5. Payment Webhook Idempotency & Lifecycle Transitions', () => {
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

    it('POST /bookings/:id/cancel - calling cancel on already confirmed booking updates status to CANCELLED (CONFIRMED -> CANCELLED)', async () => {
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
