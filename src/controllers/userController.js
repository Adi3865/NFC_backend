const asyncHandler = require('express-async-handler');
const userService = require('../services/userService');

// @desc    Create a new admin/staff user
// @route   POST /api/admin/users
// @access  Private/SuperAdmin
const createAdminUser = asyncHandler(async (req, res) => {
  try {
    const userData = await userService.createAdminUser(req.body, req.user._id);
    res.status(201).json({
      success: true,
      data: userData,
      message: 'User created successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = asyncHandler(async (req, res) => {
  const { role, status } = req.query;
  const filters = {};
  
  if (role) filters.role = role;
  if (status) filters.status = status;
  
  const users = await userService.getAllUsers(filters);
  
  res.status(200).json({
    success: true,
    count: users.length,
    data: users
  });
});

// @desc    Get pending user registrations
// @route   GET /api/admin/users/pending
// @access  Private/Admin
const getPendingUsers = asyncHandler(async (req, res) => {
  const users = await userService.getUsersByStatus('pending');
  
  res.status(200).json({
    success: true,
    count: users.length,
    data: users
  });
});

// @desc    Approve user registration
// @route   PUT /api/admin/users/:userId/approve
// @access  Private/Admin
const approveUser = asyncHandler(async (req, res) => {
  try {
    const user = await userService.updateUserStatus(req.params.userId, 'approved', req.user._id);
    
    res.status(200).json({
      success: true,
      data: user,
      message: 'User approved successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Reject user registration
// @route   PUT /api/admin/users/:userId/reject
// @access  Private/Admin
const rejectUser = asyncHandler(async (req, res) => {
  try {
    const user = await userService.updateUserStatus(req.params.userId, 'rejected', req.user._id);
    
    res.status(200).json({
      success: true,
      data: user,
      message: 'User rejected'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = {
  createAdminUser,
  getAllUsers,
  getPendingUsers,
  approveUser,
  rejectUser
};