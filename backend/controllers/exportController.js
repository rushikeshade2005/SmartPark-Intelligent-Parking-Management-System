const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const PDFDocument = require('pdfkit');
const { Parser } = require('json2csv');

// Helper: format booking data for export
const formatBookingData = (bookings) => {
  return bookings.map((b) => ({
    'Booking ID': b._id.toString().slice(-8).toUpperCase(),
    'Parking Location': b.parkingLotId?.name || 'N/A',
    'Address': b.parkingLotId?.address || 'N/A',
    'Slot': b.slotId?.slotNumber || 'N/A',
    'Vehicle': b.vehicleNumber,
    'Date': new Date(b.startTime).toLocaleDateString('en-IN'),
    'Start Time': new Date(b.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    'End Time': new Date(b.endTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    'Duration (hrs)': b.duration,
    'Amount (Γé╣)': b.totalAmount,
    'Booking Status': b.bookingStatus,
    'Payment Status': b.paymentStatus,
  }));
};

// @desc    Export bookings as CSV
// @route   GET /api/export/bookings/csv
exports.exportBookingsCSV = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ userId: req.user._id })
      .populate('parkingLotId', 'name address')
      .populate('slotId', 'slotNumber')
      .sort('-createdAt');

    const data = formatBookingData(bookings);

    if (data.length === 0) {
      return res.status(404).json({ success: false, message: 'No bookings found to export' });
    }

    const parser = new Parser();
    const csv = parser.parse(data);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=smartpark-bookings-${Date.now()}.csv`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
};

// @desc    Export bookings as PDF
// @route   GET /api/export/bookings/pdf
exports.exportBookingsPDF = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ userId: req.user._id })
      .populate('parkingLotId', 'name address')
      .populate('slotId', 'slotNumber')
      .sort('-createdAt');

    if (bookings.length === 0) {
      return res.status(404).json({ success: false, message: 'No bookings found to export' });
    }

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=smartpark-bookings-${Date.now()}.pdf`);
    doc.pipe(res);

    // Header
    doc
      .fontSize(22)
      .fillColor('#4f46e5')
      .text('SmartPark', { align: 'center' })
      .moveDown(0.3);
    doc
      .fontSize(14)
      .fillColor('#475569')
      .text('Booking History Report', { align: 'center' })
      .moveDown(0.3);
    doc
      .fontSize(10)
      .fillColor('#94a3b8')
      .text(`Generated on ${new Date().toLocaleDateString('en-IN')} at ${new Date().toLocaleTimeString('en-IN')}`, { align: 'center' })
      .moveDown(0.3);
    doc
      .fontSize(10)
      .fillColor('#94a3b8')
      .text(`User: ${req.user.name} (${req.user.email})`, { align: 'center' })
      .moveDown(1);

    // Divider
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke('#e2e8f0').moveDown(0.5);

    // Summary
    const total = bookings.length;
    const completed = bookings.filter((b) => b.bookingStatus === 'completed').length;
    const totalSpent = bookings
      .filter((b) => b.paymentStatus === 'completed')
      .reduce((sum, b) => sum + b.totalAmount, 0);

    doc
      .fontSize(11)
      .fillColor('#1e293b')
      .text(`Total Bookings: ${total}    |    Completed: ${completed}    |    Total Spent: Γé╣${totalSpent.toLocaleString('en-IN')}`)
      .moveDown(1);

    // Bookings table
    bookings.forEach((b, i) => {
      if (doc.y > 700) {
        doc.addPage();
      }

      const bgColor = i % 2 === 0 ? '#f8fafc' : '#ffffff';
      doc
        .rect(40, doc.y - 2, 515, 70)
        .fill(bgColor)
        .fillColor('#1e293b');

      const y = doc.y;
      doc.fontSize(11).font('Helvetica-Bold')
        .text(`#${b._id.toString().slice(-8).toUpperCase()}`, 50, y)
        .font('Helvetica');

      doc.fontSize(9).fillColor('#64748b')
        .text(`${b.parkingLotId?.name || 'N/A'} - Slot ${b.slotId?.slotNumber || 'N/A'}`, 50, y + 16)
        .text(`Vehicle: ${b.vehicleNumber}`, 50, y + 28)
        .text(`${new Date(b.startTime).toLocaleDateString('en-IN')} ${new Date(b.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} ΓåÆ ${new Date(b.endTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`, 50, y + 40)
        .text(`Duration: ${b.duration} hr(s)`, 50, y + 52);

      // Status & amount on right
      const statusColor = b.bookingStatus === 'completed' ? '#22c55e' : b.bookingStatus === 'cancelled' ? '#ef4444' : '#f59e0b';
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#4f46e5')
        .text(`Γé╣${b.totalAmount}`, 450, y, { align: 'right', width: 95 })
        .font('Helvetica');

      doc.fontSize(8).fillColor(statusColor)
        .text(b.bookingStatus.toUpperCase(), 450, y + 18, { align: 'right', width: 95 })
        .text(b.paymentStatus.toUpperCase(), 450, y + 30, { align: 'right', width: 95 });

      doc.y = y + 72;
    });

    // Footer
    doc.moveDown(2);
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke('#e2e8f0').moveDown(0.5);
    doc.fontSize(8).fillColor('#94a3b8')
      .text('This is a computer-generated report from SmartPark.', { align: 'center' });

    doc.end();
  } catch (error) {
    next(error);
  }
};

// @desc    Export payment history as CSV
// @route   GET /api/export/payments/csv
exports.exportPaymentsCSV = async (req, res, next) => {
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

    if (payments.length === 0) {
      return res.status(404).json({ success: false, message: 'No payments found' });
    }

    const data = payments.map((p) => ({
      'Transaction ID': p.transactionId,
      'Parking Location': p.bookingId?.parkingLotId?.name || 'N/A',
      'Slot': p.bookingId?.slotId?.slotNumber || 'N/A',
      'Amount (Γé╣)': p.amount,
      'Payment Method': p.paymentMethod,
      'Status': p.status,
      'Date': new Date(p.paymentDate).toLocaleDateString('en-IN'),
      'Time': new Date(p.paymentDate).toLocaleTimeString('en-IN'),
    }));

    const parser = new Parser();
    const csv = parser.parse(data);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=smartpark-payments-${Date.now()}.csv`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
};
