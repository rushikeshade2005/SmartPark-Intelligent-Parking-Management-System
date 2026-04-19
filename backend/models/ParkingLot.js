const mongoose = require('mongoose');

const parkingLotSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Parking lot name is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
    },
    area: {
      type: String,
      default: '',
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
    },
    locationCoordinates: {
      lat: { type: Number, default: 0 },
      lng: { type: Number, default: 0 },
    },
    totalFloors: {
      type: Number,
      required: true,
      min: 1,
    },
    totalSlots: {
      type: Number,
      required: true,
      min: 1,
    },
    availableSlots: {
      type: Number,
      default: 0,
    },
    pricePerHour: {
      type: Number,
      required: true,
      min: 0,
    },
    parkingType: {
      type: String,
      enum: ['car', 'bike', 'both'],
      default: 'both',
    },
    image: {
      type: String,
      default: '',
    },
    images: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    operatingHours: {
      open: { type: String, default: '06:00' },
      close: { type: String, default: '22:00' },
    },
    amenities: [String],

    // Detailed facility booleans
    securityAvailable: { type: Boolean, default: false },
    cctvAvailable: { type: Boolean, default: false },
    evChargingAvailable: { type: Boolean, default: false },

    // Owner / contact info
    ownerName: { type: String, default: '' },
    ownerPhone: { type: String, default: '' },
    ownerEmail: { type: String, default: '' },
    contactPhone: { type: String, default: '' },
    contactEmail: { type: String, default: '' },
    managerContact: { type: String, default: '' },

    // Admin who created/manages this parking lot
    managedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ParkingLot', parkingLotSchema);
