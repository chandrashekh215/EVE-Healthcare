const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const { requestLogger } = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');

// Import Route Handlers
const authRoutes = require('./routes/auth.routes');
const centresRoutes = require('./routes/centres.routes');
const testsRoutes = require('./routes/tests.routes');
const bookingsRoutes = require('./routes/bookings.routes');
const paymentsRoutes = require('./routes/payments.routes');
const webhooksRoutes = require('./routes/webhooks.routes');

const app = express();

// Security Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());

// Request Logging Middleware with UUID Request IDs
app.use(requestLogger);

// Rate Limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: { success: false, error: { message: 'Too many authentication requests, please try again later.' } },
});

const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { success: false, error: { message: 'Too many payment requests, please try again later.' } },
});

// Swagger API Documentation UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Root Endpoint - Redirect to API Documentation
app.get('/', (req, res) => {
  res.redirect('/api-docs');
});

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

// Mount Routes
app.use('/auth', authLimiter, authRoutes);
app.use('/centres', centresRoutes);
app.use('/tests', testsRoutes);
app.use('/bookings', bookingsRoutes);
app.use('/payments', webhooksRoutes); // Mount POST /payments/webhook
app.use('/payments', paymentLimiter, paymentsRoutes); // Mount POST /payments

// 404 Route Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: {
      message: `Route '${req.method} ${req.originalUrl}' not found`,
    },
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

module.exports = app;
