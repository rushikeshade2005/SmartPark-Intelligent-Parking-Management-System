const express = require('express');
const router = express.Router();
const {
  exportBookingsCSV,
  exportBookingsPDF,
  exportPaymentsCSV,
} = require('../controllers/exportController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/bookings/csv', exportBookingsCSV);
router.get('/bookings/pdf', exportBookingsPDF);
router.get('/payments/csv', exportPaymentsCSV);

module.exports = router;
