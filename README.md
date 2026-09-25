# EVE Healthcare - Diagnostic Test Booking & Simulated Payments System

A production-ready, clean-architecture backend service built for **EVE Healthcare** using **Node.js**, **Express**, **Prisma ORM**, and **PostgreSQL**. The service provides secure JWT authentication, diagnostic centre & test catalog management, appointment booking with snapshot pricing, simulated payment processing, and an idempotent payment webhook receiver.

---

## 🏛 Architecture & Key Design Decisions

1. **Separation of Concerns (Clean Architecture)**
   - **Routes**: Define HTTP endpoints, apply rate limiters, validation schemas, and auth guards.
   - **Controllers**: Thin layer parsing requests, calling services, and returning standard API responses.
   - **Services**: Pure framework-agnostic business logic containing all data transformations, transaction boundaries, and authorization logic.
   - **Prisma Data Layer**: Fully relational PostgreSQL models with foreign key constraints, default timestamps, and unique indexes.

2. **Idempotent Webhook Processing**
   - Implements a `WebhookEvent` model with a DB-level `UNIQUE` constraint on `eventId`.
   - Incoming webhooks attempt an atomic insert into `WebhookEvent`. If `eventId` already exists, the server immediately returns HTTP 200 with `{ processed: false, duplicate: true }` without modifying any payment or booking state.

3. **Double Payment & Race Condition Protection**
   - The `Payment` model enforces a `UNIQUE` constraint on `bookingId` (`one payment per booking`).
   - Payment processing uses atomic Prisma transactions (`prisma.$transaction`). If concurrent payment requests attempt to satisfy the same booking, database unique constraint violations (`P2002`) are caught and returned as clean `409 Conflict` errors.

4. **Snapshot Pricing**
   - When a booking is created (`POST /bookings`), the current live price of the selected diagnostic test is copied directly into `booking.amount`. Future price changes to the test will never affect existing bookings.

5. **Plain JavaScript over TypeScript**
   - Written in modern JavaScript (Node.js ESM/CommonJS) with Zod runtime validation guaranteeing strict type checking and body validation at runtime.

---

## 🚀 Setup & Database Seeding

### 1. Database Seeding Script

Populate the system with realistic diagnostic centres, tests, users, and varied booking/payment records for instant live testing:

```bash
npm run seed
```

#### Demo User Credentials (Password for all: `Password123!`)
- **Priya Sharma**: `priya.sharma@example.com`
- **Rahul Verma**: `rahul.verma@example.com`
- **Ananya Deshmukh**: `ananya.deshmukh@example.com`
- **Vikram Singh**: `vikram.singh@example.com`

---

## 🧬 Entity Relationship (ER) Diagram

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

## 🚀 Execution Instructions

### Option 1: Running with Docker & Docker Compose (Recommended)

```bash
docker-compose up --build
```

- API Base URL: `http://localhost:3000`
- Swagger API Docs: `http://localhost:3000/api-docs`

---

### Option 2: Running Locally without Docker

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Seed Sample Data**:
   ```bash
   npm run seed
   ```

3. **Start Development Server**:
   ```bash
   npm run dev
   ```

---

## 🧪 Running Automated Tests

Run the test suite:
```bash
npm test
```

---

## 📚 API Specification & Endpoint Documentation

Interactive Swagger OpenAPI 3.0 documentation is available at **`/api-docs`**.
