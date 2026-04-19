const User = require('../models/User');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const ParkingLot = require('../models/ParkingLot');
const ParkingSlot = require('../models/ParkingSlot');
const ParkingFloor = require('../models/ParkingFloor');

// @desc    Get logged-in admin dashboard details
// @route   GET /api/admin/my-dashboard
exports.getMyDashboard = async (req, res, next) => {
  try {
    const admin = await User.findById(req.user._id).select('name email role phoneNumber createdAt');
    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const managedLots = await ParkingLot.find({ managedBy: admin._id })
      .select('name city totalSlots availableSlots createdAt')
      .sort('-createdAt')
      .limit(8);

    const managedLotIds = managedLots.map((lot) => lot._id);

    const [totalAdmins, managedLotsCount, managedSlots, managedBookings] = await Promise.all([
      User.countDocuments({ role: 'admin' }),
      ParkingLot.countDocuments({ managedBy: admin._id }),
      managedLotIds.length > 0
        ? ParkingSlot.countDocuments({ parkingLotId: { $in: managedLotIds }, isActive: true })
        : Promise.resolve(0),
      managedLotIds.length > 0
        ? Booking.countDocuments({ parkingLotId: { $in: managedLotIds } })
        : Promise.resolve(0),
    ]);

    res.json({
      success: true,
      data: {
        profile: {
          _id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          phoneNumber: admin.phoneNumber,
          joinedAt: admin.createdAt,
        },
        myStats: {
          totalAdmins,
          managedLots: managedLotsCount,
          managedSlots,
          managedBookings,
        },
        managedLots,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get analytics for logged-in admin only
// @route   GET /api/admin/my-analytics
exports.getMyAnalytics = async (req, res, next) => {
  try {
    const managedLots = await ParkingLot.find({ managedBy: req.user._id }).select('_id name city');
    const managedLotIds = managedLots.map((lot) => lot._id);

    if (managedLotIds.length === 0) {
      return res.json({
        success: true,
        data: {
          totalUsers: 0,
          totalLots: 0,
          totalSlots: 0,
          availableSlots: 0,
          occupiedSlots: 0,
          reservedSlots: 0,
          totalBookings: 0,
          activeBookings: 0,
          completedBookings: 0,
          cancelledBookings: 0,
          totalRevenue: 0,
          todayRevenue: 0,
          todayBookings: 0,
          avgDuration: 0,
          occupancyRate: 0,
          cancellationRate: 0,
          popularLots: [],
          recentBookings: [],
        },
      });
    }

    const slotIds = await ParkingSlot.find({ parkingLotId: { $in: managedLotIds } }).distinct('_id');

    const [
      totalLots,
      totalSlots,
      availableSlots,
      occupiedSlots,
      reservedSlots,
      totalBookings,
      activeBookings,
      completedBookings,
      cancelledBookings,
      uniqueUsers,
      recentBookings,
    ] = await Promise.all([
      ParkingLot.countDocuments({ _id: { $in: managedLotIds } }),
      ParkingSlot.countDocuments({ parkingLotId: { $in: managedLotIds }, isActive: true }),
      ParkingSlot.countDocuments({ parkingLotId: { $in: managedLotIds }, status: 'available', isActive: true }),
      ParkingSlot.countDocuments({ parkingLotId: { $in: managedLotIds }, status: 'occupied', isActive: true }),
      ParkingSlot.countDocuments({ parkingLotId: { $in: managedLotIds }, status: 'reserved', isActive: true }),
      Booking.countDocuments({ parkingLotId: { $in: managedLotIds } }),
      Booking.countDocuments({ parkingLotId: { $in: managedLotIds }, bookingStatus: { $in: ['confirmed', 'active'] } }),
      Booking.countDocuments({ parkingLotId: { $in: managedLotIds }, bookingStatus: 'completed' }),
      Booking.countDocuments({ parkingLotId: { $in: managedLotIds }, bookingStatus: 'cancelled' }),
      Booking.distinct('userId', { parkingLotId: { $in: managedLotIds } }),
      Booking.find({ parkingLotId: { $in: managedLotIds } })
        .populate('userId', 'name email')
        .populate('parkingLotId', 'name city')
        .populate('slotId', 'slotNumber')
        .sort('-createdAt')
        .limit(15),
    ]);

    const revenueAgg = slotIds.length > 0
      ? await Payment.aggregate([
          { $match: { status: 'success', slotId: { $in: slotIds } } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ])
      : [];
    const totalRevenue = revenueAgg.length > 0 ? revenueAgg[0].total : 0;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayRevenueAgg = slotIds.length > 0
      ? await Payment.aggregate([
          { $match: { status: 'success', slotId: { $in: slotIds }, paymentDate: { $gte: todayStart } } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ])
      : [];
    const todayRevenue = todayRevenueAgg.length > 0 ? todayRevenueAgg[0].total : 0;

    const todayBookings = await Booking.countDocuments({
      parkingLotId: { $in: managedLotIds },
      createdAt: { $gte: todayStart },
    });

    const popularLotsRaw = await Booking.aggregate([
      { $match: { parkingLotId: { $in: managedLotIds } } },
      {
        $group: {
          _id: '$parkingLotId',
          bookings: { $sum: 1 },
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
        },
      },
    ]);

    const avgDurationAgg = await Booking.aggregate([
      { $match: { parkingLotId: { $in: managedLotIds }, duration: { $gt: 0 } } },
      { $group: { _id: null, avgDuration: { $avg: '$duration' } } },
    ]);
    const avgDuration = avgDurationAgg.length > 0 ? Math.round(avgDurationAgg[0].avgDuration * 10) / 10 : 0;

    const occupancyRate = totalSlots > 0 ? Math.round(((occupiedSlots + reservedSlots) / totalSlots) * 100) : 0;
    const cancellationRate = totalBookings > 0 ? Math.round((cancelledBookings / totalBookings) * 100) : 0;

    res.json({
      success: true,
      data: {
        totalUsers: uniqueUsers.length,
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
        popularLots: popularLotsRaw,
        recentBookings,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get parking lots managed by logged-in admin
// @route   GET /api/admin/parking-lots
exports.getMyParkingLots = async (req, res, next) => {
  try {
    const lots = await ParkingLot.find({ managedBy: req.user._id }).sort('-createdAt');
    res.json({ success: true, count: lots.length, data: lots });
  } catch (error) {
    next(error);
  }
};

// @desc    Get parking lot details managed by logged-in admin
// @route   GET /api/admin/parking-lots/:id
exports.getMyParkingLotById = async (req, res, next) => {
  try {
    const lot = await ParkingLot.findOne({ _id: req.params.id, managedBy: req.user._id });
    if (!lot) {
      return res.status(404).json({ success: false, message: 'Parking lot not found for this admin' });
    }

    const floors = await ParkingFloor.find({ parkingLotId: lot._id }).sort('floorNumber');
    const slots = await ParkingSlot.find({ parkingLotId: lot._id, isActive: true });
    const availableSlots = slots.filter((s) => s.status === 'available').length;
    const occupiedSlots = slots.filter((s) => s.status !== 'available').length;

    res.json({
      success: true,
      data: {
        ...lot.toObject(),
        availableSlots,
        occupiedSlots,
        floors,
        slots,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get slots for admin's parking lot
// @route   GET /api/admin/parking-lots/:lotId/slots
exports.getMyParkingSlots = async (req, res, next) => {
  try {
    const lot = await ParkingLot.findOne({ _id: req.params.lotId, managedBy: req.user._id }).select('_id');
    if (!lot) {
      return res.status(404).json({ success: false, message: 'Parking lot not found for this admin' });
    }

    const slots = await ParkingSlot.find({
      parkingLotId: req.params.lotId,
      isActive: true,
    }).populate('floorId');

    res.json({ success: true, data: slots });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all regular users (not admins) (admin)
// @route   GET /api/admin/users
exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find({ role: 'user' }).select('-notifications').sort('-createdAt');
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all admins (admin)
// @route   GET /api/admin/admins
exports.getAdmins = async (req, res, next) => {
  try {
    const admins = await User.find({ role: 'admin' }).select('-notifications').sort('-createdAt');
    res.json({ success: true, data: admins });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user (admin)
// @route   DELETE /api/admin/users/:id
exports.deleteUser = async (req, res, next) => {
  try {
    const requestingAdmin = await User.findById(req.user._id).select('isMasterAdmin email role');
    const canDeleteUsers =
      !!requestingAdmin && requestingAdmin.role === 'admin' &&
      (requestingAdmin.isMasterAdmin === true || requestingAdmin.email === 'admin@smartpark.com');

    if (!canDeleteUsers) {
      return res.status(403).json({
        success: false,
        message: 'Only the master admin can delete users',
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (String(user._id) === String(req.user._id)) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
    }
    if (user.role === 'admin') {
      const isTargetMasterAdmin = user.isMasterAdmin === true || user.email === 'admin@smartpark.com';
      if (isTargetMasterAdmin) {
        return res.status(400).json({ success: false, message: 'Master admin account cannot be deleted' });
      }
      await User.findByIdAndDelete(req.params.id);
      return res.json({ success: true, message: 'Admin deleted' });
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
