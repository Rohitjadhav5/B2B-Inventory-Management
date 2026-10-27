const Product = require('../models/Product');
const User = require('../models/User');

// ─── Vendor Routes ────────────────────────────────────────────────────────────

// GET /api/products  (vendor: own products)
exports.getVendorProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ vendor: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, count: products.length, data: products });
  } catch (err) {
    next(err);
  }
};

// POST /api/products  (vendor only)
exports.createProduct = async (req, res, next) => {
  try {
    const { name, productCode, price, stock, isActive } = req.body;
    const product = await Product.create({ vendor: req.user.id, name, productCode, price, stock, isActive });
    res.status(201).json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};

// PUT /api/products/:id  (vendor only – own product)
exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, vendor: req.user.id });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found or not yours.' });
    }
    Object.assign(product, req.body);
    await product.save();
    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/products/:id  (vendor only – own product)
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findOneAndDelete({ _id: req.params.id, vendor: req.user.id });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found or not yours.' });
    }
    res.json({ success: true, message: 'Product deleted.' });
  } catch (err) {
    next(err);
  }
};

// ─── Manager Routes ───────────────────────────────────────────────────────────

// GET /api/products  (manager: active products, paginated, filterable)
exports.browseProducts = async (req, res, next) => {
  try {
    const { vendorId, search, page, limit } = req.query;

    const filter = { isActive: true };
    if (vendorId) filter.vendor = vendorId;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const skip = (page - 1) * limit;
    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('vendor', 'name companyName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Product.countDocuments(filter),
    ]);

    res.json({
      success: true,
      count: products.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: products,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/vendors  (manager: list all vendor users for dropdown)
exports.getVendors = async (req, res, next) => {
  try {
    const vendors = await User.find({ role: 'vendor' }).select('name email companyName');
    res.json({ success: true, data: vendors });
  } catch (err) {
    next(err);
  }
};
