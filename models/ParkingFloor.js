const mongoose = require('mongoose');

const parkingFloorSchema = new mongoose.Schema(
  {
    floorNumber: {
      type: Number,
      required: true,
    },
    parkingLotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ParkingLot',
      required: true,
    },
    totalSlots: {
      type: Number,
      required: true,
      min: 1,
    },
    label: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

parkingFloorSchema.index({ parkingLotId: 1, floorNumber: 1 }, { unique: true });

module.exports = mongoose.model('ParkingFloor', parkingFloorSchema);
