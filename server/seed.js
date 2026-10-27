/**
 * seed.js – Run with: node seed.js
 * Creates 2 vendors, 2 managers, and 10 products for development testing.
 * WARNING: Clears existing users and products before seeding.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Product = require('./models/Product');
const Order = require('./models/Order');

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // Clear existing seed data
  await User.deleteMany({});
  await Product.deleteMany({});
  await Order.deleteMany({});
  console.log('Cleared existing data');

  // Hash a common password
  const passwordHash = await bcrypt.hash('password123', 12);

  // ── Create Vendors ──────────────────────────────────────────────────────────
  const [vendor1, vendor2] = await User.insertMany([
    {
      name: 'Alice Vendor',
      email: 'vendor1@example.com',
      password: passwordHash,
      role: 'vendor',
      companyName: 'TechSupply Co.',
    },
    {
      name: 'Bob Vendor',
      email: 'vendor2@example.com',
      password: passwordHash,
      role: 'vendor',
      companyName: 'GlobalGoods Ltd.',
    },
  ]);

  // ── Create Managers ─────────────────────────────────────────────────────────
  await User.insertMany([
    {
      name: 'Carol Manager',
      email: 'manager1@example.com',
      password: passwordHash,
      role: 'manager',
      storeName: 'North Store',
    },
    {
      name: 'Dave Manager',
      email: 'manager2@example.com',
      password: passwordHash,
      role: 'manager',
      storeName: 'South Store',
    },
  ]);

  // ── Create Products ─────────────────────────────────────────────────────────
  await Product.insertMany([
    // Vendor 1 products
    { vendor: vendor1._id, name: 'Wireless Keyboard', sku: 'WK-001', price: 45.99, stock: 100 },
    { vendor: vendor1._id, name: 'USB-C Hub', sku: 'UC-001', price: 29.99, stock: 50 },
    { vendor: vendor1._id, name: 'Laptop Stand', sku: 'LS-001', price: 35.0, stock: 75 },
    { vendor: vendor1._id, name: 'Webcam HD', sku: 'WC-001', price: 89.99, stock: 30 },
    { vendor: vendor1._id, name: 'Noise-Cancelling Headset', sku: 'NH-001', price: 129.99, stock: 5 },
    // Vendor 2 products
    { vendor: vendor2._id, name: 'Office Chair', sku: 'OC-001', price: 299.99, stock: 20 },
    { vendor: vendor2._id, name: 'Standing Desk', sku: 'SD-001', price: 499.0, stock: 10 },
    { vendor: vendor2._id, name: 'Monitor Arm', sku: 'MA-001', price: 79.99, stock: 40 },
    { vendor: vendor2._id, name: 'Cable Management Kit', sku: 'CM-001', price: 19.99, stock: 200 },
    { vendor: vendor2._id, name: 'Desk Lamp LED', sku: 'DL-001', price: 49.99, stock: 60 },
  ]);

  console.log('\n✅ Seed complete! Test credentials (all passwords: password123):');
  console.log('  vendor1@example.com  | role: vendor  | TechSupply Co.');
  console.log('  vendor2@example.com  | role: vendor  | GlobalGoods Ltd.');
  console.log('  manager1@example.com | role: manager | North Store');
  console.log('  manager2@example.com | role: manager | South Store');

  await mongoose.disconnect();
};

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
