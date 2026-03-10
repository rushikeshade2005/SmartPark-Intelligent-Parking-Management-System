const express = require('express');
const router = express.Router();
const {
  getContactInfo,
  updateContactInfo,
  getFooterContent,
  updateFooterContent,
} = require('../controllers/cmsController');
const { protect, adminOnly } = require('../middleware/auth');

// Public routes
router.get('/contact-info', getContactInfo);
router.get('/footer', getFooterContent);

// Admin routes
router.put('/contact-info', protect, adminOnly, updateContactInfo);
router.put('/footer', protect, adminOnly, updateFooterContent);

module.exports = router;
