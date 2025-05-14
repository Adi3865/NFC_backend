const Poll = require("../models/Poll");
const PollResponse = require("../models/PollResponse");
const User = require("../models/User");
const notificationService = require("./notificationService");
const { generatePollId } = require("../utils/generateMiscId.js");

/**
 * Create a new poll
 * @param {object} pollData - Poll information
 * @param {string} adminId - Admin user ID
 * @returns {object} - Created poll
 */
const createPoll = async (pollData, adminId) => {
  const {
    title,
    description,
    question,
    options,
    allowMultipleSelections,
    targetUsers,
    targetDepartments,
    startDate,
    endDate,
    status,
    isAnonymous,
  } = pollData;

  // Validate options
  if (!options || !Array.isArray(options) || options.length < 2) {
    throw new Error("Poll must have at least 2 options");
  }

  // Format options array
  const formattedOptions = options.map((option) => {
    return {
      optionText: typeof option === "string" ? option : option.optionText,
      count: 0,
    };
  });

  // Create the poll
  const poll = await Poll.create({
    pollId: generatePollId(),
    title,
    description,
    question,
    options: formattedOptions,
    allowMultipleSelections: allowMultipleSelections || false,
    targetUsers: targetUsers || "all",
    targetDepartments: targetDepartments || [],
    createdBy: adminId,
    startDate: startDate ? new Date(startDate) : new Date(),
    endDate: new Date(endDate),
    status: status || "draft",
    isAnonymous: isAnonymous !== undefined ? isAnonymous : true,
  });

  // If poll is active, notify relevant users
  if (poll.status === "active") {
    await notifyUsersAboutPoll(poll);
  }

  return poll;
};

/**
 * Get all polls with filters
 * @param {object} filters - Filter conditions
 * @returns {Array} - List of polls
 */
const getAllPolls = async (filters = {}) => {
  const query = {};

  // Apply filters
  if (filters.status) query.status = filters.status;
  if (filters.targetUsers) query.targetUsers = filters.targetUsers;

  // Date range filters
  if (filters.startDate && filters.endDate) {
    query.createdAt = {
      $gte: new Date(filters.startDate),
      $lte: new Date(filters.endDate),
    };
  }

  return await Poll.find(query)
    .populate("createdBy", "name userId")
    .sort({ createdAt: -1 });
};

/**
 * Get poll by ID
 * @param {string} pollId - Poll ID
 * @returns {object} - Poll object
 */
const getPollById = async (pollId) => {
  return await Poll.findById(pollId).populate("createdBy", "name userId");
};

/**
 * Update poll information
 * @param {string} pollId - Poll ID
 * @param {object} updateData - Updated information
 * @param {string} adminId - Admin user ID
 * @returns {object} - Updated poll
 */
const updatePoll = async (pollId, updateData, adminId) => {
  const poll = await Poll.findById(pollId);

  if (!poll) {
    throw new Error("Poll not found");
  }

  // Cannot update a poll that is closed or has responses
  if (poll.status === "closed" || poll.status === "archived") {
    throw new Error("Cannot update a poll that is closed or archived");
  }

  const hasResponses = await PollResponse.exists({ pollId: poll._id });
  if (hasResponses && (updateData.options || updateData.question)) {
    throw new Error(
      "Cannot update poll options or question after responses have been submitted"
    );
  }

  // Handle special case for options update
  if (updateData.options) {
    // Validate options
    if (!Array.isArray(updateData.options) || updateData.options.length < 2) {
      throw new Error("Poll must have at least 2 options");
    }

    // Format options array
    poll.options = updateData.options.map((option) => {
      return {
        optionText: typeof option === "string" ? option : option.optionText,
        count: 0,
      };
    });
    delete updateData.options;
  }

  // Update other fields
  Object.keys(updateData).forEach((key) => {
    if (key !== "createdBy" && key !== "totalResponses") {
      poll[key] = updateData[key];
    }
  });

  // Check if status is being changed to 'active'
  const wasActivated =
    poll.status !== "active" && updateData.status === "active";

  await poll.save();

  // If poll is activated, notify users
  if (wasActivated) {
    await notifyUsersAboutPoll(poll);
  }

  return poll;
};

/**
 * Delete a poll
 * @param {string} pollId - Poll ID
 * @returns {boolean} - Success status
 */
