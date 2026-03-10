const express = require('express');
const router = express.Router();
const {
  createBooking, getUserBookings, getAllBookings,
  cancelBooking, completeBooking, getBooking,
  checkIn, checkOut,
} = require('../controllers/bookingController');
const { protect, adminOnly } = require('../middleware/auth');
const { bookingValidation, validate } = require('../middleware/validate');

router.post('/create', protect, bookingValidation, validate, createBooking);
router.get('/user', protect, getUserBookings);
router.get('/all', protect, adminOnly, getAllBookings);
router.get('/:id', protect, getBooking);
router.delete('/cancel/:id', protect, cancelBooking);
router.put('/complete/:id', protect, completeBooking);
router.put('/check-in/:id', protect, checkIn);
router.put('/check-out/:id', protect, checkOut);

module.exports = router;
