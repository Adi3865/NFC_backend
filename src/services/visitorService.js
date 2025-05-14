const Visitor = require('../models/visitor');
const VisitorBlacklist = require('../models/visitorBlacklist');
const User = require('../models/User');
const { generateVisitorId } = require('../utils/generateVisitorId');
const notificationService = require('./notificationService');

/**
 * Create a new visitor request
 * @param {object} visitorData - Visitor information
 * @param {string} userId - Requesting user ID
 * @returns {object} - Created visitor request
 */
const createVisitorRequest = async (visitorData, userId) => {
  const {
    name,
    mobileNumber,
    photo,
    purpose,
    expectedArrivalTime,
    expectedDuration,
    isGroupVisit = false,
    groupSize = 1,
    additionalVisitors = []
  } = visitorData;

  // Check if visitor is blacklisted
  const isBlacklisted = await VisitorBlacklist.findOne({ 
    mobileNumber, 
    isActive: true 
  });

  if (isBlacklisted) {
    // Notify security about blacklisted visitor attempt
    const user = await User.findById(userId);
    await notificationService.notifyBlacklistedVisitorAttempt(isBlacklisted, {
      requestedBy: userId,
      visitor: { name, mobileNumber }
    });
    
    throw new Error('This visitor is blacklisted and cannot be registered');
  }

  // For group visits, validate additionalVisitors
  if (isGroupVisit && groupSize > 1) {
    if (!additionalVisitors || additionalVisitors.length !== groupSize - 1) {
      throw new Error(`For a group size of ${groupSize}, you must provide details for ${groupSize - 1} additional visitors`);
    }
  }

  // Create visitor request
  const visitor = await Visitor.create({
    visitorId: generateVisitorId(),
    name,
    mobileNumber,
    photo,
    purpose,
    expectedArrivalTime: new Date(expectedArrivalTime),
    expectedDuration: parseInt(expectedDuration) || 2,
    requestedBy: userId,
    isGroupVisit,
    groupSize,
    additionalVisitors,
    status: 'pending'
  });

  // Notify security personnel about new visitor request
  const requestedBy = await User.findById(userId);
  await notificationService.notifyNewVisitorRequest(visitor, requestedBy);

  return visitor;
};

/**
 * Get all visitor requests for a user
 * @param {string} userId - User ID
 * @param {object} filters - Filter conditions
 * @returns {Array} - List of visitor requests
 */
const getUserVisitorRequests = async (userId, filters = {}) => {
  const query = { requestedBy: userId };

  // Apply additional filters
  if (filters.status) {
    query.status = filters.status;
  }

  // Date range filters
  if (filters.startDate && filters.endDate) {
    query.createdAt = {
      $gte: new Date(filters.startDate),
      $lte: new Date(filters.endDate)
    };
  }

  return await Visitor.find(query)
    .sort({ createdAt: -1 });
};

/**
 * Get all pending visitor requests for security approval
 * @param {object} filters - Filter conditions
 * @returns {Array} - List of pending visitor requests
 */
const getPendingVisitorRequests = async (filters = {}) => {
  const query = { status: 'pending' };

  // Date range filters
  if (filters.startDate && filters.endDate) {
    query.expectedArrivalTime = {
      $gte: new Date(filters.startDate),
      $lte: new Date(filters.endDate)
    };
  }

  return await Visitor.find(query)
    .populate('requestedBy', 'name userId email')
    .sort({ expectedArrivalTime: 1 });
};

/**
 * Update visitor request status
 * @param {string} visitorId - Visitor ID
 * @param {string} status - New status ('approved', 'rejected', etc.)
 * @param {string} securityPersonnelId - Security personnel user ID
 * @param {string} remarks - Optional remarks
 * @returns {object} - Updated visitor request
 */
const updateVisitorStatus = async (visitorId, status, securityPersonnelId, remarks = '') => {
  const visitor = await Visitor.findById(visitorId);

  if (!visitor) {
    throw new Error('Visitor request not found');
  }

  visitor.status = status;
  visitor.remarks = remarks || visitor.remarks;

  if (['approved', 'rejected'].includes(status)) {
    visitor.approvedBy = securityPersonnelId;
    visitor.approvalTime = new Date();
  }

  await visitor.save();

  // Notify the user who requested the visitor
  await notificationService.notifyVisitorStatusChange(visitor, status, remarks);

  return visitor;
};

/**
 * Check-in a visitor who has arrived
 * @param {string} visitorId - Visitor ID
 * @param {object} checkInData - Check-in information
 * @param {string} securityPersonnelId - Security personnel user ID
 * @returns {object} - Updated visitor
 */
const checkInVisitor = async (visitorId, checkInData, securityPersonnelId) => {
  const { idCardPhoto } = checkInData;
  const visitor = await Visitor.findById(visitorId);

  if (!visitor) {
    throw new Error('Visitor request not found');
  }

  if (visitor.status !== 'approved') {
    throw new Error('Visitor request must be approved before check-in');
  }

  // Generate token number (using timestamp + random digits)
  const timestamp = Date.now().toString().slice(-4);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  const tokenNumber = `V${timestamp}${random}`;

  visitor.status = 'checked-in';
  visitor.checkInTime = new Date();
  visitor.idCardPhoto = idCardPhoto;
  visitor.tokenNumber = tokenNumber;

  await visitor.save();

  // Notify the user that their visitor has checked in
  await notificationService.notifyVisitorStatusChange(visitor, 'checked-in');

  return visitor;
};

/**
 * Check-out a visitor who is leaving
 * @param {string} visitorId - Visitor ID
 * @param {boolean} tokenReturned - Whether the token was returned
 * @param {string} securityPersonnelId - Security personnel user ID
 * @returns {object} - Updated visitor
 */