const deletePoll = async (pollId) => {
  const poll = await Poll.findById(pollId);

  if (!poll) {
    throw new Error("Poll not found");
  }

  // Can only delete drafts or polls with no responses
  if (poll.status !== "draft") {
    const hasResponses = await PollResponse.exists({ pollId: poll._id });
    if (hasResponses) {
      throw new Error("Cannot delete a poll that has responses");
    }
  }

  await Poll.deleteOne({ _id: pollId });
  // Delete related responses if any
  await PollResponse.deleteMany({ pollId: pollId });
  return true;
};

/**
 * Submit a response to a poll
 * @param {string} pollId - Poll ID
 * @param {object} responseData - Response data
 * @param {string} userId - User ID
 * @param {object} metadata - Additional metadata for response
 * @returns {object} - Submitted response
 */
const submitPollResponse = async (
  pollId,
  responseData,
  userId,
  metadata = {}
) => {
  const poll = await Poll.findById(pollId);

  if (!poll) {
    throw new Error("Poll not found");
  }

  if (poll.status !== "active") {
    throw new Error("This poll is not currently active");
  }

  // Check if poll has expired
  const now = new Date();
  if (now > new Date(poll.endDate)) {
    poll.status = "closed";
    await poll.save();
    throw new Error("This poll has expired");
  }

  // Check if user has already responded
  const existingResponse = await PollResponse.findOne({ pollId, userId });
  if (existingResponse) {
    throw new Error("You have already responded to this poll");
  }

  // Validate selected options
  const { selectedOptions } = responseData;

  if (
    !selectedOptions ||
    !Array.isArray(selectedOptions) ||
    selectedOptions.length === 0
  ) {
    throw new Error("You must select at least one option");
  }

  if (!poll.allowMultipleSelections && selectedOptions.length > 1) {
    throw new Error("This poll does not allow multiple selections");
  }

  // Check that all selected options exist in the poll
  const validOptionIds = poll.options.map((option) => option._id.toString());
  const allOptionsValid = selectedOptions.every((optionId) =>
    validOptionIds.includes(optionId.toString())
  );

  if (!allOptionsValid) {
    throw new Error("One or more selected options are invalid");
  }

  // Create the response
  const pollResponse = await PollResponse.create({
    pollId,
    userId,
    selectedOptions,
    responseText: responseData.responseText || "",
    deviceInfo: metadata.deviceInfo || "",
    ipAddress: metadata.ipAddress || "",
  });

  // Update option counts and total responses
  for (const optionId of selectedOptions) {
    const optionIndex = poll.options.findIndex(
      (opt) => opt._id.toString() === optionId.toString()
    );

    if (optionIndex !== -1) {
      poll.options[optionIndex].count += 1;
    }
  }
  poll.totalResponses += 1;
  await poll.save();

  return pollResponse;
};

/**
 * Get poll results
 * @param {string} pollId - Poll ID
 * @returns {object} - Poll with results
 */
const getPollResults = async (pollId) => {
  const poll = await Poll.findById(pollId).populate("createdBy", "name userId");

  if (!poll) {
    throw new Error("Poll not found");
  }

  // Get detailed response data if needed
  const responseData = [];

  // Only include detailed user data if the poll is not anonymous
  if (!poll.isAnonymous) {
    const responses = await PollResponse.find({ pollId }).populate(
      "userId",
      "name userId"
    );

    for (const response of responses) {
      responseData.push({
        userId: response.userId,
        selectedOptions: response.selectedOptions,
        responseText: response.responseText,
        respondedAt: response.createdAt,
      });
    }
  }

  // Calculate percentages for each option
  const resultsWithPercentages = poll.options.map((option) => {
    const percentage =
      poll.totalResponses > 0
        ? Math.round((option.count / poll.totalResponses) * 100)
        : 0;

    return {
      _id: option._id,
      optionText: option.optionText,
      count: option.count,
      percentage,
    };
  });

  return {
    _id: poll._id,
    pollId: poll.pollId,
    title: poll.title,
    description: poll.description,
    question: poll.question,
    options: resultsWithPercentages,
    allowMultipleSelections: poll.allowMultipleSelections,
    createdBy: poll.createdBy,
    startDate: poll.startDate,
    endDate: poll.endDate,
    status: poll.status,
    totalResponses: poll.totalResponses,
    isAnonymous: poll.isAnonymous,
    detailedResponses: !poll.isAnonymous ? responseData : undefined,
  };
};

