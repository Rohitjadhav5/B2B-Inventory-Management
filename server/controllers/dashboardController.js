const Order = require('../models/Order');
const Product = require('../models/Product');

// GET /api/dashboard
// Returns different stats based on the caller's role
exports.getDashboard = async (req, res, next) => {
  try {
    if (req.user.role === 'vendor') {
      // ── Vendor Stats ──────────────────────────────────────────────────────
      const vendorId = req.user.id;

      // Product counts
      const [totalProducts, lowStockCount] = await Promise.all([
        Product.countDocuments({ vendor: vendorId }),
        Product.countDocuments({ vendor: vendorId, stock: { $lt: 10 } }),
      ]);

      // Orders by status using aggregation
      const ordersByStatus = await Order.aggregate([
        { $match: { vendor: require('mongoose').Types.ObjectId.createFromHexString(vendorId) } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]);

      // Revenue: sum of totalCost from Delivered orders only
      const revenueResult = await Order.aggregate([
        {
          $match: {
            vendor: require('mongoose').Types.ObjectId.createFromHexString(vendorId),
            status: 'Delivered',
          },
        },
        { $group: { _id: null, revenue: { $sum: '$totalCost' } } },
      ]);
      const revenue = revenueResult[0]?.revenue || 0;

      // Convert array to { "Pending Delivery": N, ... } map
      const statusMap = {};
      for (const s of ordersByStatus) statusMap[s._id] = s.count;

      res.json({
        success: true,
        data: { totalProducts, lowStockCount, ordersByStatus: statusMap, revenue },
      });
    } else {
      // ── Manager Stats ─────────────────────────────────────────────────────
      const managerId = req.user.id;

      const ordersByStatus = await Order.aggregate([
        { $match: { manager: require('mongoose').Types.ObjectId.createFromHexString(managerId) } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]);

      const spendResult = await Order.aggregate([
        {
          $match: {
            manager: require('mongoose').Types.ObjectId.createFromHexString(managerId),
            status: { $ne: 'Cancelled' },
          },
        },
        { $group: { _id: null, totalSpend: { $sum: '$totalCost' } } },
      ]);
      const totalSpend = spendResult[0]?.totalSpend || 0;

      const statusMap = {};
      for (const s of ordersByStatus) statusMap[s._id] = s.count;

      res.json({
        success: true,
        data: { ordersByStatus: statusMap, totalSpend },
      });
    }
  } catch (err) {
    next(err);
  }
};
