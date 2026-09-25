/**
 * Standardized success response helper
 */
const successResponse = (res, statusCode, message, data = null) => {
  const response = {
    success: true,
    message,
  };
  if (data !== null) {
    response.data = data;
  }
  return res.status(statusCode).json(response);
};

/**
 * Standardized error response helper
 */
const errorResponse = (res, statusCode, message, details = null) => {
  const response = {
    success: false,
    error: {
      message,
    },
  };
  if (details !== null) {
    response.error.details = details;
  }
  return res.status(statusCode).json(response);
};

/**
 * Standardized paginated response helper
 */
const paginatedResponse = (res, statusCode, message, items, page, pageSize, totalItems) => {
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  return res.status(statusCode).json({
    success: true,
    message,
    data: items,
    pagination: {
      page: Number(page),
      pageSize: Number(pageSize),
      totalItems: Number(totalItems),
      totalPages,
    },
  });
};

module.exports = {
  successResponse,
  errorResponse,
  paginatedResponse,
};
