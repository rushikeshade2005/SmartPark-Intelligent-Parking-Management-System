const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    label: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      enum: ['general', 'booking'],
      default: 'general',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Settings', settingsSchema);
