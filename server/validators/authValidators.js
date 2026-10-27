const { z } = require('zod');

// ─── Auth Validators ──────────────────────────────────────────────────────────

exports.registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').trim(),
  email: z.string().email('Invalid email format').toLowerCase().trim(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['vendor', 'manager'], { errorMap: () => ({ message: 'Role must be vendor or manager' }) }),
  // Optional role-specific fields
  storeName: z.string().trim().optional(),
  companyName: z.string().trim().optional(),
});

exports.loginSchema = z.object({
  email: z.string().email('Invalid email').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
});
