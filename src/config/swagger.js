const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: "EVE Healthcare Diagnostic Test Booking & Simulated Payments API",
      version: '1.0.0',
      description:
        'Production-grade RESTful API service for diagnostic test bookings, pricing snapshots, payment simulations, and idempotent payment webhooks.',
      contact: {
        name: 'EVE Healthcare Engineering Team',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Local Development Server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT access token obtained from /auth/login or /auth/signup',
        },
      },
    },
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
