const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const { generateUserId } = require('./generateId');
const connectDB = require('../config/database');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

// Seed initial super admin
const seedSuperAdmin = async () => {
  try {
    // Clear existing super admin if any
    await User.deleteMany({ role: 'superAdmin' });
    
    // Create super admin
    const superAdmin = await User.create({
      userId: generateUserId(),
      name: 'Super Admin',
      email: 'admin@nfckota.com',
      phone: '9999999999',
      password: 'Password@123',  // This should be changed after first login
      role: 'superAdmin',
      status: 'approved'
    });
    
    console.log('Super admin seeded successfully:');
    console.log(`Email: ${superAdmin.email}`);
    console.log('Password: Password@123 (Please change after first login)');
    
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Execute seeder function
seedSuperAdmin();