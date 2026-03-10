const ParkingLot = require('../models/ParkingLot');
const ParkingFloor = require('../models/ParkingFloor');
const ParkingSlot = require('../models/ParkingSlot');
const Review = require('../models/Review');
const fs = require('fs');
const path = require('path');

// @desc    Get all parking lots
// @route   GET /api/parking-lots
exports.getParkingLots = async (req, res, next) => {
  try {
    const { city, search } = req.query;
    let query = { isActive: true };
    if (city) query.city = new RegExp(city, 'i');
    if (search) query.name = new RegExp(search, 'i');

    const parkingLots = await ParkingLot.find(query).sort('-createdAt');

    // Recalculate available slots for each lot
    for (let lot of parkingLots) {
      const availableCount = await ParkingSlot.countDocuments({
        parkingLotId: lot._id,
        status: 'available',
        isActive: true,
      });
      lot.availableSlots = availableCount;
    }

    res.json({ success: true, count: parkingLots.length, data: parkingLots });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single parking lot (full detail with reviews)
// @route   GET /api/parking-lots/:id
exports.getParkingLot = async (req, res, next) => {
  try {
    const lot = await ParkingLot.findById(req.params.id);
    if (!lot) {
      return res.status(404).json({ success: false, message: 'Parking lot not found' });
    }

    const floors = await ParkingFloor.find({ parkingLotId: lot._id }).sort('floorNumber');
    const slots = await ParkingSlot.find({ parkingLotId: lot._id, isActive: true });
    const availableSlots = slots.filter((s) => s.status === 'available').length;
    const occupiedSlots = slots.filter((s) => s.status !== 'available').length;

    // Reviews & ratings
    const reviews = await Review.find({ parkingLotId: lot._id })
      .populate('userId', 'name avatar')
      .sort('-createdAt')
      .limit(50);
    const totalReviews = reviews.length;
    const avgRating = totalReviews > 0
      ? Number((reviews.reduce((s, r) => s + r.rating, 0) / totalReviews).toFixed(1))
      : 0;
    const ratingDistribution = [1, 2, 3, 4, 5].map((star) => ({
      star,
      count: reviews.filter((r) => r.rating === star).length,
    }));

    res.json({
      success: true,
      data: {
        ...lot.toObject(),
        availableSlots,
        occupiedSlots,
        floors,
        slots,
        reviews,
        reviewStats: { totalReviews, avgRating, ratingDistribution },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create parking lot (admin)
// @route   POST /api/parking-lots
exports.createParkingLot = async (req, res, next) => {
  try {
    const {
      name, description, address, area, city, locationCoordinates, totalFloors,
      totalSlots, pricePerHour, parkingType, operatingHours, amenities, image,
      securityAvailable, cctvAvailable, evChargingAvailable,
      ownerName, ownerPhone, ownerEmail,
      contactPhone, contactEmail, managerContact,
    } = req.body;

    const lot = await ParkingLot.create({
      name, description, address, area, city, locationCoordinates, totalFloors,
      totalSlots, availableSlots: totalSlots, pricePerHour, parkingType,
      operatingHours, amenities, image,
      securityAvailable, cctvAvailable, evChargingAvailable,
      ownerName, ownerPhone, ownerEmail,
      contactPhone, contactEmail, managerContact,
    });

    // Auto-create floors and slots
    const slotsPerFloor = Math.ceil(totalSlots / totalFloors);
    let slotCount = 0;

    for (let f = 1; f <= totalFloors; f++) {
      const floorSlots = Math.min(slotsPerFloor, totalSlots - slotCount);
      const floor = await ParkingFloor.create({
        floorNumber: f,
        parkingLotId: lot._id,
        totalSlots: floorSlots,
        label: `Floor ${f}`,
      });

      const slotDocs = [];
      for (let s = 1; s <= floorSlots; s++) {
        slotCount++;
        slotDocs.push({
          slotNumber: `F${f}-S${s}`,
          floorId: floor._id,
          parkingLotId: lot._id,
          status: 'available',
          distanceFromEntrance: s,
        });
      }
      await ParkingSlot.insertMany(slotDocs);
    }

    res.status(201).json({ success: true, data: lot });
  } catch (error) {
    next(error);
  }
};

// @desc    Update parking lot (admin)
// @route   PUT /api/parking-lots/:id
exports.updateParkingLot = async (req, res, next) => {
  try {
    const lot = await ParkingLot.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!lot) {
      return res.status(404).json({ success: false, message: 'Parking lot not found' });
    }
    res.json({ success: true, data: lot });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete parking lot (admin)
// @route   DELETE /api/parking-lots/:id
exports.deleteParkingLot = async (req, res, next) => {
  try {
    const lot = await ParkingLot.findById(req.params.id);
    if (!lot) {
      return res.status(404).json({ success: false, message: 'Parking lot not found' });
    }
    await ParkingSlot.deleteMany({ parkingLotId: lot._id });
    await ParkingFloor.deleteMany({ parkingLotId: lot._id });
    await ParkingLot.findByIdAndDelete(lot._id);
    res.json({ success: true, message: 'Parking lot deleted' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get parking slots for a lot
// @route   GET /api/parking-slots/:lotId
exports.getParkingSlots = async (req, res, next) => {
  try {
    const slots = await ParkingSlot.find({
      parkingLotId: req.params.lotId,
      isActive: true,
    }).populate('floorId');
    res.json({ success: true, data: slots });
  } catch (error) {
    next(error);
  }
};

// @desc    Get smart slot recommendation
// @route   GET /api/parking-slots/:lotId/recommend
exports.recommendSlot = async (req, res, next) => {
  try {
    const { duration } = req.query;
    const slots = await ParkingSlot.find({
      parkingLotId: req.params.lotId,
      status: 'available',
      isActive: true,
    })
      .sort('distanceFromEntrance')
      .limit(5);

    if (slots.length === 0) {
      return res.status(404).json({ success: false, message: 'No available slots' });
    }

    res.json({
      success: true,
      data: slots,
      recommendation: slots[0],
      reason: 'Closest to entrance with availability',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update slot status (admin)
// @route   PUT /api/parking-slots/:id/status
exports.updateSlotStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const slot = await ParkingSlot.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!slot) {
      return res.status(404).json({ success: false, message: 'Slot not found' });
    }

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('slotUpdate', { slotId: slot._id, status: slot.status, parkingLotId: slot.parkingLotId });
    }

    res.json({ success: true, data: slot });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload images for a parking lot
// @route   POST /api/parking-lots/:id/images
exports.uploadParkingImages = async (req, res, next) => {
  try {
    const lot = await ParkingLot.findById(req.params.id);
    if (!lot) {
      return res.status(404).json({ success: false, message: 'Parking lot not found' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No images uploaded' });
    }

    const imagePaths = req.files.map((file) => `/uploads/parking/${file.filename}`);
    lot.images = [...lot.images, ...imagePaths];

    // Set the first image as the cover image if not already set
    if (!lot.image && imagePaths.length > 0) {
      lot.image = imagePaths[0];
    }

    await lot.save();
    res.json({ success: true, message: 'Images uploaded successfully', data: lot });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an image from a parking lot
// @route   DELETE /api/parking-lots/:id/images
exports.deleteParkingImage = async (req, res, next) => {
  try {
    const { imageUrl } = req.body;
    const lot = await ParkingLot.findById(req.params.id);
    if (!lot) {
      return res.status(404).json({ success: false, message: 'Parking lot not found' });
    }

    lot.images = lot.images.filter((img) => img !== imageUrl);
    if (lot.image === imageUrl) {
      lot.image = lot.images.length > 0 ? lot.images[0] : '';
    }
    await lot.save();

    // Try to delete from filesystem
    try {
      const fullPath = path.join(__dirname, '..', imageUrl);
      if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    } catch (e) {
      console.error('File delete error:', e.message);
    }

    res.json({ success: true, message: 'Image deleted', data: lot });
  } catch (error) {
    next(error);
  }
};