/**
 * Close an active poll
 * @param {string} pollId - Poll ID
 * @param {string} adminId - Admin user ID
 * @returns {object} - Updated poll
 */
const closePoll = async (pollId, adminId) => {
  const poll = await Poll.findById(pollId);

  if (!poll) {
    throw new Error("Poll not found");
  }

  if (poll.status !== "active") {
    throw new Error("Only active polls can be closed");
  }

  poll.status = "closed";
  await poll.save();

  return poll;
};

/**
 * Archive a closed poll
 * @param {string} pollId - Poll ID
 * @param {string} adminId - Admin user ID
 * @returns {object} - Updated poll
 */
const archivePoll = async (pollId, adminId) => {
  const poll = await Poll.findById(pollId);

  if (!poll) {
    throw new Error("Poll not found");
  }

  if (poll.status !== "closed") {
    throw new Error("Only closed polls can be archived");
  }

  poll.status = "archived";
  await poll.save();

  return poll;
};

/**
 * Get active polls for a user
 * @param {string} userId - User ID
 * @returns {Array} - List of active polls
 */
const getActivePolls = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  // Get active polls that match user criteria
  const now = new Date();
  const query = {
    status: "active",
    startDate: { $lte: now },
    endDate: { $gte: now },
  };

  // Filter by targetUsers and targetDepartments
  const userRole = user.role;
  const userDepartment = user.department;

  // Build a query to match targetUsers
  const targetUserQueries = [{ targetUsers: "all" }];

  if (userRole === "resident") {
    targetUserQueries.push({ targetUsers: "residents" });
  } else if (userRole === "maintenanceStaff") {
    targetUserQueries.push({ targetUsers: "staff" });
  } else if (["superAdmin", "departmentAdmin"].includes(userRole)) {
    targetUserQueries.push({ targetUsers: "admins" });
  }

  // Add targetUsers to main query
  query.$or = targetUserQueries;

  // Only check departments if user has a department
  if (userDepartment) {
    // Need to use $and with $or to combine with targetUserQueries
    query.$and = [
      {
        $or: [
          { targetDepartments: { $size: 0 } }, // Empty array targets all departments
          { targetDepartments: userDepartment },
        ],
      },
    ];
  }

  // Get polls that match criteria
  const polls = await Poll.find(query)
    .populate("createdBy", "name userId")
    .sort({ createdAt: -1 });

  // Check if user has already responded to any of these polls
  const pollIds = polls.map((poll) => poll._id);
  const userResponses = await PollResponse.find({
    pollId: { $in: pollIds },
    userId,
  }).distinct("pollId");

  // Add 'hasResponded' flag to each poll
  const pollsWithResponseStatus = polls.map((poll) => {
    const hasResponded = userResponses.some(
      (id) => id.toString() === poll._id.toString()
    );

    // Convert Mongoose document to plain object and add the flag
    const pollObj = poll.toObject();
    pollObj.hasResponded = hasResponded;

    return pollObj;
  });

  return pollsWithResponseStatus;
};

/**
 * Notify users about a new or updated poll
 * @param {object} poll - Poll object
 * @returns {boolean} - Success status
 */
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
  getActivePolls,
};

/**
 * Notify users about a new or updated poll
 * @param {object} poll - Poll object
 * @returns {boolean} - Success status
 */
const notifyUsersAboutPoll = async (poll) => {
  try {
    // Find users to notify based on targetUsers and targetDepartments
    const query = { status: "approved" };

    if (poll.targetUsers !== "all") {
      query.role =
        poll.targetUsers === "residents"
          ? "resident"
          : poll.targetUsers === "staff"
          ? "maintenanceStaff"
          : poll.targetUsers === "admins"
          ? ["superAdmin", "departmentAdmin"]
          : "all";
    }

    if (poll.targetDepartments && poll.targetDepartments.length > 0) {
      query.department = { $in: poll.targetDepartments };
    }

    const users = await User.find(query).select("_id");

    // Send notifications to relevant users
    for (const user of users) {
      await notificationService.sendNotification(
        user._id,
        "New Poll Available",
        `Please take a moment to respond to: ${poll.title}`,
        "poll_notification",
        {
          pollId: poll._id,
          pollTitle: poll.title,
          expiresAt: poll.endDate,
        }
      );
    }

    return true;
  } catch (error) {
    console.error("Error notifying users about poll:", error);
    return false;
  }
};
