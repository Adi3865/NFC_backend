const asyncHandler = require('express-async-handler');
const broadcastService = require('../services/broadcastService');
const pollService = require('../services/pollService');

// @desc    Get misc module dashboard data
// @route   GET /api/misc/dashboard
// @access  Private/Admin
const getDashboardData = asyncHandler(async (req, res) => {
  try {
    // Get broadcasts statistics
    const recentBroadcasts = await broadcastService.getAllBroadcasts({
      limit: 5
    });
    
    // Get poll statistics
    const activePolls = await pollService.getAllPolls({ 
      status: 'active',
      limit: 5
    });
    
    // Get overall statistics
    const totalBroadcasts = await broadcastService.getAllBroadcasts({
      countOnly: true
    });
    
    const totalPolls = await pollService.getAllPolls({
      countOnly: true
    });
    
    // Return combined dashboard data
    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalBroadcasts: totalBroadcasts.length,
          totalPolls: totalPolls.length,
          activePolls: activePolls.length
        },
        recentBroadcasts,
        activePolls
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get user's active notifications and polls
// @route   GET /api/misc/user-dashboard
// @access  Private
const getUserDashboardData = asyncHandler(async (req, res) => {
  try {
    // Get active polls for the user
    const activePolls = await pollService.getActivePolls(req.user._id);
    
    // Return user dashboard data
    res.status(200).json({
      success: true,
      data: {
        activePolls
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = {
  getDashboardData,
  getUserDashboardData
};