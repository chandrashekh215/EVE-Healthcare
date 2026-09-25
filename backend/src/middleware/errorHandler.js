const { AppError } = require('../utils/errors');
const { errorResponse } = require('../utils/apiResponse');
const { ZodError } = require('zod');

const errorHandler = (err, req, res, next) => {
  req.log ? req.log.error(err) : console.error(err);

  // Handle AppError subclasses
  if (err instanceof AppError) {
    return errorResponse(res, err.statusCode, err.message, err.details);
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return errorResponse(res, 400, 'Validation Error', formattedErrors);
  }

  // Handle Prisma Database errors
  if (err.code === 'P2002') {
    const target = err.meta?.target || 'Field';
    return errorResponse(res, 409, `Conflict: Unique constraint failed on ${target}`, target);
  }

  if (err.code === 'P2025') {
    return errorResponse(res, 404, 'Requested record not found');
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    return errorResponse(res, 401, 'Invalid authentication token');
  }
  if (err.name === 'TokenExpiredError') {
    return errorResponse(res, 401, 'Authentication token expired');
  }

  // SyntaxError / JSON parse error
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return errorResponse(res, 400, 'Malformed JSON payload');
  }

  // Internal Server Error default
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal Server Error' 
    : err.message || 'Internal Server Error';

  return errorResponse(res, statusCode, message);
};

module.exports = errorHandler;
