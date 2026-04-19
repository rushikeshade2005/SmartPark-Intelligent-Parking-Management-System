const User = require('../models/User');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const ParkingLot = require('../models/ParkingLot');
const ParkingSlot = require('../models/ParkingSlot');

// @desc    Get all users (admin)
// @route   GET /api/admin/users
exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-notifications').sort('-createdAt');
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user (admin)
// @route   DELETE /api/admin/users/:id
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (user.role === 'admin') {
      return res.status(400).json({ success: false, message: 'Cannot delete admin user' });
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get analytics (admin)
// @route   GET /api/admin/analytics
exports.getAnalytics = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalLots = await ParkingLot.countDocuments();
    const totalSlots = await ParkingSlot.countDocuments({ isActive: true });
    const availableSlots = await ParkingSlot.countDocuments({ status: 'available', isActive: true });
    const occupiedSlots = await ParkingSlot.countDocuments({ status: 'occupied', isActive: true });
    const reservedSlots = await ParkingSlot.countDocuments({ status: 'reserved', isActive: true });

    const totalBookings = await Booking.countDocuments();
    const activeBookings = await Booking.countDocuments({
      bookingStatus: { $in: ['confirmed', 'active'] },
    });
    const completedBookings = await Booking.countDocuments({ bookingStatus: 'completed' });
    const cancelledBookings = await Booking.countDocuments({ bookingStatus: 'cancelled' });

    // Revenue
    const revenueAgg = await Payment.aggregate([
      { $match: { status: 'success' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalRevenue = revenueAgg.length > 0 ? revenueAgg[0].total : 0;

    // Today's revenue
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayRevenueAgg = await Payment.aggregate([
      { $match: { status: 'success', paymentDate: { $gte: todayStart } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const todayRevenue = todayRevenueAgg.length > 0 ? todayRevenueAgg[0].total : 0;

    // Today's bookings
    const todayBookings = await Booking.countDocuments({ createdAt: { $gte: todayStart } });

    // Monthly revenue (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const monthlyRevenueRaw = await Payment.aggregate([
      { $match: { status: 'success', paymentDate: { $gte: twelveMonthsAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$paymentDate' } },
          revenue: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    const monthlyRevenue = monthlyRevenueRaw.map((m) => ({
      month: m._id,
      revenue: m.revenue,
      transactions: m.count,
    }));

    // Daily bookings (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyBookingsRaw = await Booking.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    const dailyBookings = dailyBookingsRaw.map((d) => ({
      date: d._id,
      count: d.count,
    }));

    // Weekly bookings (last 8 weeks)
    const eightWeeksAgo = new Date();
    eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);
    const weeklyBookingsRaw = await Booking.aggregate([
      { $match: { createdAt: { $gte: eightWeeksAgo } } },
      {
        $group: {
          _id: { $isoWeek: '$createdAt' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    const weeklyBookings = weeklyBookingsRaw.map((w) => ({
      week: `Week ${w._id}`,
      count: w.count,
    }));

    // Peak hours
    const peakHoursRaw = await Booking.aggregate([
      {
        $group: {
          _id: { $hour: '$startTime' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    const peakHours = peakHoursRaw.map((p) => ({
      hour: p._id,
      count: p.count,
    }));

    // Booking status distribution
    const bookingStatusDist = [
      { name: 'Confirmed', value: await Booking.countDocuments({ bookingStatus: 'confirmed' }) },
      { name: 'Active', value: await Booking.countDocuments({ bookingStatus: 'active' }) },
      { name: 'Completed', value: completedBookings },
      { name: 'Cancelled', value: cancelledBookings },
    ].filter((s) => s.value > 0);

    // Most used parking lots
    const popularLots = await Booking.aggregate([
      {
        $group: {
          _id: '$parkingLotId',
          bookings: { $sum: 1 },
          revenue: { $sum: '$totalAmount' },
        },
      },
      { $sort: { bookings: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'parkinglots',
          localField: '_id',
          foreignField: '_id',
          as: 'lot',
        },
      },
      { $unwind: '$lot' },
      {
        $project: {
          name: '$lot.name',
          city: '$lot.city',
          bookings: 1,
          revenue: 1,
        },
      },
    ]);

    // Revenue by parking lot
    const revenueByLot = await Payment.aggregate([
      { $match: { status: 'success' } },
      {
        $lookup: {
          from: 'bookings',
          localField: 'bookingId',
          foreignField: '_id',
          as: 'booking',
        },
      },
      { $unwind: { path: '$booking', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$booking.parkingLotId',
          revenue: { $sum: '$amount' },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'parkinglots',
          localField: '_id',
          foreignField: '_id',
          as: 'lot',
        },
      },
      { $unwind: { path: '$lot', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          name: { $ifNull: ['$lot.name', 'Unknown'] },
          revenue: 1,
        },
      },
    ]);

    // User registrations over time (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const userGrowthRaw = await User.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo }, role: 'user' } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    const userGrowth = userGrowthRaw.map((u) => ({
      month: u._id,
      users: u.count,
    }));

    // Average booking duration
    const avgDurationAgg = await Booking.aggregate([
      { $match: { duration: { $gt: 0 } } },
      { $group: { _id: null, avgDuration: { $avg: '$duration' } } },
    ]);
    const avgDuration = avgDurationAgg.length > 0 ? Math.round(avgDurationAgg[0].avgDuration * 10) / 10 : 0;

    // Occupancy rate
    const occupancyRate = totalSlots > 0 ? Math.round(((occupiedSlots + reservedSlots) / totalSlots) * 100) : 0;

    // Cancellation rate
    const cancellationRate = totalBookings > 0 ? Math.round((cancelledBookings / totalBookings) * 100) : 0;

    // Recent bookings
    const recentBookings = await Booking.find()
      .populate('userId', 'name email')
      .populate('parkingLotId', 'name city')
      .populate('slotId', 'slotNumber')
      .sort('-createdAt')
      .limit(15);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalLots,
        totalSlots,
        availableSlots,
        occupiedSlots,
        reservedSlots,
        totalBookings,
        activeBookings,
        completedBookings,
        cancelledBookings,
        totalRevenue,
        todayRevenue,
        todayBookings,
        avgDuration,
        occupancyRate,
        cancellationRate,
        monthlyRevenue,
        dailyBookings,
        weeklyBookings,
        peakHours,
        bookingStatusDist,
        popularLots,
        revenueByLot,
        userGrowth,
        recentBookings,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get active & overdue bookings for monitoring
// @route   GET /api/admin/active-bookings
exports.getActiveBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({
      bookingStatus: { $in: ['confirmed', 'active'] },
    })
      .populate('userId', 'name email phoneNumber')
      .populate('parkingLotId', 'name city pricePerHour')
      .populate('slotId', 'slotNumber')
      .sort('endTime');

    const now = new Date();
    const data = bookings.map((b) => {
      const endTime = new Date(b.endTime);
      const diffMs = endTime - now;
      const isOverdue = diffMs < 0;
      const minutesLeft = Math.round(diffMs / (1000 * 60));

      let urgency = 'normal';
      if (isOverdue) urgency = 'overdue';
      else if (minutesLeft <= 15) urgency = 'critical';
      else if (minutesLeft <= 60) urgency = 'warning';

      return {
        _id: b._id,
        user: b.userId,
        parkingLot: b.parkingLotId,
        slot: b.slotId,
        vehicleNumber: b.vehicleNumber,
        bookingStatus: b.bookingStatus,
        startTime: b.startTime,
        endTime: b.endTime,
        duration: b.duration,
        totalAmount: b.totalAmount,
        minutesLeft,
        isOverdue,
        urgency,
      };
    });

    data.sort((a, b) => {
      const order = { overdue: 0, critical: 1, warning: 2, normal: 3 };
      if (order[a.urgency] !== order[b.urgency]) return order[a.urgency] - order[b.urgency];
      return a.minutesLeft - b.minutesLeft;
    });

    const summary = {
      total: data.length,
      active: data.filter((d) => d.bookingStatus === 'active').length,
      confirmed: data.filter((d) => d.bookingStatus === 'confirmed').length,
      overdue: data.filter((d) => d.isOverdue).length,
      critical: data.filter((d) => d.urgency === 'critical').length,
      warning: data.filter((d) => d.urgency === 'warning').length,
    };

    res.json({ success: true, data, summary });
  } catch (error) {
    next(error);
  }
};
