const { z } = require('zod');

const signupSchema = z.object({
  email: z.string().trim().email({ message: 'Invalid email address format' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters long' }),
  name: z.string().trim().min(1, { message: 'Name is required' }),
});

const loginSchema = z.object({
  email: z.string().trim().email({ message: 'Invalid email address format' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

module.exports = {
  signupSchema,
  loginSchema,
};
