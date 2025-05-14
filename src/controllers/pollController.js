const asyncHandler = require('express-async-handler');
const pollService = require('../services/pollService');

// @desc    Create a new poll
// @route   POST /api/misc/polls
// @access  Private/Admin
const createPoll = asyncHandler(async (req, res) => {
  try {
    const poll = await pollService.createPoll(req.body, req.user._id);
    
    res.status(201).json({
      success: true,
      data: poll,
      message: 'Poll created successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get all polls
// @route   GET /api/misc/polls
// @access  Private/Admin
const getAllPolls = asyncHandler(async (req, res) => {
  try {
    const polls = await pollService.getAllPolls(req.query);
    
    res.status(200).json({
      success: true,
      count: polls.length,
      data: polls
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get poll by ID
// @route   GET /api/misc/polls/:id
// @access  Private/Admin
const getPollById = asyncHandler(async (req, res) => {
  try {
    const poll = await pollService.getPollById(req.params.id);
    
    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: poll
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Update poll
// @route   PUT /api/misc/polls/:id
// @access  Private/Admin
const updatePoll = asyncHandler(async (req, res) => {
  try {
    const poll = await pollService.updatePoll(
      req.params.id,
      req.body,
      req.user._id
    );
    
    res.status(200).json({
      success: true,
      data: poll,
      message: 'Poll updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Delete poll
// @route   DELETE /api/misc/polls/:id
// @access  Private/Admin
const deletePoll = asyncHandler(async (req, res) => {
  try {
    await pollService.deletePoll(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Poll deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Submit poll response
// @route   POST /api/misc/polls/:id/respond
// @access  Private
const submitPollResponse = asyncHandler(async (req, res) => {
  try {
    // Get IP and device info from request if available
    const metadata = {
      deviceInfo: req.headers['user-agent'] || '',
      ipAddress: req.ip || req.connection.remoteAddress || ''
    };
    
    const response = await pollService.submitPollResponse(
      req.params.id,
      req.body,
      req.user._id,
      metadata
    );
    
    res.status(201).json({
      success: true,
      data: response,
      message: 'Response submitted successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get poll results
// @route   GET /api/misc/polls/:id/results
// @access  Private/Admin
const getPollResults = asyncHandler(async (req, res) => {
  try {
    const results = await pollService.getPollResults(req.params.id);
    
    res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Close poll
// @route   PUT /api/misc/polls/:id/close
// @access  Private/Admin
const closePoll = asyncHandler(async (req, res) => {
  try {
    const poll = await pollService.closePoll(req.params.id, req.user._id);
    
    res.status(200).json({
      success: true,
      data: poll,
      message: 'Poll closed successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Archive poll
// @route   PUT /api/misc/polls/:id/archive
// @access  Private/Admin
const archivePoll = asyncHandler(async (req, res) => {
  try {
    const poll = await pollService.archivePoll(req.params.id, req.user._id);
    
    res.status(200).json({
      success: true,
      data: poll,
      message: 'Poll archived successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get active polls for current user
// @route   GET /api/misc/polls/active
// @access  Private
const getActivePolls = asyncHandler(async (req, res) => {
  try {
    const polls = await pollService.getActivePolls(req.user._id);
    
    res.status(200).json({
      success: true,
      count: polls.length,
      data: polls
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = {
  createPoll,
  getAllPolls,
  getPollById,
  updatePoll,
  deletePoll,
  submitPollResponse,
  getPollResults,
  closePoll,
  archivePoll,
  getActivePolls
};