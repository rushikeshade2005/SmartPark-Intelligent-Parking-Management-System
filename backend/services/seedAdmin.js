const User = require('../models/User');

const seedAdmin = async () => {
  try {
    const adminExists = await User.findOne({ email: 'admin@smartpark.com' });
    if (!adminExists) {
      await User.create({
        name: 'Admin',
        email: 'admin@smartpark.com',
        password: 'admin123',
        role: 'admin',
        phoneNumber: '9999999999',
      });
      console.log('Admin user seeded: admin@smartpark.com / admin123');
    }
  } catch (error) {
    console.error('Error seeding admin:', error.message);
  }
};

module.exports = seedAdmin;
