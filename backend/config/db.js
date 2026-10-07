const mongoose = require('mongoose');
const dns = require('dns');

// Use Google DNS to fix SRV lookup failures on restricted networks
dns.setServers(['8.8.8.8', '8.8.4.4']);

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    const dbName = process.env.DB_NAME || 'smartparking';

    if (!mongoUri) {
      throw new Error('MONGODB_URI is missing.');
    }

    const conn = await mongoose.connect(mongoUri, {
      family: 4, // Force IPv4
      dbName,
    });
    console.log(`MongoDB Connected: ${conn.connection.host} (db: ${conn.connection.name})`);
  } catch (error) {
    console.error(`Database connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
