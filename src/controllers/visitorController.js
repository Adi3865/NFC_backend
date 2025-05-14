const asyncHandler = require('express-async-handler');
const visitorService = require('../services/visitorService');

// @desc    Create a new visitor request
// @route   POST /api/visitors
// @access  Private
const createVisitorRequest = asyncHandler(async (req, res) => {
  try {
    const visitor = await visitorService.createVisitorRequest(req.body, req.user._id);
    
    res.status(201).json({
      success: true,
      data: visitor,
      message: 'Visitor request created successfully. Awaiting approval.'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get all visitor requests for the logged-in user
// @route   GET /api/visitors/my
// @access  Private
const getMyVisitorRequests = asyncHandler(async (req, res) => {
  const visitors = await visitorService.getUserVisitorRequests(req.user._id, req.query);
  
  res.status(200).json({
    success: true,
    count: visitors.length,
    data: visitors
  });
});

// @desc    Get pending visitor requests for approval
// @route   GET /api/visitors/pending
// @access  Private/SecurityAdmin
const getPendingVisitorRequests = asyncHandler(async (req, res) => {
  const visitors = await visitorService.getPendingVisitorRequests(req.query);
  
  res.status(200).json({
    success: true,
    count: visitors.length,
    data: visitors
  });
});

// @desc    Approve a visitor request
// @route   PUT /api/visitors/:id/approve
// @access  Private/SecurityAdmin
const approveVisitorRequest = asyncHandler(async (req, res) => {
  try {
    const visitor = await visitorService.updateVisitorStatus(
      req.params.id,
      'approved',
      req.user._id,
      req.body.remarks
    );
    
    res.status(200).json({
      success: true,
      data: visitor,
      message: 'Visitor request approved successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Reject a visitor request
// @route   PUT /api/visitors/:id/reject
// @access  Private/SecurityAdmin
const rejectVisitorRequest = asyncHandler(async (req, res) => {
  try {
    const visitor = await visitorService.updateVisitorStatus(
      req.params.id,
      'rejected',
      req.user._id,
      req.body.remarks
    );
    
    res.status(200).json({
      success: true,
      data: visitor,
      message: 'Visitor request rejected'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Check-in a visitor
// @route   PUT /api/visitors/:id/check-in
// @access  Private/SecurityPersonnel
const checkInVisitor = asyncHandler(async (req, res) => {
  try {
    const visitor = await visitorService.checkInVisitor(
      req.params.id,
      req.body,
      req.user._id
    );
    
    res.status(200).json({
      success: true,
      data: visitor,
      message: `Visitor checked in successfully. Token number: ${visitor.tokenNumber}`
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Check-out a visitor
// @route   PUT /api/visitors/:id/check-out
// @access  Private/SecurityPersonnel
const checkOutVisitor = asyncHandler(async (req, res) => {
  try {
    const { tokenReturned = true } = req.body;
    
    const visitor = await visitorService.checkOutVisitor(
      req.params.id,
      tokenReturned,
      req.user._id
    );
    
    res.status(200).json({
      success: true,
      data: visitor,
      message: 'Visitor checked out successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Cancel a visitor request
// @route   PUT /api/visitors/:id/cancel
// @access  Private
const cancelVisitorRequest = asyncHandler(async (req, res) => {
  try {
    const visitor = await visitorService.cancelVisitorRequest(
      req.params.id,
      req.user._id
    );
    
    res.status(200).json({
      success: true,
      data: visitor,
      message: 'Visitor request cancelled successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Add a visitor to blacklist
// @route   POST /api/visitors/blacklist
// @access  Private/SecurityAdmin
const blacklistVisitor = asyncHandler(async (req, res) => {
  try {
    const blacklist = await visitorService.blacklistVisitor(
      req.body,
      req.user._id
    );
    
    res.status(201).json({
      success: true,
      data: blacklist,
      message: 'Visitor added to blacklist successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Remove a visitor from blacklist
// @route   PUT /api/visitors/blacklist/:id/remove
// @access  Private/SecurityAdmin
const removeFromBlacklist = asyncHandler(async (req, res) => {
  try {
    const blacklist = await visitorService.removeFromBlacklist(
      req.params.id,
      req.user._id
    );
    
    res.status(200).json({
      success: true,
      data: blacklist,
      message: 'Visitor removed from blacklist'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get all blacklisted visitors
// @route   GET /api/visitors/blacklist
// @access  Private/SecurityPersonnel
const getBlacklistedVisitors = asyncHandler(async (req, res) => {
  const blacklist = await visitorService.getBlacklistedVisitors();
  
  res.status(200).json({
    success: true,
    count: blacklist.length,
    data: blacklist
  });
});

// @desc    Get visitor reports
// @route   GET /api/visitors/reports/:reportType
// @access  Private/SecurityAdmin
const getVisitorReports = asyncHandler(async (req, res) => {
  const { reportType } = req.params;
  const { startDate, endDate } = req.query;
  
  if (!['daily', 'weekly', 'monthly'].includes(reportType)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid report type. Must be daily, weekly, or monthly'
    });
  }
  
  const reports = await visitorService.getVisitorReports(reportType, startDate, endDate);
  
  res.status(200).json({
    success: true,
    data: reports
  });
});

module.exports = {
  createVisitorRequest,
  getMyVisitorRequests,
  getPendingVisitorRequests,
  approveVisitorRequest,
  rejectVisitorRequest,
  checkInVisitor,
  checkOutVisitor,
  cancelVisitorRequest,
  blacklistVisitor,
  removeFromBlacklist,
  getBlacklistedVisitors,
  getVisitorReports
};