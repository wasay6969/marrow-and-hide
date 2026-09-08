const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, async (req, res) => {
  try {
    const { items, shippingAddress } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Order must contain at least one item.' });
    }

  let totalAmount = 0;
    const resolvedItems = [];
    for (const it of items) {
      const product = await Product.findById(it.productId);
      if (!product) return res.status(400).json({ message: `Product ${it.productId} not found.` });
      if (product.stock < it.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${product.name}.` });
      }
      resolvedItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: it.quantity,
      });
      totalAmount += product.price * it.quantity;
      product.stock -= it.quantity;
      await product.save();
    }

  const order = await Order.create({
    user: req.user.id,
    items: resolvedItems,
    totalAmount,
    shippingAddress,
  });

  res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ message: 'Could not place order.', error: err.message });
  }
});

router.get('/mine', protect, async (req, res) => {
  const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
  res.json(orders);
});

router.get('/', protect, adminOnly, async (req, res) => {
  const orders = await Order.find().populate('user', 'fullName email').sort({ createdAt: -1 });
  res.json(orders);
});

router.put('/:id/status', protect, adminOnly, async (req, res) => {
  const { status } = req.body;
  const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!order) return res.status(404).json({ message: 'Order not found.' });
  res.json(order);
});

module.exports = router;
