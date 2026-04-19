const Booking = require('../models/Booking');
const ParkingSlot = require('../models/ParkingSlot');
const ParkingLot = require('../models/ParkingLot');
const Notification = require('../models/Notification');

/**
 * Runs every 60 seconds to:
 * 1. Expire confirmed bookings whose endTime has passed (user never checked in)
 * 2. Notify active bookings that are past their endTime (overstay warning)
 */
const startBookingScheduler = (io) => {
  const INTERVAL_MS = 60 * 1000; // 1 minute

  setInterval(async () => {
    try {
      const now = new Date();

      // ── 1. Expire confirmed bookings that were never checked-in ──
      const expiredBookings = await Booking.find({
        bookingStatus: 'confirmed',
        endTime: { $lt: now },
      });

      for (const booking of expiredBookings) {
        booking.bookingStatus = 'expired';
        await booking.save();

        // Free the slot
        await ParkingSlot.findByIdAndUpdate(booking.slotId, { status: 'available' });

        // Update available slots count
        const availableCount = await ParkingSlot.countDocuments({
          parkingLotId: booking.parkingLotId,
          status: 'available',
          isActive: true,
        });
        await ParkingLot.findByIdAndUpdate(booking.parkingLotId, { availableSlots: availableCount });

        // Notify user
        const notif = await Notification.create({
          userId: booking.userId,
          title: 'Booking Expired',
          message: 'Your booking has expired because you did not check in on time. The slot has been released.',
          type: 'booking',
          link: '/dashboard/bookings',
        });

        if (io) {
          io.emit('slotUpdate', { slotId: booking.slotId, status: 'available', parkingLotId: booking.parkingLotId });
          io.emit('lotUpdate', { lotId: booking.parkingLotId, availableSlots: availableCount });
          io.to(`user_${booking.userId}`).emit('newNotification', notif);
          io.to(`user_${booking.userId}`).emit('bookingExpired', { bookingId: booking._id });
        }
      }

      if (expiredBookings.length > 0) {
        console.log(`[Scheduler] Expired ${expiredBookings.length} booking(s)`);
      }
    } catch (err) {
      console.error('[Scheduler] Error:', err.message);
    }
  }, INTERVAL_MS);

  console.log('🕐 Booking scheduler started (checks every 60s)');
};

module.exports = startBookingScheduler;
