class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class BadRequestError extends AppError {
  constructor(message = 'Bad Request', details = null) {
    super(message, 400, details);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized access', details = null) {
    super(message, 401, details);
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Forbidden access', details = null) {
    super(message, 403, details);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found', details = null) {
    super(message, 404, details);
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource conflict', details = null) {
    super(message, 409, details);
  }
}

class ValidationError extends AppError {
  constructor(message = 'Validation error', details = null) {
    super(message, 400, details);
  }
}

class ServiceUnavailableError extends AppError {
  constructor(message = 'Service Unavailable', details = null) {
    super(message, 503, details);
  }
}

module.exports = {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  ServiceUnavailableError,
};
