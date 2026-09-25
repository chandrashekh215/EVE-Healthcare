# EVE Healthcare - Diagnostic Test Booking & Simulated Payments API

Production-grade, clean-architecture backend RESTful service for **EVE Healthcare's Diagnostic Test Booking & Simulated Payments System**, built with **Node.js**, **Express**, **Prisma ORM**, and **PostgreSQL**.

---

## 📋 Table of Contents
- [Architecture & Key Design Decisions](#-architecture--key-design-decisions)
- [Quick Start & Local Setup](#-quick-start--local-setup)
- [Demo User Credentials](#-demo-user-credentials)
- [Database / Schema Design](#-database--schema-design)
  - [Model Definitions & Constraints](#model-definitions--constraints)
  - [Relationship Explanations](#relationship-explanations)
  - [Entity Relationship (ER) Diagram](#entity-relationship-er-diagram)
  - [Technical Rationale for Design Decisions](#technical-rationale-for-design-decisions)
- [API Endpoints & Example Requests](#-api-endpoints--example-requests)
  - [Summary Table](#summary-table)
  - [1. POST /auth/signup](#1-post-authsignup)
  - [2. POST /auth/login](#2-post-authlogin)
  - [3. POST /centres](#3-post-centres)
  - [4. GET /centres](#4-get-centres)
  - [5. GET /centres/:id](#5-get-centresid)
  - [6. POST /centres/:id/tests](#6-post-centresidtests)
  - [7. GET /tests](#7-get-tests)
  - [8. POST /bookings](#8-post-bookings)
  - [9. GET /bookings](#9-get-bookings)
  - [10. GET /bookings/:id](#10-get-bookingsid)
  - [11. POST /bookings/:id/cancel](#11-post-bookingsidcancel)
  - [12. POST /payments](#12-post-payments)
  - [13. POST /payments/webhook](#13-post-paymentswebhook)
- [Important Assumptions](#-important-assumptions)
- [What I Would Improve With More Time](#-what-i-would-improve-with-more-time)
- [Running Automated Tests](#-running-automated-tests)

---

## 🏛 Architecture & Key Design Decisions

The application adheres strictly to **Clean Architecture** principles, ensuring clear separation of concerns across distinct software layers:

```
src/
├── app.js               # Express application setup, security middleware & route mounting
├── server.js            # Server entrypoint with graceful shutdown signals (SIGTERM/SIGINT)
├── config/              # Prisma client proxy (with offline fallback) & Swagger configuration
├── controllers/         # Thin controller layer parsing requests & invoking services
├── middleware/          # Auth guards, Zod validators, request loggers & error handlers
├── routes/              # OpenAPI-annotated Express router definitions
├── schemas/             # Runtime request validation schemas built with Zod
├── services/            # Framework-agnostic business logic & atomic DB transactions
└── utils/               # Custom errors, standardized API response formatters, JWT & Bcrypt helpers
```

---

## 🚀 Quick Start & Local Setup

### Prerequisites
- **Node.js**: v18+ or v20+
- **PostgreSQL**: v14+ (or Docker / Docker Compose)

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in `backend/`:
```env
PORT=3000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/eve_healthcare?schema=public"
JWT_SECRET="super-secret-eve-healthcare-jwt-key-2026"
JWT_EXPIRES_IN="1d"
LOG_LEVEL="info"
```

### 3. Database Seeding & Startup
```bash
# Generate Prisma Client & Run Migrations
npx prisma generate
npx prisma migrate dev --name init

# Populate database with realistic sample data
npm run seed

# Start server
npm start
```
- API Base URL: `http://localhost:3000`
- Interactive Swagger OpenAPI Docs: `http://localhost:3000/api-docs`

### Option 2: Running with Docker Compose
```bash
docker-compose up --build
```

---

## 🔑 Demo User Credentials

The database seed script (`npm run seed`) populates demo user accounts. Password for all seeded accounts is: **`Password123!`**

| Name | Email Address | Password |
| :--- | :--- | :--- |
| **Priya Sharma** | `priya.sharma@example.com` | `Password123!` |
| **Rahul Verma** | `rahul.verma@example.com` | `Password123!` |
| **Ananya Deshmukh** | `ananya.deshmukh@example.com` | `Password123!` |
| **Vikram Singh** | `vikram.singh@example.com` | `Password123!` |

---

## 🧬 Database / Schema Design

### Model Definitions & Constraints

#### 1. `User` (`users`)
- `id` (`String` / `UUID`, Primary Key)
- `email` (`String`, `UNIQUE`, Indexed)
- `password` (`String`, Hashed with Bcrypt)
- `name` (`String`)
- `createdAt` (`DateTime`, Default: `now()`)
- `updatedAt` (`DateTime`, Auto-updated)

#### 2. `DiagnosticCentre` (`diagnostic_centres`)
- `id` (`String` / `UUID`, Primary Key)
- `name` (`String`)
- `location` (`String`)
- `createdAt` (`DateTime`, Default: `now()`)
- `updatedAt` (`DateTime`, Auto-updated)

#### 3. `DiagnosticTest` (`diagnostic_tests`)
- `id` (`String` / `UUID`, Primary Key)
- `centreId` (`String`, Foreign Key -> `DiagnosticCentre.id` with `ON DELETE CASCADE`)
- `name` (`String`)
- `price` (`Float`)
- `createdAt` (`DateTime`, Default: `now()`)
- `updatedAt` (`DateTime`, Auto-updated)

#### 4. `Booking` (`bookings`)
- `id` (`String` / `UUID`, Primary Key)
- `userId` (`String`, Foreign Key -> `User.id` with `ON DELETE CASCADE`)
- `testId` (`String`, Foreign Key -> `DiagnosticTest.id` with `ON DELETE CASCADE`)
- `centreId` (`String`, Foreign Key -> `DiagnosticCentre.id` with `ON DELETE CASCADE`)
- `appointmentDatetime` (`DateTime`)
- `amount` (`Float`, Snapshot price copied from `DiagnosticTest.price` at booking creation)
- `status` (`Enum: BookingStatus`, Values: `PENDING`, `CONFIRMED`, `FAILED`, `CANCELLED`, Default: `PENDING`)
- `createdAt` (`DateTime`, Default: `now()`)
- `updatedAt` (`DateTime`, Auto-updated)

#### 5. `Payment` (`payments`)
- `id` (`String` / `UUID`, Primary Key)
- `bookingId` (`String`, `UNIQUE`, Foreign Key -> `Booking.id` with `ON DELETE CASCADE`)
- `amount` (`Float`)
- `status` (`Enum: PaymentStatus`, Values: `SUCCESS`, `FAILED`, `PENDING`)
- `providerReferenceId` (`String`, `UNIQUE`)
- `createdAt` (`DateTime`, Default: `now()`)
- `updatedAt` (`DateTime`, Auto-updated)

#### 6. `WebhookEvent` (`webhook_events`)
- `id` (`String` / `UUID`, Primary Key)
- `eventId` (`String`, `UNIQUE`, Database-level Idempotency Key)
- `bookingId` (`String?`, Optional)
- `providerReferenceId` (`String?`, Optional)
- `status` (`String`)
- `payload` (`Json?`, Optional)
- `processedAt` (`DateTime`, Default: `now()`)
- `createdAt` (`DateTime`, Default: `now()`)

---

### Relationship Explanations

1. **User → Booking** (`One-to-Many`): A `User` can create multiple diagnostic `Bookings`. Each `Booking` belongs to exactly one `User`.
2. **DiagnosticCentre → DiagnosticTest** (`One-to-Many`): A `DiagnosticCentre` hosts multiple `DiagnosticTest` procedures. Each `DiagnosticTest` belongs to one `DiagnosticCentre`.
3. **DiagnosticCentre & DiagnosticTest → Booking** (`One-to-Many`): A `Booking` references one `DiagnosticTest` and its host `DiagnosticCentre`.
4. **Booking ↔ Payment** (`One-to-One`): Enforced via `@unique` constraint on `Payment.bookingId`. A `Booking` can have at most one associated `Payment` record.
5. **WebhookEvent → Booking/Payment** (`Loose Coupling`): A `WebhookEvent` references `bookingId` or `providerReferenceId` to update payment/booking state while maintaining independent audit logs.

---

### Entity Relationship (ER) Diagram

```mermaid
erDiagram
    User ||--o{ Booking : "creates"
    DiagnosticCentre ||--o{ DiagnosticTest : "offers"
    DiagnosticCentre ||--o{ Booking : "hosts"
    DiagnosticTest ||--o{ Booking : "booked in"
    Booking ||--o| Payment : "has single"
    Booking ||--o{ WebhookEvent : "references"

    User {
        string id PK
        string email UK
        string password
        string name
        datetime createdAt
        datetime updatedAt
    }

    DiagnosticCentre {
        string id PK
        string name
        string location
        datetime createdAt
        datetime updatedAt
    }

    DiagnosticTest {
        string id PK
        string centreId FK
        string name
        float price
        datetime createdAt
        datetime updatedAt
    }

    Booking {
        string id PK
        string userId FK
        string testId FK
        string centreId FK
        datetime appointmentDatetime
        float amount
        enum status "PENDING | CONFIRMED | FAILED | CANCELLED"
        datetime createdAt
        datetime updatedAt
    }

    Payment {
        string id PK
        string bookingId UK_FK
        float amount
        enum status "SUCCESS | FAILED | PENDING"
        string providerReferenceId UK
        datetime createdAt
        datetime updatedAt
    }

    WebhookEvent {
        string id PK
        string eventId UK
        string bookingId
        string providerReferenceId
        string status
        json payload
        datetime processedAt
        datetime createdAt
    }
```

---

### Technical Rationale for Design Decisions

1. **Snapshot Pricing (`Booking.amount`)**:
   - **Why**: Diagnostic test prices in `DiagnosticTest.price` may change over time due to lab inflation or promotional discounts. Copying `test.price` into `booking.amount` at booking creation locks in the agreed financial contract, protecting historical financial audits and payment calculations from test catalog modifications.
2. **Webhook Idempotency (`WebhookEvent.eventId` `@unique`)**:
   - **Why**: Payment gateways (Stripe/Razorpay) frequently re-send webhook events due to network retries. Enforcing a DB-level `@unique` constraint on `eventId` inside an atomic transaction ensures duplicate webhooks fail uniqueness gracefully and return HTTP 200 without modifying payment or booking state.
3. **Double Payment & Concurrency Protection (`Payment.bookingId` `@unique`)**:
   - **Why**: If a user double-clicks "Pay Now" or sends concurrent requests, database unique constraint violations (`P2002`) are caught inside an atomic transaction (`prisma.$transaction`), returning a clean HTTP 409 Conflict response without corrupting database state.

---

## 📡 API Endpoints & Example Requests

### Summary Table

| Method | Endpoint | Description | Auth Required? |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/signup` | Register a new user account | ❌ No |
| `POST` | `/auth/login` | Authenticate credentials & return JWT | ❌ No |
| `POST` | `/centres` | Create a diagnostic centre | 🔒 Yes (JWT) |
| `GET` | `/centres` | List diagnostic centres (paginated) | ❌ No |
| `GET` | `/centres/:id` | Get centre detail with tests catalog | ❌ No |
| `POST` | `/centres/:id/tests` | Add a diagnostic test to a centre | 🔒 Yes (JWT) |
| `GET` | `/tests` | Search/filter diagnostic tests catalog | ❌ No |
| `POST` | `/bookings` | Create a booking with price snapshot | 🔒 Yes (JWT) |
| `GET` | `/bookings` | List authenticated user's bookings | 🔒 Yes (JWT) |
| `GET` | `/bookings/:id` | Get booking detail (enforces owner) | 🔒 Yes (JWT) |
| `POST` | `/bookings/:id/cancel` | Cancel a booking (PENDING/CONFIRMED) | 🔒 Yes (JWT) |
| `POST` | `/payments` | Simulate payment for PENDING booking | 🔒 Yes (JWT) |
| `POST` | `/payments/webhook` | Process idempotent payment webhook | ❌ No |

---

### 1. POST /auth/signup
Registers a new user, hashes password with Bcrypt (10 rounds), and returns the created profile.

- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "email": "priya.sharma@example.com",
    "password": "Password123!",
    "name": "Priya Sharma"
  }
  ```
- **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "User registered successfully",
    "data": {
      "id": "c1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c",
      "email": "priya.sharma@example.com",
      "name": "Priya Sharma",
      "createdAt": "2026-09-25T20:00:00.000Z",
      "updatedAt": "2026-09-25T20:00:00.000Z"
    }
  }
  ```
- **Error Response (400 Validation Error)**:
  ```json
  {
    "success": false,
    "error": {
      "message": "Validation Error",
      "details": [
        {
          "field": "email",
          "message": "Invalid email address format"
        }
      ]
    }
  }
  ```
- **Error Response (409 Conflict - Duplicate Email)**:
  ```json
  {
    "success": false,
    "error": {
      "message": "Email is already registered"
    }
  }
  ```

---

### 2. POST /auth/login
Authenticates credentials and returns a signed JWT access token.

- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "email": "priya.sharma@example.com",
    "password": "Password123!"
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "user": {
        "id": "c1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c",
        "email": "priya.sharma@example.com",
        "name": "Priya Sharma",
        "createdAt": "2026-09-25T20:00:00.000Z"
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```
- **Error Response (401 Unauthorized - Invalid Credentials)**:
  ```json
  {
    "success": false,
    "error": {
      "message": "Invalid email or password"
    }
  }
  ```

---

### 3. POST /centres
Creates a diagnostic centre.

- **Auth Required**: Yes (`Authorization: Bearer <token>`)
- **Request Body**:
  ```json
  {
    "name": "Apex Hospital",
    "location": "Gurugram"
  }
  ```
- **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Diagnostic centre created successfully",
    "data": {
      "id": "centre_apex",
      "name": "Apex Hospital",
      "location": "Gurugram",
      "createdAt": "2026-09-25T20:05:00.000Z",
      "updatedAt": "2026-09-25T20:05:00.000Z"
    }
  }
  ```

---

### 4. GET /centres
Retrieves paginated diagnostic centres (supports `page`, `pageSize`, `limit`, `offset`).

- **Auth Required**: No
- **Query Parameters**: `?page=1&pageSize=10`
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Diagnostic centres retrieved successfully",
    "data": [
      {
        "id": "centre_apex",
        "name": "Apex Hospital",
        "location": "Gurugram",
        "createdAt": "2026-09-25T20:05:00.000Z",
        "updatedAt": "2026-09-25T20:05:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "totalItems": 5,
      "totalPages": 1
    }
  }
  ```

---

### 5. GET /centres/:id
Retrieves detailed information for a diagnostic centre including its test catalog.

- **Auth Required**: No
- **Path Parameter**: `id` = `centre_apex`
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Diagnostic centre details retrieved successfully",
    "data": {
      "id": "centre_apex",
      "name": "Apex Hospital",
      "location": "Gurugram",
      "createdAt": "2026-09-25T20:05:00.000Z",
      "updatedAt": "2026-09-25T20:05:00.000Z",
      "tests": [
        {
          "id": "t1",
          "centreId": "centre_apex",
          "name": "Complete Blood Count (CBC)",
          "price": 350.00,
          "createdAt": "2026-09-25T20:05:00.000Z"
        }
      ]
    }
  }
  ```
- **Error Response (404 Not Found)**:
  ```json
  {
    "success": false,
    "error": {
      "message": "Diagnostic centre with ID 'invalid_id' not found"
    }
  }
  ```

---

### 6. POST /centres/:id/tests
Adds a new diagnostic test procedure to a specific centre.

- **Auth Required**: Yes (`Authorization: Bearer <token>`)
- **Path Parameter**: `id` = `centre_apex`
- **Request Body**:
  ```json
  {
    "name": "Lipid Profile",
    "price": 750.00
  }
  ```
- **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Diagnostic test added to centre successfully",
    "data": {
      "id": "t2",
      "centreId": "centre_apex",
      "name": "Lipid Profile",
      "price": 750.00,
      "createdAt": "2026-09-25T20:10:00.000Z",
      "updatedAt": "2026-09-25T20:10:00.000Z"
    }
  }
  ```

---

### 7. GET /tests
Searches and lists diagnostic tests across all centres with pagination and filters (`name`, `centreId`).

- **Auth Required**: No
- **Query Parameters**: `?name=Blood&page=1&pageSize=10`
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Diagnostic tests retrieved successfully",
    "data": [
      {
        "id": "t1",
        "centreId": "centre_apex",
        "name": "Complete Blood Count (CBC)",
        "price": 350.00,
        "createdAt": "2026-09-25T20:05:00.000Z",
        "centre": {
          "id": "centre_apex",
          "name": "Apex Hospital",
          "location": "Gurugram"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "totalItems": 1,
      "totalPages": 1
    }
  }
  ```

---

### 8. POST /bookings
Creates a new appointment booking for the authenticated user, copying the current test price as a snapshot into `amount`.

- **Auth Required**: Yes (`Authorization: Bearer <token>`)
- **Request Body**:
  ```json
  {
    "testId": "t1",
    "appointmentDatetime": "2026-10-15T10:00:00.000Z"
  }
  ```
- **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Booking created successfully",
    "data": {
      "id": "bkg_1001",
      "userId": "c1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c",
      "testId": "t1",
      "centreId": "centre_apex",
      "appointmentDatetime": "2026-10-15T10:00:00.000Z",
      "amount": 350.00,
      "status": "PENDING",
      "createdAt": "2026-09-25T20:15:00.000Z",
      "updatedAt": "2026-09-25T20:15:00.000Z"
    }
  }
  ```
- **Error Response (400 Bad Request - Past Appointment Date)**:
  ```json
  {
    "success": false,
    "error": {
      "message": "Validation Error",
      "details": [
        {
          "field": "appointmentDatetime",
          "message": "Appointment datetime must be in the future"
        }
      ]
    }
  }
  ```

---

### 9. GET /bookings
Lists all bookings belonging to the current authenticated user.

- **Auth Required**: Yes (`Authorization: Bearer <token>`)
- **Query Parameters**: `?page=1&pageSize=10`
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "User bookings retrieved successfully",
    "data": [
      {
        "id": "bkg_1001",
        "userId": "c1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c",
        "testId": "t1",
        "centreId": "centre_apex",
        "appointmentDatetime": "2026-10-15T10:00:00.000Z",
        "amount": 350.00,
        "status": "PENDING",
        "createdAt": "2026-09-25T20:15:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "totalItems": 1,
      "totalPages": 1
    }
  }
  ```

---

### 10. GET /bookings/:id
Retrieves detailed booking information. Strictly checks ownership (`booking.userId === req.user.id`).

- **Auth Required**: Yes (`Authorization: Bearer <token>`)
- **Path Parameter**: `id` = `bkg_1001`
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Booking details retrieved successfully",
    "data": {
      "id": "bkg_1001",
      "userId": "c1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c",
      "testId": "t1",
      "centreId": "centre_apex",
      "appointmentDatetime": "2026-10-15T10:00:00.000Z",
      "amount": 350.00,
      "status": "PENDING",
      "test": {
        "id": "t1",
        "name": "Complete Blood Count (CBC)",
        "price": 350.00
      },
      "centre": {
        "id": "centre_apex",
        "name": "Apex Hospital",
        "location": "Gurugram"
      },
      "payment": null
    }
  }
  ```
- **Error Response (403 Forbidden - Cross User Access)**:
  ```json
  {
    "success": false,
    "error": {
      "message": "You do not have permission to access this booking"
    }
  }
  ```

---

### 11. POST /bookings/:id/cancel
Cancels an active booking (`PENDING` or `CONFIRMED` -> `CANCELLED`). Calling cancel on an already `CANCELLED` booking returns a clean HTTP 200 response.

- **Auth Required**: Yes (`Authorization: Bearer <token>`)
- **Path Parameter**: `id` = `bkg_1001`
- **Success Response (200 OK)**:
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
- **Success Response (200 OK - Already Cancelled)**:
  ```json
  {
    "success": true,
    "message": "Booking is already cancelled",
    "data": {
      "id": "bkg_1001",
      "status": "CANCELLED"
    }
  }
  ```

---

### 12. POST /payments
Simulates payment for a `PENDING` booking. Executes atomic transaction (`prisma.$transaction`) to create Payment record and update Booking status (`CONFIRMED` on SUCCESS, `FAILED` on FAILED).

- **Auth Required**: Yes (`Authorization: Bearer <token>`)
- **Request Body**:
  ```json
  {
    "bookingId": "bkg_1001",
    "simulateFailure": false
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Payment processed successfully",
    "data": {
      "payment": {
        "id": "pay_9001",
        "bookingId": "bkg_1001",
        "amount": 350.00,
        "status": "SUCCESS",
        "providerReferenceId": "PAY-A1B2C3D4-1790347105",
        "createdAt": "2026-09-25T20:20:00.000Z"
      },
      "booking": {
        "id": "bkg_1001",
        "status": "CONFIRMED"
      }
    }
  }
  ```
- **Error Response (409 Conflict - Double Payment or Non-PENDING Booking)**:
  ```json
  {
    "success": false,
    "error": {
      "message": "Cannot process payment for booking with status 'CONFIRMED'. Only PENDING bookings can be paid."
    }
  }
  ```

---

### 13. POST /payments/webhook
Idempotent payment webhook receiver. Checks/inserts `WebhookEvent` by unique `eventId`. Duplicate `eventId` payloads safely return HTTP 200 without duplicate execution.

- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "eventId": "evt_wh_1001",
    "bookingId": "bkg_1001",
    "status": "SUCCESS"
  }
  ```
- **Success Response (200 OK - First Processing)**:
  ```json
  {
    "success": true,
    "message": "Webhook processed successfully",
    "data": {
      "processed": true,
      "duplicate": false,
      "eventId": "evt_wh_1001"
    }
  }
  ```
- **Success Response (200 OK - Duplicate Event)**:
  ```json
  {
    "success": true,
    "message": "Webhook event 'evt_wh_1001' has already been processed",
    "data": {
      "processed": false,
      "duplicate": true,
      "eventId": "evt_wh_1001"
    }
  }
  ```

---

## 💡 Important Assumptions

1. **Simulated Payment Decision Rule**:
   - In `PaymentsService`, when `simulateFailure` is omitted (`undefined`/`null`), the gateway decision is determined via a weighted random draw (85% `SUCCESS` / 15% `FAILED`).
   - If `simulateFailure: true` is explicitly passed, the outcome is deterministically set to `FAILED`. If `simulateFailure: false` is explicitly passed, the outcome is forced to `SUCCESS`.
2. **Access Control Model**:
   - Diagnostic Centre and Test write management routes (`POST /centres`, `POST /centres/:id/tests`) and all Booking/Payment routes require valid JWT authentication (`authenticateJWT`).
   - Read routes (`GET /centres`, `GET /centres/:id`, `GET /tests`) remain public.
3. **Rate Limiting Enforcement (Bonus Implemented)**:
   - Configured `express-rate-limit` on sensitive write endpoints: `POST /auth/login` (10 requests per 15 minutes per IP) and `POST /payments/webhook` (60 requests per minute per IP). Returns standardized HTTP 429 error shape when exceeded.
4. **Database Indexes Implemented**:
   - Added composite index `Booking(userId, status)` for fast booking queries and single index `Payment(providerReferenceId)` in Prisma schema.
5. **Booking Cancellation Rules**:
   - Cancellation is permitted if status is `PENDING` or `CONFIRMED`.
   - Calling cancel on an already `CANCELLED` booking returns a clean HTTP 200 response rather than throwing an unhandled error.
   - Calling cancel on a `FAILED` booking returns an HTTP 409 Conflict error.
6. **Security & Password Specifications**:
   - User passwords are required to be at least 6 characters long and are hashed using Bcrypt with 10 salt rounds.
   - JWT tokens are signed using HMAC SHA-256 with a 1-day (`1d`) expiration.

---

## 🔮 What I Would Improve With More Time

1. **BullMQ / Redis Asynchronous Webhook Queue**:
   - Transition webhook processing from synchronous HTTP execution to an asynchronous worker queue (BullMQ + Redis) with exponential backoff retries and dead-letter queues (DLQ).
2. **Role-Based Access Control (RBAC)**:
   - Expand JWT claims to include `ROLE_ADMIN` and `ROLE_PATIENT` user roles for fine-grained permissions beyond basic JWT token verification.
3. **Refresh Tokens & JWT Blacklisting**:
   - Implement short-lived access tokens (15 mins) paired with HTTP-only refresh tokens stored in Redis for token revocation on logout.
4. **End-to-End Automated Testing**:
   - Expand the Jest/Supertest suite with Playwright / Cypress end-to-end browser integration tests.

---

## 🧪 Running Automated Tests

The repository contains a full test suite powered by **Jest** and **Supertest** (33 unit & integration tests, 100% pass rate).

```bash
npm test
```
