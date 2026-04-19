const mongoose = require('mongoose');

const footerContentSchema = new mongoose.Schema(
  {
    companyDescription: {
      type: String,
      default: 'Intelligent parking solutions for smart cities. Find, book, and manage parking effortlessly.',
    },
    quickLinks: {
      type: [String],
      default: ['Home', 'Find Parking', 'About Us', 'Contact'],
    },
    services: {
      type: [String],
      default: ['Online Booking', 'Real-Time Tracking', 'Smart Recommendations', 'Digital Payments'],
    },
    socialLinks: {
      facebook: { type: String, default: '' },
      instagram: { type: String, default: '' },
      twitter: { type: String, default: '' },
      linkedin: { type: String, default: '' },
    },
    contactInfo: {
      address: { type: String, default: 'Smart City Tower, Sector 42' },
      phone: { type: String, default: '+91 98765 43210' },
      email: { type: String, default: 'support@smartpark.com' },
    },
    copyright: {
      type: String,
      default: '┬⌐ {year} SmartPark. All rights reserved.',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('FooterContent', footerContentSchema);
