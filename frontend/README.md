# EVE Healthcare - Diagnostic Test Booking & Payments Frontend

A production-ready, highly polished **React** web application built with **Vite**, **Tailwind CSS**, **React Router v6**, and **Axios**. The application interfaces directly with the EVE Healthcare Express REST API to provide seamless user authentication, diagnostic centre & test discovery, appointment booking with snapshot pricing, and simulated payment processing with live webhook developer tools.

---

## 🔑 Demo User Accounts

All seeded demo accounts use the password: `Password123!`

- **Priya Sharma**: `priya.sharma@example.com`
- **Rahul Verma**: `rahul.verma@example.com`
- **Ananya Deshmukh**: `ananya.deshmukh@example.com`
- **Vikram Singh**: `vikram.singh@example.com`

---

## 🎨 Features & Key Architecture

1. **Centralized Axios API Client** (`src/api/client.js`)
   - **Request Interceptor**: Injects `Authorization: Bearer <token>` automatically whenever a valid JWT is present in `localStorage`.
   - **Response Interceptor**: Automatically catches `401 Unauthorized` responses (e.g. token expiry), clears auth state, and redirects the user to `/login` with a clear notification.

2. **Global Auth Context** (`src/context/AuthContext.jsx`)
   - Manages user profile and JWT state in memory with `localStorage` persistence across page reloads.

3. **Form Validation & Date Guards**
   - Built with `react-hook-form` + `@hookform/resolvers/zod`.
   - Datetime pickers explicitly disable past dates/times (`min={current_datetime}`) to enforce valid appointment scheduling client-side.

4. **Interactive Payment Simulation & Webhook Tester**
   - Simulated payment flow featuring loading spinners, confetti celebrations (`canvas-confetti`), and 409 double-payment conflict handling.
   - **Developer Tools Panel**: Floating drawer allowing evaluators to fire simulated `POST /payments/webhook` payloads live to evaluate idempotency and status transitions.

5. **Healthcare-Tailored UI & Responsiveness**
   - Professional healthcare palette (Teal/Emerald/Slate), generous whitespace, cards, status badges, skeletons, and custom empty state placeholders.
   - Fully responsive design with mobile navbar drawer.

---

## 🚀 Setup & Execution Instructions

1. **Navigate to Frontend Directory**:
   ```bash
   cd frontend
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Start Development Server**:
   ```bash
   npm run dev
   ```
   - Application URL: `http://localhost:5173`
