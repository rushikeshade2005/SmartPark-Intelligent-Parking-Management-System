const express = require('express');
const router = express.Router();
const {
	getUsers,
	deleteUser,
	getAnalytics,
	getActiveBookings,
	getMyDashboard,
	getMyParkingLots,
	getMyParkingLotById,
	getMyParkingSlots,
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/my-dashboard', protect, adminOnly, getMyDashboard);
router.get('/parking-lots', protect, adminOnly, getMyParkingLots);
router.get('/parking-lots/:id', protect, adminOnly, getMyParkingLotById);
router.get('/parking-lots/:lotId/slots', protect, adminOnly, getMyParkingSlots);
router.get('/users', protect, adminOnly, getUsers);
router.delete('/users/:id', protect, adminOnly, deleteUser);
router.get('/analytics', protect, adminOnly, getAnalytics);
router.get('/active-bookings', protect, adminOnly, getActiveBookings);

module.exports = router;
