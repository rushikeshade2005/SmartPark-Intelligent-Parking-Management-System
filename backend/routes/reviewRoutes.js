const express = require('express');
const router = express.Router();
const {
  createReview, getLotReviews, getAllReviews, deleteReview,
} = require('../controllers/reviewController');
const { protect, adminOnly } = require('../middleware/auth');

router.post('/', protect, createReview);
router.get('/lot/:lotId', getLotReviews);
router.get('/all', protect, adminOnly, getAllReviews);
router.delete('/:id', protect, adminOnly, deleteReview);

module.exports = router;
