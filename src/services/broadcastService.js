const Broadcast = require("../models/Broadcast");
const User = require("../models/User");
const notificationService = require("./notificationService");
const { generateBroadcastId } = require("../utils/generateMiscId.js");

/**
 * Create a new broadcast message
 * @param {object} broadcastData - Broadcast information
 * @param {string} adminId - Admin user ID
 * @returns {object} - Created broadcast
 */
const createBroadcast = async (broadcastData, adminId) => {
  const {
    title,
    message,
    broadcastType,
    notificationChannels,
    targetUsers,
    targetDepartments,
    scheduledAt,
    expiresAt,
    priority,
    status,
  } = broadcastData;

  // Create the broadcast
  const broadcast = await Broadcast.create({
    broadcastId: generateBroadcastId(),
    title,
    message,
    broadcastType: broadcastType || "general",
    notificationChannels: {
      app:
        notificationChannels?.app !== undefined
          ? notificationChannels.app
          : true,
      sms:
        notificationChannels?.sms !== undefined
          ? notificationChannels.sms
          : false,
    },
    targetUsers: targetUsers || "all",
    targetDepartments: targetDepartments || [],
    sentBy: adminId,
    scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
    expiresAt: expiresAt ? new Date(expiresAt) : null,
    status: status || (scheduledAt ? "scheduled" : "draft"),
    priority: priority || "medium",
  });

  // If status is 'sent', send the broadcast immediately
  if (status === "sent") {
    await sendBroadcast(broadcast._id);
  }

  return broadcast;
};

/**
 * Get all broadcasts with filters
 * @param {object} filters - Filter conditions
 * @returns {Array} - List of broadcasts
 */
const getAllBroadcasts = async (filters = {}) => {
  const query = {};

  // Apply filters
  if (filters.status) query.status = filters.status;
  if (filters.broadcastType) query.broadcastType = filters.broadcastType;
  if (filters.targetUsers) query.targetUsers = filters.targetUsers;

  // Date range filters
  if (filters.startDate && filters.endDate) {
    query.createdAt = {
      $gte: new Date(filters.startDate),
      $lte: new Date(filters.endDate),
    };
  }

  return await Broadcast.find(query)
    .populate("sentBy", "name userId")
    .sort({ createdAt: -1 });
};

/**
 * Get broadcast by ID
 * @param {string} broadcastId - Broadcast ID
 * @returns {object} - Broadcast object
 */
const getBroadcastById = async (broadcastId) => {
  return await Broadcast.findById(broadcastId).populate(
    "sentBy",
    "name userId"
  );
};

/**
 * Update broadcast information
 * @param {string} broadcastId - Broadcast ID
 * @param {object} updateData - Updated information
 * @param {string} adminId - Admin user ID
 * @returns {object} - Updated broadcast
 */
const updateBroadcast = async (broadcastId, updateData, adminId) => {
  const broadcast = await Broadcast.findById(broadcastId);

  if (!broadcast) {
    throw new Error("Broadcast not found");
  }

  // Cannot update a broadcast that has already been sent
  if (broadcast.isSent) {
    throw new Error("Cannot update a broadcast that has already been sent");
  }

  // Update fields
  Object.keys(updateData).forEach((key) => {
    // Handle nested notificationChannels object
    if (key === "notificationChannels" && typeof updateData[key] === "object") {
      broadcast.notificationChannels = {
        ...broadcast.notificationChannels,
        ...updateData[key],
      };
    } else if (
      key !== "sentBy" &&
      key !== "isSent" &&
      key !== "sentAt" &&
      key !== "deliveryStats"
    ) {
      broadcast[key] = updateData[key];
    }
  });

  // Check if status is being changed to 'sent'
  const sendNow = !broadcast.isSent && updateData.status === "sent";

  await broadcast.save();

  // If status is changed to 'sent', send the broadcast
  if (sendNow) {
    await sendBroadcast(broadcastId);
  }

  return broadcast;
};

/**
 * Delete a draft broadcast
 * @param {string} broadcastId - Broadcast ID
 * @returns {boolean} - Success status
 */
const deleteBroadcast = async (broadcastId) => {
  const broadcast = await Broadcast.findById(broadcastId);

  if (!broadcast) {
    throw new Error("Broadcast not found");
  }

  // Can only delete drafts or scheduled broadcasts
  if (broadcast.status !== "draft" && broadcast.status !== "scheduled") {
    throw new Error("Can only delete draft or scheduled broadcasts");
  }

  await Broadcast.deleteOne({ _id: broadcastId });
  return true;
};

