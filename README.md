# EVE Healthcare - Diagnostic Test Booking & Simulated Payments System

A production-grade, full-stack monorepo application for **EVE Healthcare** divided into two dedicated modules:
- **`backend/`**: Node.js + Express REST API with Prisma ORM, JWT Auth, price snapshotting, simulated payment processing, and idempotent webhooks.
- **`frontend/`**: Vite + React web application with Tailwind CSS, React Router v6, Axios interceptors, AuthContext, and live Developer Tools for webhook testing.

---

## 📁 Repository Structure

```
.
├── backend/                  # Express REST API Backend Service
│   ├── Dockerfile            # Container definition for backend
│   ├── package.json          # Node dependencies & test/seed scripts
│   ├── prisma/               # Prisma schema & database migration SQL
│   │   ├── migrations/
│   │   ├── schema.prisma
│   │   └── seed.js           # Database seed script for realistic sample data
│   ├── src/                  # Clean architecture layer (Routes -> Controllers -> Services)
│   └── tests/                # Unit & Integration test suites
├── frontend/                 # Vite + React Frontend Application
│   ├── package.json          # React dependencies & scripts
│   ├── src/                  # Components, Pages, Context, API client layer
│   └── vite.config.js        # Vite bundler config
├── docker-compose.yml        # Docker Compose orchestration
└── README.md
```

---

## 🚀 Quick Start Guide

### 1. Run the Backend API (`/backend`)

```bash
cd backend
npm install

# Environment setup: Create a .env file in backend/
# PORT=3000
# NODE_ENV=development
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/eve_healthcare?schema=public"
# JWT_SECRET="super-secret-eve-healthcare-jwt-key-2026"
# JWT_EXPIRES_IN="1d"
# LOG_LEVEL="info"

npm run seed     # Populate database with sample centres, tests, users, bookings
npm start        # Starts API server on http://localhost:3000
```
- API Base URL: `http://localhost:3000`
- Swagger Docs: `http://localhost:3000/api-docs`

---

### 2. Run the React Frontend (`/frontend`)

In a separate terminal:

```bash
cd frontend
npm install
npm run dev      # Starts Vite dev server on http://localhost:5173
```
- Application URL: `http://localhost:5173`

---

## 🔑 Demo User Accounts

All seeded demo accounts use the password: `Password123!`

- **Priya Sharma**: `priya.sharma@example.com`
- **Rahul Verma**: `rahul.verma@example.com`
- **Ananya Deshmukh**: `ananya.deshmukh@example.com`
- **Vikram Singh**: `vikram.singh@example.com`

---

## 🧪 Running Automated Tests

Run backend unit and integration tests:
```bash
cd backend
npm test
```
- **52/52 unit & integration tests passing (100% pass rate)**.

---

## 📝 Example Requests

### 1. POST /auth/signup (User Registration)
**Request Body:**
```json
{
  "email": "priya.sharma@example.com",
  "password": "Password123!",
  "name": "Priya Sharma"
}
```

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": "c1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c",
    "email": "priya.sharma@example.com",
    "name": "Priya Sharma",
    "createdAt": "2026-09-25T20:00:00.000Z"
  }
}
```

### 2. POST /auth/login (User Authentication)
**Request Body:**
```json
{
  "email": "priya.sharma@example.com",
  "password": "Password123!"
}
```

**Success Response (200 OK - Trimmed):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "usr_priya_101",
      "name": "Priya Sharma",
      "email": "priya.sharma@example.com"
    }
  }
}
```

### 3. POST /bookings (Create Diagnostic Test Booking)
**Request Body:**
```json
{
  "testId": "test_cbc_apex",
  "appointmentDatetime": "2026-10-15T10:00:00.000Z"
}
```

**Success Response (201 Created - Trimmed):**
```json
{
  "success": true,
  "message": "Booking created successfully",
  "data": {
    "id": "bkg_1001",
    "userId": "usr_priya_101",
    "testId": "test_cbc_apex",
    "amount": 350.00,
    "status": "PENDING",
    "appointmentDatetime": "2026-10-15T10:00:00.000Z"
  }
}
```

