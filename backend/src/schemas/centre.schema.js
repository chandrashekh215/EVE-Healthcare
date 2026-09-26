const { z } = require('zod');

const createCentreSchema = z.object({
  name: z.string().trim().min(1, { message: 'Centre name is required' }),
  location: z.string().trim().min(1, { message: 'Centre location is required' }),
});

const getCentresSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

const addTestSchema = z.object({
  name: z.string().trim().min(1, { message: 'Test name is required' }),
  price: z.number().positive({ message: 'Price must be a positive number' }),
});

const getTestsSchema = z.object({
  centreId: z.string().uuid().optional().or(z.string().min(1).optional()),
  name: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

const getCentreTestsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

module.exports = {
  createCentreSchema,
  getCentresSchema,
  addTestSchema,
  getTestsSchema,
  getCentreTestsSchema,
};
