const User = require('../models/User');

/**
 * Send notification to a user
 * @param {string} userId - User ID to notify
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} type - Notification type
 * @param {object} data - Additional data for the notification
 */
const sendNotification = async (userId, title, message, type, data = {}) => {
  // In a production environment, this would integrate with Firebase Cloud Messaging,
  // or a similar service for push notifications
  
  console.log(`Notification sent to user ${userId}:`, {
    title,
    message,
    type,
    data,
    timestamp: new Date()
  });
  
  // Placeholder for actual notification implementation
  // Example: await firebaseAdmin.messaging().send({ ... });
};

/**
 * Send notifications to security personnel
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} type - Notification type
 * @param {object} data - Additional data for the notification
 */
const notifySecurityPersonnel = async (title, message, type, data = {}) => {
  try {
    // Find all users with security roles
    const securityUsers = await User.find({
      role: { $in: ['superAdmin', 'departmentAdmin', 'securityPersonnel'] },
      status: 'approved'
    }).select('_id');
    
    // Send notification to each security user
    for (const user of securityUsers) {
      await sendNotification(user._id, title, message, type, data);
    }
  } catch (error) {
    console.error('Error sending security notifications:', error);
  }
};

/**
 * Notify about a new visitor request
 * @param {object} visitor - Visitor object
 * @param {object} requestedBy - User who requested the visitor
 */
const notifyNewVisitorRequest = async (visitor, requestedBy) => {
  const title = 'New Visitor Request';
  const message = `${requestedBy.name} has requested approval for visitor: ${visitor.name}`;
  
  await notifySecurityPersonnel(title, message, 'visitor_request', {
    visitorId: visitor._id,
    visitorName: visitor.name,
    requestedBy: requestedBy.name,
    requestTime: visitor.createdAt
  });
};

/**
 * Notify user about visitor request status change
 * @param {object} visitor - Visitor object
 * @param {string} status - New status
 * @param {string} remarks - Optional remarks
 */
const notifyVisitorStatusChange = async (visitor, status, remarks = '') => {
  try {
    const user = await User.findById(visitor.requestedBy);
    
    if (!user) {
      console.error('User not found for notification:', visitor.requestedBy);
      return;
    }
    
    let title, message;
    
    switch (status) {
      case 'approved':
        title = 'Visitor Request Approved';
        message = `Your visitor request for ${visitor.name} has been approved.`;
        break;
      case 'rejected':
        title = 'Visitor Request Rejected';
        message = `Your visitor request for ${visitor.name} has been rejected.`;
        if (remarks) message += ` Reason: ${remarks}`;
        break;
      case 'checked-in':
        title = 'Visitor Checked In';
        message = `Your visitor ${visitor.name} has checked in.`;
        break;
      case 'checked-out':
        title = 'Visitor Checked Out';
        message = `Your visitor ${visitor.name} has checked out.`;
        break;
      default:
        title = 'Visitor Status Update';
        message = `Status update for your visitor ${visitor.name}: ${status}`;
    }
    
    await sendNotification(user._id, title, message, 'visitor_update', {
      visitorId: visitor._id,
      visitorName: visitor.name,
      status,
      remarks,
      updateTime: new Date()
    });
  } catch (error) {
    console.error('Error sending visitor status notification:', error);
  }
};

/**
 * Notify about a blacklisted visitor attempt
 * @param {object} blacklistEntry - Blacklist entry
 * @param {object} visitorRequest - Visitor request (if applicable)
 */
const notifyBlacklistedVisitorAttempt = async (blacklistEntry, visitorRequest = null) => {
  let requestedBy = 'Someone';
  
  if (visitorRequest && visitorRequest.requestedBy) {
    try {
      const user = await User.findById(visitorRequest.requestedBy);
      if (user) {
        requestedBy = user.name;
      }
    } catch (error) {
      console.error('Error finding user for blacklist notification:', error);
    }
  }
  
  const title = 'Blacklisted Visitor Attempt';
  const message = `${requestedBy} attempted to register a blacklisted visitor: ${blacklistEntry.name}`;
  
  await notifySecurityPersonnel(title, message, 'blacklist_attempt', {
    visitorName: blacklistEntry.name,
    mobileNumber: blacklistEntry.mobileNumber,
    reason: blacklistEntry.reason,
    requestedBy: requestedBy,
    attemptTime: new Date()
  });
};

module.exports = {
  sendNotification,
  notifySecurityPersonnel,
  notifyNewVisitorRequest,
  notifyVisitorStatusChange,
  notifyBlacklistedVisitorAttempt
};




