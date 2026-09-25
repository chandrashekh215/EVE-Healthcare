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
- **30/30 unit & integration tests passing (100% pass rate)**.
