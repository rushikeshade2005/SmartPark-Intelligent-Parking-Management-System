const Review = require('../models/Review');
const Booking = require('../models/Booking');
const Notification = require('../models/Notification');

// @desc    Create review (after completed booking)
// @route   POST /api/reviews
exports.createReview = async (req, res, next) => {
  try {
    const { bookingId, rating, comment } = req.body;

    if (!bookingId || !rating) {
      return res.status(400).json({ success: false, message: 'Booking ID and rating are required' });
    }

    const booking = await Booking.findById(bookingId).populate('parkingLotId', 'name');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (booking.bookingStatus !== 'completed') {
      return res.status(400).json({ success: false, message: 'Can only review completed bookings' });
    }

    const existing = await Review.findOne({ bookingId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Review already submitted for this booking' });
    }

    const review = await Review.create({
      userId: req.user._id,
      parkingLotId: booking.parkingLotId._id,
      bookingId,
      rating,
      comment: comment || '',
    });

    res.status(201).json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
};

// @desc    Get reviews for a parking lot
// @route   GET /api/reviews/lot/:lotId
exports.getLotReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ parkingLotId: req.params.lotId })
      .populate('userId', 'name avatar')
      .sort('-createdAt');

    // Calculate stats
    const total = reviews.length;
    const avgRating = total > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / total).toFixed(1) : 0;
    const distribution = [1, 2, 3, 4, 5].map((star) => ({
      star,
      count: reviews.filter((r) => r.rating === star).length,
    }));

    res.json({ success: true, data: { reviews, stats: { total, avgRating: Number(avgRating), distribution } } });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all reviews (admin)
// @route   GET /api/reviews
exports.getAllReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find()
      .populate('userId', 'name email')
      .populate('parkingLotId', 'name')
      .sort('-createdAt');
    res.json({ success: true, data: reviews });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete review (admin)
// @route   DELETE /api/reviews/:id
exports.deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }
    res.json({ success: true, message: 'Review deleted' });
  } catch (error) {
    next(error);
  }
};
