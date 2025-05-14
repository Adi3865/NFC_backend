const asyncHandler = require('express-async-handler');
const broadcastService = require('../services/broadcastService');

// @desc    Create a new broadcast
// @route   POST /api/misc/broadcasts
// @access  Private/Admin
const createBroadcast = asyncHandler(async (req, res) => {
  try {
    const broadcast = await broadcastService.createBroadcast(req.body, req.user._id);
    
    res.status(201).json({
      success: true,
      data: broadcast,
      message: req.body.status === 'sent' 
        ? 'Broadcast sent successfully' 
        : 'Broadcast created successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get all broadcasts
// @route   GET /api/misc/broadcasts
// @access  Private/Admin
const getAllBroadcasts = asyncHandler(async (req, res) => {
  try {
    const broadcasts = await broadcastService.getAllBroadcasts(req.query);
    
    res.status(200).json({
      success: true,
      count: broadcasts.length,
      data: broadcasts
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get broadcast by ID
// @route   GET /api/misc/broadcasts/:id
// @access  Private/Admin
const getBroadcastById = asyncHandler(async (req, res) => {
  try {
    const broadcast = await broadcastService.getBroadcastById(req.params.id);
    
    if (!broadcast) {
      return res.status(404).json({
        success: false,
        message: 'Broadcast not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: broadcast
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Update broadcast
// @route   PUT /api/misc/broadcasts/:id
// @access  Private/Admin
const updateBroadcast = asyncHandler(async (req, res) => {
  try {
    const broadcast = await broadcastService.updateBroadcast(
      req.params.id,
      req.body,
      req.user._id
    );
    
    res.status(200).json({
      success: true,
      data: broadcast,
      message: req.body.status === 'sent' 
        ? 'Broadcast sent successfully' 
        : 'Broadcast updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Delete broadcast
// @route   DELETE /api/misc/broadcasts/:id
// @access  Private/Admin
const deleteBroadcast = asyncHandler(async (req, res) => {
  try {
    await broadcastService.deleteBroadcast(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Broadcast deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Send broadcast immediately
// @route   POST /api/misc/broadcasts/:id/send
// @access  Private/Admin
const sendBroadcast = asyncHandler(async (req, res) => {
  try {
    const result = await broadcastService.sendBroadcast(req.params.id);
    
    res.status(200).json({
      success: true,
      data: {
        broadcast: result.broadcast,
        stats: result.deliveryStats
      },
      message: 'Broadcast sent successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Cancel scheduled broadcast
// @route   POST /api/misc/broadcasts/:id/cancel
// @access  Private/Admin
const cancelScheduledBroadcast = asyncHandler(async (req, res) => {
  try {
    const broadcast = await broadcastService.cancelScheduledBroadcast(req.params.id);
    
    res.status(200).json({
      success: true,
      data: broadcast,
      message: 'Scheduled broadcast cancelled successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Process all scheduled broadcasts
// @route   POST /api/misc/broadcasts/process-scheduled
// @access  Private/Admin
const processScheduledBroadcasts = asyncHandler(async (req, res) => {
  try {
    const results = await broadcastService.processScheduledBroadcasts();
    
    res.status(200).json({
      success: true,
      data: results,
      message: `Processed ${results.length} scheduled broadcasts`
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = {
  createBroadcast,
  getAllBroadcasts,
  getBroadcastById,
  updateBroadcast,
  deleteBroadcast,
  sendBroadcast,
  cancelScheduledBroadcast,
  processScheduledBroadcasts
};