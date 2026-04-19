const express = require('express');
const router = express.Router();
const {
  submitContact,
  getContacts,
  getContact,
  replyContact,
  updateContactStatus,
  deleteContact,
  getContactStats,
  getMyMessages,
} = require('../controllers/contactController');
const { protect, adminOnly } = require('../middleware/auth');

// Optional auth middleware — attaches user if token exists, but doesn't block
const optionalAuth = async (req, res, next) => {
  const jwt = require('jsonwebtoken');
  const User = require('../models/User');
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id);
    } catch {
      // Token invalid — proceed without user
    }
  }
  next();
};

// Public route — anyone can submit
router.post('/', optionalAuth, submitContact);

// Authenticated user route — view own messages
router.get('/my-messages', protect, getMyMessages);

// Admin routes
router.get('/stats', protect, adminOnly, getContactStats);
router.get('/', protect, adminOnly, getContacts);
router.get('/:id', protect, adminOnly, getContact);
router.put('/:id/reply', protect, adminOnly, replyContact);
router.put('/:id/status', protect, adminOnly, updateContactStatus);
router.delete('/:id', protect, adminOnly, deleteContact);

module.exports = router;
