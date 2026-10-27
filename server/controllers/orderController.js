const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');

// Helper: populate an order for consistent response shape
const populateOrder = (query) =>
  query
    .populate('manager', 'name email storeName')
    .populate('vendor', 'name email companyName')
    .populate('items.product', 'name sku price');

// ─── POST /api/orders  (manager only) ────────────────────────────────────────
exports.createOrder = async (req, res, next) => {
  const { vendorId, items } = req.body;

  // Start a MongoDB session for the atomic transaction
  const session = await mongoose.startSession();
  try {
    let createdOrder;

    await session.withTransaction(async () => {
      // 1. Load all referenced products in one query
      const productIds = items.map((i) => i.productId);
      const products = await Product.find({ _id: { $in: productIds } }).session(session);

      // 2. Validate: every product must belong to vendorId and be active
      const invalidProducts = [];
      const productMap = {};
      for (const p of products) {
        if (p.vendor.toString() !== vendorId || !p.isActive) {
          invalidProducts.push(p._id);
        }
        productMap[p._id.toString()] = p;
      }
      // Also catch products not found at all
      for (const id of productIds) {
        if (!productMap[id]) invalidProducts.push(id);
      }
      if (invalidProducts.length > 0) {
        const err = new Error('Some products are invalid, inactive, or do not belong to this vendor.');
        err.statusCode = 400;
        throw err;
      }

      // 3. Check stock for every item – collect ALL failures before rejecting
      const stockFailures = [];
      for (const item of items) {
        const product = productMap[item.productId];
        if (product.stock < item.quantity) {
          stockFailures.push({
            productId: product._id,
            productName: product.name,
            requested: item.quantity,
            available: product.stock,
          });
        }
      }
      if (stockFailures.length > 0) {
        const err = new Error('Insufficient stock for one or more products.');
        err.statusCode = 400;
        err.stockFailures = stockFailures;
        throw err;
      }

      // 4. Deduct stock atomically – one updateOne per product.
      // Using { stock: { $gte: qty } } prevents overselling under concurrency.
      for (const item of items) {
        const result = await Product.updateOne(
          { _id: item.productId, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } },
          { session }
        );
        if (result.modifiedCount === 0) {
          // Another concurrent request grabbed the last units – abort
          const err = new Error(`Concurrent stock conflict for product ${item.productId}. Please retry.`);
          err.statusCode = 409;
          throw err;
        }
      }

      // 5. Calculate totalCost from DB prices (never trust client)
      let totalCost = 0;
      const orderItems = items.map((item) => {
        const product = productMap[item.productId];
        totalCost += product.price * item.quantity;
        return {
          product: product._id,
          name: product.name,       // snapshot
          unitPrice: product.price, // snapshot
          quantity: item.quantity,
        };
      });

      // 6. Create the order inside the same transaction
      const [order] = await Order.create(
        [
          {
            manager: req.user.id,
            vendor: vendorId,
            items: orderItems,
            totalCost,
            status: 'Pending Delivery',
          },
        ],
        { session }
      );

      createdOrder = order;
    });

    // 7. Populate and return
    const populated = await populateOrder(Order.findById(createdOrder._id));
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    // Surface stock failure details to the client
    if (err.stockFailures) {
      return res.status(400).json({
        success: false,
        message: err.message,
        stockFailures: err.stockFailures,
      });
    }
    next(err);
  } finally {
    session.endSession();
  }
};

// ─── GET /api/orders  (role-filtered, paginated) ──────────────────────────────
exports.getOrders = async (req, res, next) => {
  try {
    const { status, page, limit } = req.query;

    // Managers see their own orders; vendors see orders addressed to them
    const filter = req.user.role === 'manager' ? { manager: req.user.id } : { vendor: req.user.id };
    if (status) filter.status = status;

    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      populateOrder(Order.find(filter)).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Order.countDocuments(filter),
    ]);

    res.json({
      success: true,
      count: orders.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: orders,
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/orders/:id ──────────────────────────────────────────────────────
exports.getOrderById = async (req, res, next) => {
  try {
    const order = await populateOrder(Order.findById(req.params.id));
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    // Access control: only the owning manager or addressed vendor can view
    const isOwner =
      order.manager._id.toString() === req.user.id ||
      order.vendor._id.toString() === req.user.id;
    if (!isOwner) return res.status(403).json({ success: false, message: 'Access denied.' });

    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};

// ─── PATCH /api/orders/:id/status  (vendor only) ─────────────────────────────
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status: newStatus } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    // Vendor can only update their own orders
    if (order.vendor.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    // Enforce forward-only transition: Pending Delivery → Shipped → Delivered
    const transitions = { 'Pending Delivery': 'Shipped', Shipped: 'Delivered' };
    if (transitions[order.status] !== newStatus) {
      return res.status(400).json({
        success: false,
        message: `Cannot transition from "${order.status}" to "${newStatus}".`,
      });
    }

    order.status = newStatus;
    await order.save();

    const populated = await populateOrder(Order.findById(order._id));
    res.json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};

// ─── PATCH /api/orders/:id/cancel  (manager or vendor, Pending Delivery only) ─
exports.cancelOrder = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    let cancelledOrder;

    await session.withTransaction(async () => {
      const order = await Order.findById(req.params.id).session(session);
      if (!order) {
        const err = new Error('Order not found.');
        err.statusCode = 404;
        throw err;
      }

      // Only the owning manager or addressed vendor can cancel
      const isManager = order.manager.toString() === req.user.id;
      const isVendor = order.vendor.toString() === req.user.id;
      if (!isManager && !isVendor) {
        const err = new Error('Access denied.');
        err.statusCode = 403;
        throw err;
      }

      if (order.status !== 'Pending Delivery') {
        const err = new Error('Only orders with status "Pending Delivery" can be cancelled.');
        err.statusCode = 400;
        throw err;
      }

      // Restore stock for every item in the same transaction
      for (const item of order.items) {
        await Product.updateOne(
          { _id: item.product },
          { $inc: { stock: item.quantity } },
          { session }
        );
      }

      order.status = 'Cancelled';
      await order.save({ session });
      cancelledOrder = order;
    });

    const populated = await populateOrder(Order.findById(cancelledOrder._id));
    res.json({ success: true, data: populated });
  } catch (err) {
    next(err);
  } finally {
    session.endSession();
  }
};
