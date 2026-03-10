const express = require('express');
const router = express.Router();
const { getUsers, deleteUser, getAnalytics, getActiveBookings } = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/users', protect, adminOnly, getUsers);
router.delete('/users/:id', protect, adminOnly, deleteUser);
router.get('/analytics', protect, adminOnly, getAnalytics);
router.get('/active-bookings', protect, adminOnly, getActiveBookings);

module.exports = router;
