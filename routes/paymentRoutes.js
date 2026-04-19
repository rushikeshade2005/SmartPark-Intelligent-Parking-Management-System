const express = require('express');
const router = express.Router();
const { processPayment, getPaymentHistory, getAllPayments, getReceipt } = require('../controllers/paymentController');
const { protect, adminOnly } = require('../middleware/auth');

router.post('/process', protect, processPayment);
router.get('/history', protect, getPaymentHistory);
router.get('/receipt/:id', protect, getReceipt);
router.get('/all', protect, adminOnly, getAllPayments);

module.exports = router;
