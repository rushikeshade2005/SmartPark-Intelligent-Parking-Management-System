const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Process payment
// @route   POST /api/payments/process
exports.processPayment = async (req, res, next) => {
  try {
    const { bookingId, paymentMethod } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.paymentStatus === 'completed') {
      return res.status(400).json({ success: false, message: 'Payment already completed' });
    }

    // Simulate payment processing
    const payment = await Payment.create({
      userId: req.user._id,
      bookingId,
      amount: booking.totalAmount,
      paymentMethod: paymentMethod || 'card',
      status: 'success',
      paymentDate: new Date(),
    });

    // Update booking payment status
    booking.paymentStatus = 'completed';
    await booking.save();

    // Notify user
    await User.findByIdAndUpdate(req.user._id, {
      $push: {
        notifications: {
          message: `Payment of Γé╣${booking.totalAmount} successful. Transaction: ${payment.transactionId}`,
          type: 'payment',
        },
      },
    });

    // Persistent notification + real-time push
    const payNotif = await Notification.create({
      userId: req.user._id,
      title: 'Payment Successful',
      message: `Payment of Γé╣${booking.totalAmount} processed. Transaction: ${payment.transactionId}`,
      type: 'payment',
      link: '/dashboard/payments',
    });
    const io = req.app.get('io');
    if (io) io.to(`user_${req.user._id}`).emit('newNotification', payNotif);

    res.status(201).json({ success: true, data: payment });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user payment history
// @route   GET /api/payments/history
exports.getPaymentHistory = async (req, res, next) => {
  try {
    const payments = await Payment.find({ userId: req.user._id })
      .populate({
        path: 'bookingId',
        populate: [
          { path: 'parkingLotId', select: 'name address' },
          { path: 'slotId', select: 'slotNumber' },
        ],
      })
      .sort('-createdAt');
    res.json({ success: true, data: payments });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all payments (admin)
// @route   GET /api/payments/all
exports.getAllPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find()
      .populate('userId', 'name email')
      .populate({
        path: 'bookingId',
        populate: { path: 'parkingLotId', select: 'name' },
      })
      .sort('-createdAt');
    res.json({ success: true, data: payments });
  } catch (error) {
    next(error);
  }
};

// @desc    Get receipt data for a payment
// @route   GET /api/payments/receipt/:id
exports.getReceipt = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('userId', 'name email phoneNumber')
      .populate({
        path: 'bookingId',
        populate: [
          { path: 'parkingLotId', select: 'name address city' },
          { path: 'slotId', select: 'slotNumber' },
        ],
      });

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    // Only owner or admin
    if (payment.userId._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const receipt = {
      receiptNo: `REC-${payment.transactionId}`,
      transactionId: payment.transactionId,
      date: payment.paymentDate,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      status: payment.status,
      customer: {
        name: payment.userId.name,
        email: payment.userId.email,
        phone: payment.userId.phoneNumber,
      },
      booking: payment.bookingId
        ? {
            id: payment.bookingId._id,
            vehicleNumber: payment.bookingId.vehicleNumber,
            startTime: payment.bookingId.startTime,
            endTime: payment.bookingId.endTime,
            duration: payment.bookingId.duration,
            parkingLot: payment.bookingId.parkingLotId?.name,
            address: payment.bookingId.parkingLotId?.address,
            city: payment.bookingId.parkingLotId?.city,
            slotNumber: payment.bookingId.slotId?.slotNumber,
          }
        : null,
    };

    res.json({ success: true, data: receipt });
  } catch (error) {
    next(error);
  }
};
