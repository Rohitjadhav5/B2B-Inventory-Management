const { z } = require('zod');

// ─── Product Validators ────────────────────────────────────────────────────────

exports.createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').trim(),
  sku: z.string().min(1, 'Product Code is required').trim(),
  price: z.number({ invalid_type_error: 'Price must be a number' }).min(0, 'Price must be >= 0'),
  stock: z
    .number({ invalid_type_error: 'Stock must be a number' })
    .int('Stock must be an integer')
    .min(0, 'Stock must be >= 0'),
  isActive: z.boolean().optional(),
});

exports.updateProductSchema = z.object({
  name: z.string().min(1).trim().optional(),
  sku: z.string().min(1).trim().optional(),
  price: z.number().min(0, 'Price must be >= 0').optional(),
  stock: z.number().int('Stock must be an integer').min(0, 'Stock must be >= 0').optional(),
  isActive: z.boolean().optional(),
});

// Query params for manager browsing products
exports.browseProductsQuerySchema = z.object({
  vendorId: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});
