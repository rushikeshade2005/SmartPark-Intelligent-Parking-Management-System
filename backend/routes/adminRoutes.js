const express = require('express');
const router = express.Router();
const { getUsers, deleteUser, getAnalytics, getActiveBookings, getMyDashboard } = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/my-dashboard', protect, adminOnly, getMyDashboard);
router.get('/users', protect, adminOnly, getUsers);
router.delete('/users/:id', protect, adminOnly, deleteUser);
router.get('/analytics', protect, adminOnly, getAnalytics);
router.get('/active-bookings', protect, adminOnly, getActiveBookings);

module.exports = router;
