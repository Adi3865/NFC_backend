const User = require("../models/User");

/**
 * Send a notification to a user
 * @param {string} userId - The user ID to send the notification to
 * @param {string} title - The notification title
 * @param {string} message - The notification message
 * @param {string} type - The notification type (complaint, broadcast, etc.)
 * @param {string} referenceId - Optional reference ID (e.g., complaint ID)
 * @returns {Promise<boolean>} - Success status
 */
const sendNotification = async (
  userId,
  title,
  message,
  type,
  referenceId = null
) => {
  try {
    // In a real implementation, this would:
    // 1. Save the notification to a database
    // 2. Emit an event for real-time notifications
    // 3. Send push notifications or SMS if configured

    // For now, this is a placeholder to simulate sending a notification
    console.log(`Notification sent to user ${userId}: ${title} - ${message}`);

    // Here, you would integrate with Firebase Cloud Messaging (FCM)
    // or other push notification services for mobile apps

    // For SMS notifications, integrate with SMS gateway services

    return true;
  } catch (error) {
    console.error("Error sending notification:", error);
    return false;
  }
};

/**
 * Send a bulk notification to multiple users
 * @param {Array<string>} userIds - Array of user IDs
 * @param {string} title - The notification title
 * @param {string} message - The notification message
 * @param {string} type - The notification type
 * @param {string} referenceId - Optional reference ID
 * @returns {Promise<Array>} - Array of success/failure results
 */
const sendBulkNotification = async (
  userIds,
  title,
  message,
  type,
  referenceId = null
) => {
  try {
    const results = [];

    for (const userId of userIds) {
      const result = await sendNotification(
        userId,
        title,
        message,
        type,
        referenceId
      );
      results.push({ userId, success: result });
    }

    return results;
  } catch (error) {
    console.error("Error sending bulk notifications:", error);
    throw error;
  }
};

/**
 * Send notification to all users with a specific role
 * @param {string} role - The user role to send notifications to
 * @param {string} title - The notification title
 * @param {string} message - The notification message
 * @param {string} type - The notification type
 * @param {string} referenceId - Optional reference ID
 * @returns {Promise<number>} - Number of notifications sent
 */
const notifyByRole = async (role, title, message, type, referenceId = null) => {
  try {
    const users = await User.find({ role, status: "approved" }).select("_id");
    const userIds = users.map((user) => user._id);

    await sendBulkNotification(userIds, title, message, type, referenceId);
    return userIds.length;
  } catch (error) {
    console.error("Error notifying by role:", error);
    throw error;
  }
};

/**
 * Send notification to all users in a specific department
 * @param {string} department - The department to send notifications to
 * @param {string} title - The notification title
 * @param {string} message - The notification message
 * @param {string} type - The notification type
 * @param {string} referenceId - Optional reference ID
 * @returns {Promise<number>} - Number of notifications sent
 */
const notifyByDepartment = async (
  department,
  title,
  message,
  type,
  referenceId = null
) => {
  try {
    const users = await User.find({
      department,
      status: "approved",
      role: { $in: ["departmentAdmin", "maintenanceStaff"] },
    }).select("_id");

    const userIds = users.map((user) => user._id);

    await sendBulkNotification(userIds, title, message, type, referenceId);
    return userIds.length;
  } catch (error) {
    console.error("Error notifying by department:", error);
    throw error;
  }
};

module.exports = {
  sendNotification,
  sendBulkNotification,
  notifyByRole,
  notifyByDepartment,
};
