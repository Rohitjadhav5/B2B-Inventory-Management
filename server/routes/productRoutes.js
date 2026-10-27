const express = require('express');
const router = express.Router();
const {
  getVendorProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  browseProducts,
  getVendors,
} = require('../controllers/productController');
const { protect } = require('../middleware/auth');
const { restrictTo } = require('../middleware/role');
const { validate } = require('../middleware/validate');
const {
  createProductSchema,
  updateProductSchema,
  browseProductsQuerySchema,
} = require('../validators/productValidators');

// GET /api/vendors – managers only (used for dropdown)
router.get('/vendors', protect, restrictTo('manager'), getVendors);

// All /api/products routes require authentication
router.use(protect);

router
  .route('/')
  // Vendor: see own products | Manager: browse active products
  .get((req, res, next) => {
    if (req.user.role === 'vendor') return getVendorProducts(req, res, next);
    // Manager path: validate query params
    validate(browseProductsQuerySchema, 'query')(req, res, () => browseProducts(req, res, next));
  })
  // Vendor only: create a product
  .post(restrictTo('vendor'), validate(createProductSchema), createProduct);

router
  .route('/:id')
  .put(restrictTo('vendor'), validate(updateProductSchema), updateProduct)
  .delete(restrictTo('vendor'), deleteProduct);

module.exports = router;
