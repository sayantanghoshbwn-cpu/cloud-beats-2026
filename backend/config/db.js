const mongoose = require('mongoose');
const dns = require('dns');

// Fix for Windows / ISP DNS SRV resolution error (querySrv ECONNREFUSED) with mongodb+srv://
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (dnsErr) {
  console.warn('[DNS] Warning setting DNS servers:', dnsErr.message);
}

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cloudbeats';
  try {
    const conn = await mongoose.connect(uri, {
      dbName: 'cloudbeats',
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host} (DB: ${conn.connection.name})`);

    // Auto-seed default admin and test user if none exist
    autoSeedUsers();
  } catch (error) {
    console.error(`[MongoDB] Connection error: ${error.message}`);
    console.warn(`[MongoDB] Warning: Please ensure MongoDB is running or check your MONGODB_URI in backend/.env`);
  }
};

/**
 * Auto-seed initial admin and demo user on first connection if not present
 */
const autoSeedUsers = async () => {
  try {
    const User = require('../models/User');
    const adminExists = await User.findOne({ email: 'admin@cloudbeats.io' });
    if (!adminExists) {
      await User.create({
        name: 'CloudBeats Admin',
        email: 'admin@cloudbeats.io',
        password: 'adminpassword123',
        role: 'admin',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      });
      console.log('[MongoDB] Auto-seeded Admin: admin@cloudbeats.io / adminpassword123');
    }

    const userExists = await User.findOne({ email: 'user@cloudbeats.io' });
    if (!userExists) {
      await User.create({
        name: 'Demo Listener',
        email: 'user@cloudbeats.io',
        password: 'userpassword123',
        role: 'user',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      });
      console.log('[MongoDB] Auto-seeded User: user@cloudbeats.io / userpassword123');
    }
  } catch (err) {
    console.warn('[MongoDB] Auto-seed notice:', err.message);
  }
};

module.exports = connectDB;
