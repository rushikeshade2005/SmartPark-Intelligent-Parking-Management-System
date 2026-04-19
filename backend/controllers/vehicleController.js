const Vehicle = require('../models/Vehicle');

// @desc    Add a vehicle
// @route   POST /api/vehicles
exports.addVehicle = async (req, res, next) => {
  try {
    const { plateNumber, vehicleType, brand, model, color, isDefault } = req.body;

    if (!plateNumber) {
      return res.status(400).json({ success: false, message: 'Plate number is required' });
    }

    // If setting as default, unset others
    if (isDefault) {
      await Vehicle.updateMany({ userId: req.user._id }, { isDefault: false });
    }

    const count = await Vehicle.countDocuments({ userId: req.user._id });

    const vehicle = await Vehicle.create({
      userId: req.user._id,
      plateNumber,
      vehicleType: vehicleType || 'car',
      brand: brand || '',
      model: model || '',
      color: color || '',
      isDefault: isDefault || count === 0, // First vehicle is default
    });

    res.status(201).json({ success: true, data: vehicle });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Vehicle already registered' });
    }
    next(error);
  }
};

// @desc    Get user vehicles
// @route   GET /api/vehicles
exports.getVehicles = async (req, res, next) => {
  try {
    const vehicles = await Vehicle.find({ userId: req.user._id }).sort('-isDefault -createdAt');
    res.json({ success: true, data: vehicles });
  } catch (error) {
    next(error);
  }
};

// @desc    Update vehicle
// @route   PUT /api/vehicles/:id
exports.updateVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findOne({ _id: req.params.id, userId: req.user._id });
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    const { plateNumber, vehicleType, brand, model, color, isDefault } = req.body;

    if (isDefault) {
      await Vehicle.updateMany({ userId: req.user._id, _id: { $ne: vehicle._id } }, { isDefault: false });
    }

    Object.assign(vehicle, {
      plateNumber: plateNumber || vehicle.plateNumber,
      vehicleType: vehicleType || vehicle.vehicleType,
      brand: brand !== undefined ? brand : vehicle.brand,
      model: model !== undefined ? model : vehicle.model,
      color: color !== undefined ? color : vehicle.color,
      isDefault: isDefault !== undefined ? isDefault : vehicle.isDefault,
    });

    await vehicle.save();
    res.json({ success: true, data: vehicle });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete vehicle
// @route   DELETE /api/vehicles/:id
exports.deleteVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    // If deleted was default, set another as default
    if (vehicle.isDefault) {
      const next = await Vehicle.findOne({ userId: req.user._id });
      if (next) {
        next.isDefault = true;
        await next.save();
      }
    }

    res.json({ success: true, message: 'Vehicle removed' });
  } catch (error) {
    next(error);
  }
};