const checkOutVisitor = async (visitorId, tokenReturned, securityPersonnelId) => {
  const visitor = await Visitor.findById(visitorId);

  if (!visitor) {
    throw new Error('Visitor request not found');
  }

  if (visitor.status !== 'checked-in') {
    throw new Error('Visitor must be checked-in before check-out');
  }

  visitor.status = 'checked-out';
  visitor.checkOutTime = new Date();
  visitor.tokenReturned = tokenReturned;

  await visitor.save();

  // Notify the user that their visitor has checked out
  await notificationService.notifyVisitorStatusChange(visitor, 'checked-out');

  return visitor;
};

/**
 * Cancel a visitor request
 * @param {string} visitorId - Visitor ID
 * @param {string} userId - User ID
 * @returns {object} - Updated visitor
 */
const cancelVisitorRequest = async (visitorId, userId) => {
  const visitor = await Visitor.findOne({ 
    _id: visitorId,
    requestedBy: userId
  });

  if (!visitor) {
    throw new Error('Visitor request not found');
  }

  if (!['pending', 'approved'].includes(visitor.status)) {
    throw new Error('Only pending or approved visitor requests can be cancelled');
  }

  visitor.status = 'cancelled';
  await visitor.save();

  return visitor;
};

/**
 * Add a visitor to blacklist
 * @param {object} blacklistData - Blacklist information
 * @param {string} securityPersonnelId - Security personnel user ID
 * @returns {object} - Created blacklist entry
 */
const blacklistVisitor = async (blacklistData, securityPersonnelId) => {
  const { mobileNumber, name, photo, reason, visitorId } = blacklistData;

  // Check if already blacklisted
  const existingBlacklist = await VisitorBlacklist.findOne({ mobileNumber, isActive: true });
  if (existingBlacklist) {
    throw new Error('This visitor is already blacklisted');
  }

  // Create blacklist entry
  const blacklistEntry = await VisitorBlacklist.create({
    mobileNumber,
    name,
    photo,
    reason,
    blockedBy: securityPersonnelId,
    lastVisitId: visitorId || null,
    isActive: true
  });

  // Update any existing visitor with this mobile number to be blacklisted
  if (visitorId) {
    await Visitor.findByIdAndUpdate(visitorId, { 
      isBlacklisted: true,
      blacklistedReason: reason
    });
  }

  return blacklistEntry;
};

/**
 * Remove a visitor from blacklist
 * @param {string} blacklistId - Blacklist entry ID
 * @param {string} securityPersonnelId - Security personnel user ID
 * @returns {object} - Updated blacklist entry
 */
const removeFromBlacklist = async (blacklistId, securityPersonnelId) => {
  const blacklistEntry = await VisitorBlacklist.findById(blacklistId);

  if (!blacklistEntry) {
    throw new Error('Blacklist entry not found');
  }

  blacklistEntry.isActive = false;
  await blacklistEntry.save();

  return blacklistEntry;
};

/**
 * Get blacklisted visitors
 * @returns {Array} - List of blacklisted visitors
 */
const getBlacklistedVisitors = async () => {
  return await VisitorBlacklist.find({ isActive: true })
    .populate('blockedBy', 'name userId')
    .sort({ createdAt: -1 });
};

/**
 * Get visitor reports
 * @param {string} reportType - Report type ('daily', 'weekly', 'monthly')
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {object} - Visitor statistics
 */
const getVisitorReports = async (reportType, startDate, endDate) => {
  // Create date range based on report type if not provided
  if (!startDate || !endDate) {
    const today = new Date();
    endDate = new Date();
    
    if (reportType === 'daily') {
      startDate = new Date(today);
      startDate.setHours(0, 0, 0, 0);
    } else if (reportType === 'weekly') {
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 7);
    } else if (reportType === 'monthly') {
      startDate = new Date(today);
      startDate.setMonth(today.getMonth() - 1);
    }
  } else {
    startDate = new Date(startDate);
    endDate = new Date(endDate);
  }

  // Get total visitors count
  const totalVisitors = await Visitor.countDocuments({
    createdAt: { $gte: startDate, $lte: endDate }
  });

  // Get checked-in visitors count
  const checkedInVisitors = await Visitor.countDocuments({
    status: 'checked-in',
    checkInTime: { $gte: startDate, $lte: endDate }
  });

  // Get checked-out visitors count
  const checkedOutVisitors = await Visitor.countDocuments({
    status: 'checked-out',
    checkOutTime: { $gte: startDate, $lte: endDate }
  });

  // Get cancelled visitors count
  const cancelledVisitors = await Visitor.countDocuments({
    status: 'cancelled',
    updatedAt: { $gte: startDate, $lte: endDate }
  });

  // Get visitor data with day-wise grouping
  const visitorData = await Visitor.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          day: { $dayOfMonth: "$createdAt" }
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 }
    }
  ]);

  // Format data for chart display
  const formattedData = visitorData.map(item => {
    const date = new Date(item._id.year, item._id.month - 1, item._id.day);
    return {
      date: date.toISOString().split('T')[0],
      count: item.count
    };
  });

  return {
    totalVisitors,
    checkedInVisitors,
    checkedOutVisitors,
    cancelledVisitors,
    dailyVisitorCounts: formattedData
  };
};

module.exports = {
  createVisitorRequest,
  getUserVisitorRequests,
  getPendingVisitorRequests,
  updateVisitorStatus,
  checkInVisitor,
  checkOutVisitor,
  cancelVisitorRequest,
  blacklistVisitor,
  removeFromBlacklist,
  getBlacklistedVisitors,
  getVisitorReports
};