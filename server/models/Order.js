const mongoose = require('mongoose');

// Snapshot item schema: stores name & price AT ORDER TIME so history is preserved
const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    // Snapshot of the product name at order time
    name: { type: String, required: true },
    // Snapshot of the unit price at order time
    unitPrice: { type: Number, required: true },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be >= 1'],
      validate: { validator: Number.isInteger, message: 'Quantity must be an integer' },
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: [orderItemSchema],
    totalCost: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['Pending Delivery', 'Shipped', 'Delivered', 'Cancelled'],
      default: 'Pending Delivery',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