/**
 * Send a broadcast to target users
 * @param {string} broadcastId - Broadcast ID
 * @returns {object} - Delivery statistics
 */
const sendBroadcast = async (broadcastId) => {
  const broadcast = await Broadcast.findById(broadcastId);

  if (!broadcast) {
    throw new Error("Broadcast not found");
  }

  if (broadcast.isSent) {
    throw new Error("Broadcast has already been sent");
  }

  // Find users to send to based on targetUsers and targetDepartments
  const query = { status: "approved" };

  if (broadcast.targetUsers !== "all") {
    query.role =
      broadcast.targetUsers === "residents"
        ? "resident"
        : broadcast.targetUsers === "staff"
        ? "maintenanceStaff"
        : broadcast.targetUsers === "admins"
        ? ["superAdmin", "departmentAdmin"]
        : "all";
  }

  if (broadcast.targetDepartments && broadcast.targetDepartments.length > 0) {
    query.department = { $in: broadcast.targetDepartments };
  }

  const users = await User.find(query).select("_id userId name email phone");

  // Send notifications based on channels
  const deliveryStats = {
    total: users.length,
    sent: 0,
    failed: 0,
  };

  for (const user of users) {
    try {
      // Send app notification
      if (broadcast.notificationChannels.app) {
        await notificationService.sendNotification(
          user._id,
          broadcast.title,
          broadcast.message,
          `broadcast_${broadcast.broadcastType}`,
          {
            broadcastId: broadcast._id,
            priority: broadcast.priority,
            broadcastType: broadcast.broadcastType,
          }
        );
      }

      // Send SMS if enabled and user has phone number
      if (broadcast.notificationChannels.sms && user.phone) {
        // In a real implementation, integrate with SMS service
        console.log(
          `SMS would be sent to ${user.phone}: ${broadcast.title} - ${broadcast.message}`
        );
        // await smsService.sendSMS(user.phone, `${broadcast.title}: ${broadcast.message}`);
      }

      deliveryStats.sent++;
    } catch (error) {
      console.error(`Failed to send broadcast to user ${user._id}:`, error);
      deliveryStats.failed++;
    }
  }

  // Update broadcast status
  broadcast.isSent = true;
  broadcast.sentAt = new Date();
  broadcast.status = "sent";
  broadcast.deliveryStats = deliveryStats;
  await broadcast.save();

  return { broadcast, deliveryStats };
};

/**
 * Process scheduled broadcasts that are due to be sent
 * @returns {Array} - List of processed broadcasts
 */
const processScheduledBroadcasts = async () => {
  const now = new Date();

  // Find scheduled broadcasts that are due
  const scheduledBroadcasts = await Broadcast.find({
    status: "scheduled",
    isSent: false,
    scheduledAt: { $lte: now },
  });

  const results = [];

  for (const broadcast of scheduledBroadcasts) {
    try {
      const result = await sendBroadcast(broadcast._id);
      results.push({
        broadcastId: broadcast._id,
        title: broadcast.title,
        success: true,
        stats: result.deliveryStats,
      });
    } catch (error) {
      console.error(
        `Failed to process scheduled broadcast ${broadcast._id}:`,
        error
      );
      results.push({
        broadcastId: broadcast._id,
        title: broadcast.title,
        success: false,
        error: error.message,
      });
    }
  }

  return results;
};

/**
 * Cancel a scheduled broadcast
 * @param {string} broadcastId - Broadcast ID
 * @returns {object} - Updated broadcast
 */
const cancelScheduledBroadcast = async (broadcastId) => {
  const broadcast = await Broadcast.findById(broadcastId);

  if (!broadcast) {
    throw new Error("Broadcast not found");
  }

  if (broadcast.status !== "scheduled") {
    throw new Error("Only scheduled broadcasts can be cancelled");
  }

  if (broadcast.isSent) {
    throw new Error("Broadcast has already been sent");
  }

  broadcast.status = "draft";
  await broadcast.save();

  return broadcast;
};

module.exports = {
  createBroadcast,
  getAllBroadcasts,
  getBroadcastById,
  updateBroadcast,
  deleteBroadcast,
  sendBroadcast,
  processScheduledBroadcasts,
  cancelScheduledBroadcast,
};
