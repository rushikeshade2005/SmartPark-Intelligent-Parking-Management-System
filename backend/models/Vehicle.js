const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    plateNumber: {
      type: String,
      required: [true, 'Plate number is required'],
      trim: true,
      uppercase: true,
    },
    vehicleType: {
      type: String,
      enum: ['car', 'motorcycle', 'truck', 'ev'],
      default: 'car',
    },
    brand: {
      type: String,
      trim: true,
      default: '',
    },
    model: {
      type: String,
      trim: true,
      default: '',
    },
    color: {
      type: String,
      trim: true,
      default: '',
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

vehicleSchema.index({ userId: 1, plateNumber: 1 }, { unique: true });

module.exports = mongoose.model('Vehicle', vehicleSchema);
