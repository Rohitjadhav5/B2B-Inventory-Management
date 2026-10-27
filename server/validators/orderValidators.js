const { z } = require('zod');

// ─── Order Validators ──────────────────────────────────────────────────────────

// Single item in a create-order request
const orderItemSchema = z.object({
  productId: z.string().min(1, 'productId is required'),
  // Quantity MUST be integer > 0
  quantity: z
    .number({ invalid_type_error: 'Quantity must be a number' })
    .int('Quantity must be an integer')
    .min(1, 'Quantity must be greater than 0'),
});

exports.createOrderSchema = z
  .object({
    vendorId: z.string().min(1, 'vendorId is required'),
    items: z.array(orderItemSchema).min(1, 'Order must have at least one item'),
  })
  // Reject duplicate productIds in a single order
  .refine(
    (data) => {
      const ids = data.items.map((i) => i.productId);
      return new Set(ids).size === ids.length;
    },
    { message: 'Duplicate productIds are not allowed in one order', path: ['items'] }
  );

// Vendor status update: only allowed forward transitions
exports.updateStatusSchema = z.object({
  status: z.enum(['Shipped', 'Delivered'], {
    errorMap: () => ({ message: 'Status must be Shipped or Delivered' }),
  }),
});

// Query params for listing orders
exports.listOrdersQuerySchema = z.object({
  status: z.enum(['Pending Delivery', 'Shipped', 'Delivered', 'Cancelled']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});
