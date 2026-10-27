const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
} = require('../controllers/orderController');
const { protect } = require('../middleware/auth');
const { restrictTo } = require('../middleware/role');
const { validate } = require('../middleware/validate');
const {
  createOrderSchema,
  updateStatusSchema,
  listOrdersQuerySchema,
} = require('../validators/orderValidators');

// All order routes require authentication
router.use(protect);

router
  .route('/')
  .post(restrictTo('manager'), validate(createOrderSchema), createOrder)
  .get(validate(listOrdersQuerySchema, 'query'), getOrders);

router.get('/:id', getOrderById);

// Only vendors can advance status
router.patch('/:id/status', restrictTo('vendor'), validate(updateStatusSchema), updateOrderStatus);

// Both managers and vendors can cancel (controller enforces ownership)
router.patch('/:id/cancel', cancelOrder);

module.exports = router;
