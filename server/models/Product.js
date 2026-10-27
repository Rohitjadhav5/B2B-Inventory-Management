const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    // Which vendor owns this product
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    // Product codes must be unique per vendor.
    sku: {
      type: String,
      required: [true, 'Product Code is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price must be >= 0'],
    },
    stock: {
      type: Number,
      required: true,
      min: [0, 'Stock cannot be negative'],
      validate: {
        validator: Number.isInteger,
        message: 'Stock must be an integer',
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Compound index: product code unique per vendor.
productSchema.index({ vendor: 1, sku: 1 }, { unique: true });

module.exports = mongoose.model('Product', productSchema);
