const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

function validateRegistration({ fullName, email, phone, password, confirmPassword }) {
  const errors = [];

if (!fullName || !fullName.trim()) errors.push('Name is required.');

if (!email || !email.trim()) {
  errors.push('Email is required.');
} else {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) errors.push('Invalid email format.');
}

if (!phone || !phone.trim()) errors.push('Phone number is required.');

if (!password) {
  errors.push('Password is required.');
} else if (password.length < 6) {
  errors.push('Password must be at least 6 characters.');
}

if (!confirmPassword) {
  errors.push('Please confirm your password.');
} else if (password !== confirmPassword) {
  errors.push('Passwords do not match.');
}

return errors;
}

router.post('/register', async (req, res) => {
  const { fullName, email, phone, password, confirmPassword } = req.body;

            const errors = validateRegistration({ fullName, email, phone, password, confirmPassword });
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

            try {
              const existing = await User.findOne({ email: email.toLowerCase() });
              if (existing) {
                return res.status(400).json({ errors: ['An account with this email already exists.'] });
              }

  const user = await User.create({ fullName, email, phone, password });
              const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

  res.status(201).json({
    message: 'Registration successful.',
    token,
    user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role },
  });
            } catch (err) {
              res.status(500).json({ message: 'Server error during registration.', error: err.message });
            }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ errors: ['Email and password are required.'] });
  }

            try {
              const user = await User.findOne({ email: email.toLowerCase() });
              if (!user || !(await user.comparePassword(password))) {
                return res.status(401).json({ errors: ['Invalid email or password.'] });
              }

  const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
              res.json({
                message: 'Login successful.',
                token,
                user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role },
              });
            } catch (err) {
              res.status(500).json({ message: 'Server error during login.', error: err.message });
            }
});

module.exports = router;