### 4. POST /bookings/:id/cancel (Cancel Booking)
**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Booking cancelled successfully",
  "data": {
    "id": "bkg_1001",
    "status": "CANCELLED"
  }
}
```

---

## 💡 Important Assumptions

- **Access Control & Auth Guard**: Write endpoints (`POST /centres`, `POST /centres/:id/tests`, `/bookings`, `/payments`) require JWT authentication (`Authorization: Bearer <token>`); catalog read endpoints stay public.
- **Booking Status Lifecycle**: Bookings support 4 reachable states: `PENDING` (on creation), `CONFIRMED` (on successful payment), `FAILED` (on failed payment), and `CANCELLED` (via `POST /bookings/:id/cancel`). Cancellation is permitted from `PENDING` or `CONFIRMED` states.
- **Consistent Pagination**: List read endpoints (`GET /centres`, `GET /centres/:id/tests`, `GET /tests`, `GET /bookings`) accept `page` & `pageSize` (with `limit` & `offset` aliases) validated via Zod, returning `{ success, data, pagination: { page, pageSize, total, totalItems, totalPages } }`.
- **Weighted Probabilistic Payments**: Default payment simulation evaluates via an 85% `SUCCESS` / 15% `FAILED` random draw when `simulateFailure` is omitted, while explicit `simulateFailure: true/false` overrides allow deterministic testing.
- **Webhook Retry & Exponential Backoff (Implemented)**: In-process 3-attempt exponential backoff (100ms, 300ms, 900ms) with structured Pino JSON logging for transient DB errors (`P1xxx`, `P2034`), returning HTTP 503 if exhausted without marking event processed.
- **Rate Limiting (Implemented)**: Enforces IP rate limits on `POST /auth/login` (10 req / 15 min) and `POST /payments/webhook` (60 req / min) returning HTTP 429.
- **Price Snapshotting**: Bookings store a snapshot price (`amount`) upon creation to insulate historical records against catalog test price changes.

> For complete details, see [**`backend/README.md` - Important Assumptions](./backend/README.md#-important-assumptions).

---

## 🔮 What I Would Improve With More Time

- **BullMQ / Redis Asynchronous Webhook Queue**: Transition webhook processing from synchronous HTTP execution to a resilient Redis worker queue with retries and DLQ.
- **Role-Based Access Control (RBAC)**: Expand JWT claims to distinguish `ROLE_ADMIN` (centre/test write access) from `ROLE_PATIENT` (booking access).
- **Refresh Tokens & Revocation**: Implement short-lived access tokens with HTTP-only refresh tokens stored in Redis for token revocation on logout.
- **End-to-End Automated Testing**: Expand the 52-test Jest suite with Playwright / Cypress browser testing.

> For full architectural roadmap details, see [**`backend/README.md` - What I Would Improve](./backend/README.md#-what-i-would-improve-with-more-time).

---

## 📖 Detailed Backend & API Documentation

For complete, detailed technical documentation, please refer to [**`backend/README.md`**](./backend/README.md):

1. **[API Endpoints & Request/Response Catalog](./backend/README.md#-api-endpoints--example-requests)**
   - Includes real JSON payloads (matching Zod schemas), success responses, and key HTTP error codes (400, 401, 403, 404, 409) for all 14 API endpoints.
2. **[Database & Schema Design](./backend/README.md#-database--schema-design)**
   - All 6 Prisma models (`User`, `DiagnosticCentre`, `DiagnosticTest`, `Booking`, `BookingItem`, `Payment`).
   - Detailed Mermaid ER Diagram and relationships.
   - Rationale for **Price Snapshotting**, **Idempotent Webhooks**, and **Concurrency Control**.
3. **[Important Assumptions](./backend/README.md#-important-assumptions)**
   - Payment processing simulation rules, authentication & access control policy, booking cancellation rules, and security specifications.
4. **[What I Would Improve With More Time](./backend/README.md#-what-i-would-improve-with-more-time)**
   - Asynchronous job queue processing (BullMQ + Redis), Role-Based Access Control (RBAC), JWT Refresh Token rotation, database indexing, and Playwright E2E testing.
