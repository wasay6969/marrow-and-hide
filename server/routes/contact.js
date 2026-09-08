const express = require('express');
const ContactMessage = require('../models/ContactMessage');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.post('/', async (req, res) => {
  const { fullName, email, subject, message } = req.body;
  const errors = [];

            if (!fullName || !fullName.trim()) errors.push('Name is required.');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('A valid email is required.');
  if (!subject || !subject.trim()) errors.push('Subject is required.');
  if (!message || !message.trim()) errors.push('Message is required.');

            if (errors.length > 0) return res.status(400).json({ errors });

            const saved = await ContactMessage.create({ fullName, email, subject, message });
  res.status(201).json({ message: 'Thank you - your message has been received.', id: saved._id });
});

router.get('/', protect, adminOnly, async (req, res) => {
  const messages = await ContactMessage.find().sort({ createdAt: -1 });
  res.json(messages);
});

module.exports = router;
