const express = require('express');
const Review = require('../models/Review');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/product/:productId', async (req, res) => {
  const reviews = await Review.find({ product: req.params.productId }).sort({ createdAt: -1 });
  res.json(reviews);
});

router.post('/', protect, async (req, res) => {
  try {
    const { productId, rating, comment, userName } = req.body;
    if (!productId || !rating || !comment) {
      return res.status(400).json({ message: 'productId, rating and comment are required.' });
    }

  const review = await Review.create({
    product: productId,
    user: req.user.id,
    userName: userName || 'Customer',
    rating,
    comment,
  });

  const product = await Product.findById(productId);
    if (product) {
      const allReviews = await Review.find({ product: productId });
      const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
      product.ratingAverage = Math.round(avg * 10) / 10;
      product.ratingCount = allReviews.length;
      await product.save();
    }

  res.status(201).json(review);
  } catch (err) {
    res.status(400).json({ message: 'Could not add review.', error: err.message });
  }
});

router.delete('/:id', protect, async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) return res.status(404).json({ message: 'Review not found.' });
  if (String(review.user) !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized to delete this review.' });
  }
  await review.deleteOne();
  res.json({ message: 'Review deleted.' });
});

module.exports = router;
