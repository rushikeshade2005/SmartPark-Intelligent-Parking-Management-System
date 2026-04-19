const mongoose = require('mongoose');

const contactInfoSchema = new mongoose.Schema(
  {
    address: { type: String, default: 'Smart City Tower, Sector 42, Gurgaon' },
    phone: { type: String, default: '+91 98765 43210' },
    email: { type: String, default: 'support@smartpark.com' },
    supportEmail: { type: String, default: 'help@smartpark.com' },
    mapLink: { type: String, default: 'https://maps.google.com' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ContactInfo', contactInfoSchema);
