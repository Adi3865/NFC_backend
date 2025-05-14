const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { generateUserId } = require('../utils/generateId');

/**
 * Generate JWT Token
 * @param {object} user - User object
 * @returns {string} - JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

/**
 * Register a new user
 * @param {object} userData - User data
 * @returns {object} - User object and token
 */
const registerUser = async (userData) => {
  const { name, email, phone, password } = userData;
  
  // Check if user exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    throw new Error('User already exists');
  }
  
  // Create user
  const user = await User.create({
    userId: generateUserId(),
    name,
    email,
    phone,
    password,
    role: 'resident', // Default role for self-registration
    status: 'pending'  // Pending admin approval
  });
  
  return {
    _id: user._id,
    userId: user.userId,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.status,
    token: generateToken(user)
  };
};

/**
 * Login user
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {object} - User object and token
 */
const loginUser = async (email, password) => {
  const user = await User.findOne({ email });
  
  if (!user) {
    throw new Error('Invalid credentials');
  }
  
  const isMatch = await user.matchPassword(password);
  
  if (!isMatch) {
    throw new Error('Invalid credentials');
  }
  
  return {
    _id: user._id,
    userId: user.userId,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.status,
    token: generateToken(user)
  };
};

module.exports = {
  registerUser,
  loginUser,
  generateToken
};