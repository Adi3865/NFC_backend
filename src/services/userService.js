const User = require('../models/User');
const { generateUserId } = require('../utils/generateId');

/**
 * Create a new admin or staff user
 * @param {object} userData - User data with role
 * @param {string} createdBy - User ID of admin creating the user
 * @returns {object} - Created user object
 */
const createAdminUser = async (userData, createdBy) => {
  const { name, email, phone, password, role, department } = userData;
  
  // Check if user exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    throw new Error('User already exists');
  }
  
  // Create user with role and auto-approved status
  const user = await User.create({
    userId: generateUserId(),
    name,
    email,
    phone,
    password,
    role,
    department,
    status: 'approved',
    approvedBy: createdBy
  });
  
  return {
    _id: user._id,
    userId: user.userId,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    department: user.department,
    status: user.status
  };
};

/**
 * Get all users with filters
 * @param {object} filters - Filter conditions
 * @returns {Array} - List of users
 */
const getAllUsers = async (filters = {}) => {
  return await User.find(filters)
    .select('-password')
    .sort({ createdAt: -1 });
};

/**
 * Get users by status
 * @param {string} status - User status
 * @returns {Array} - List of users
 */
const getUsersByStatus = async (status) => {
  return await User.find({ status })
    .select('-password')
    .sort({ createdAt: -1 });
};

/**
 * Approve or reject user registration
 * @param {string} userId - User ID
 * @param {string} status - New status ('approved' or 'rejected')
 * @param {string} adminId - Admin user ID
 * @returns {object} - Updated user
 */
const updateUserStatus = async (userId, status, adminId) => {
  const user = await User.findById(userId);
  
  if (!user) {
    throw new Error('User not found');
  }
  
  user.status = status;
  user.approvedBy = adminId;
  
  await user.save();
  
  return {
    _id: user._id,
    userId: user.userId,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status
  };
};

module.exports = {
  createAdminUser,
  getAllUsers,
  getUsersByStatus,
  updateUserStatus
};