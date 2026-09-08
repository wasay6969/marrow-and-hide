const express = require('express');
const Product = require('../models/Product');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

function slugify(text) {
  return text.toString().toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

router.get('/', async (req, res) => {
  const { category, search, featured } = req.query;
  const query = {};
  if (category) query.category = category;
  if (featured === 'true') query.featured = true;
  if (search) query.$text = { $search: search };

           const products = await Product.find(query).populate('category', 'name slug').sort({ createdAt: -1 });
  res.json(products);
});

router.get('/:id', async (req, res) => {
  const product = await Product.findById(req.params.id).populate('category', 'name slug');
  if (!product) return res.status(404).json({ message: 'Product not found.' });
  res.json(product);
});

router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { name, description, price, image, category, stock, material, featured } = req.body;
    if (!name || !description || price == null || !image || !category) {
      return res.status(400).json({ message: 'name, description, price, image and category are required.' });
    }
    const product = await Product.create({
      name,
      slug: slugify(name) + '-' + Date.now().toString(36),
      description,
      price,
      image,
      category,
      stock: stock || 0,
      material,
      featured: !!featured,
    });
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ message: 'Could not create product.', error: err.message });
  }
});

router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const update = { ...req.body };
    delete update.slug;
    const product = await Product.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ message: 'Product not found.' });
    res.json(product);
  } catch (err) {
    res.status(400).json({ message: 'Could not update product.', error: err.message });
  }
});

router.delete('/:id', protect, adminOnly, async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found.' });
  res.json({ message: 'Product deleted.' });
});

module.exports = router;
