const Complaint = require("../models/Complaint");
const User = require("../models/User");
const mongoose = require("mongoose");
const { sendNotification } = require("../utils/notificationHelper");

// Get all complaints with pagination, filtering and sorting
const getComplaints = async (
  filters = {},
  page = 1,
  limit = 10,
  sortField = "createdAt",
  sortOrder = -1
) => {
  try {
    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: { [sortField]: sortOrder },
      populate: [
        { path: "userId", select: "name email phone" },
        {
          path: "resourceId",
          select: "resourceName resourceType resourceCategory location",
        },
        { path: "assignedAgency", select: "name department" },
        { path: "assignedStaff", select: "name" },
      ],
    };

    const query = {};

    // Apply filters
    if (filters.userId) query.userId = mongoose.Types.ObjectId(filters.userId);
    if (filters.category) query.category = filters.category;
    if (filters.status) query.status = filters.status;
    if (filters.resourceId)
      query.resourceId = mongoose.Types.ObjectId(filters.resourceId);
    if (filters.dateFrom && filters.dateTo) {
      query.createdAt = {
        $gte: new Date(filters.dateFrom),
        $lte: new Date(filters.dateTo),
      };
    }

    const result = await Complaint.paginate(query, options);
    return result;
  } catch (error) {
    throw error;
  }
};

// Get a single complaint by ID
const getComplaintById = async (complaintId) => {
  try {
    const complaint = await Complaint.findById(complaintId)
      .populate("userId", "name email phone")
      .populate(
        "resourceId",
        "resourceName resourceType resourceCategory location"
      )
      .populate("assignedAgency", "name department")
      .populate("assignedStaff", "name")
      .populate("history.updatedBy", "name role");

    if (!complaint) {
      throw new Error("Complaint not found");
    }

    return complaint;
  } catch (error) {
    throw error;
  }
};

// Create a new complaint
const createComplaint = async (complaintData, user) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Create complaint with the userId of the current user
    const complaint = new Complaint({
      ...complaintData,
      userId: user._id,
      status: "pending",
      history: [
        {
          status: "pending",
          updatedBy: user._id,
          notes: "Complaint submitted",
        },
      ],
    });

    await complaint.save({ session });

    // Get maintenance agencies based on complaint category
    let maintenanceAgencies;
    if (complaintData.category === "Misc") {
      // For misc complaints, notification goes to super admin
      maintenanceAgencies = await User.find({
        role: "superAdmin",
        status: "approved",
      }).select("_id");
    } else {
      // For other categories, find matching department agencies
      maintenanceAgencies = await User.find({
        role: "departmentAdmin",
        department: complaintData.category,
        status: "approved",
      }).select("_id");
    }

    // Send notifications to agencies
    for (const agency of maintenanceAgencies) {
      await sendNotification(
        agency._id,
        "New Complaint Received",
        `A new ${complaintData.category} complaint has been submitted: ${complaint.complaintId}`,
        "complaint",
        complaint._id
      );
    }

    await session.commitTransaction();
    session.endSession();

    return complaint;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

// Assign complaint to agency
const assignComplaint = async (complaintId, agencyId, userId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const complaint = await Complaint.findById(complaintId).session(session);
    if (!complaint) {
      throw new Error("Complaint not found");
    }

    // Verify agency exists
    const agency = await User.findOne({
      _id: agencyId,
      role: { $in: ["departmentAdmin", "maintenanceStaff"] },
      status: "approved",
    }).session(session);

    if (!agency) {
      throw new Error("Maintenance agency not found");
    }

    // Update complaint
    complaint.assignedAgency = agencyId;
    complaint.status = "assigned";
    complaint.assignedAt = new Date();
    complaint.history.push({
      status: "assigned",
      updatedBy: userId,
      timestamp: new Date(),
      notes: `Assigned to ${agency.name}`,
    });

    await complaint.save({ session });

    // Notify agency
    await sendNotification(
      agencyId,
      "Complaint Assigned",
      `A complaint ${complaint.complaintId} has been assigned to you`,
      "complaint",
      complaint._id
    );

    // Notify user
    await sendNotification(
      complaint.userId,
      "Complaint Update",
      `Your complaint ${complaint.complaintId} has been assigned to maintenance staff`,
      "complaint",
      complaint._id
    );

    await session.commitTransaction();
    session.endSession();

    return complaint;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

// Assign complaint to staff
const assignToStaff = async (complaintId, staffId, agencyId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const complaint = await Complaint.findById(complaintId).session(session);
    if (!complaint) {
      throw new Error("Complaint not found");
    }

    // Verify staff exists and belongs to agency
    const staff = await User.findOne({
      _id: staffId,
      role: "maintenanceStaff",
      status: "approved",
    }).session(session);

    if (!staff) {
      throw new Error("Maintenance staff not found");
    }

    // Update complaint
    complaint.assignedStaff = staffId;
    complaint.history.push({
      status: complaint.status,
      updatedBy: agencyId,
      timestamp: new Date(),
      notes: `Assigned to staff: ${staff.name}`,
    });

    await complaint.save({ session });

    // Notify staff
    await sendNotification(
      staffId,
      "Complaint Assigned",
      `A complaint ${complaint.complaintId} has been assigned to you`,
      "complaint",
      complaint._id
    );

    await session.commitTransaction();
    session.endSession();

    return complaint;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

// Mark complaint as resolved by maintenance staff/agency
const resolveComplaint = async (complaintId, resolutionNotes, userId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const complaint = await Complaint.findById(complaintId).session(session);
    if (!complaint) {
      throw new Error("Complaint not found");
    }

    if (complaint.status !== "assigned") {
      throw new Error("Complaint must be in assigned status to be resolved");
    }

    // Update complaint
    complaint.status = "resolved";
    complaint.resolvedAt = new Date();
    complaint.resolutionNotes = resolutionNotes;
    complaint.history.push({
      status: "resolved",
      updatedBy: userId,
      timestamp: new Date(),
      notes: resolutionNotes,
    });

    await complaint.save({ session });

    // Notify user
    await sendNotification(
      complaint.userId,
      "Complaint Resolved",
      `Your complaint ${complaint.complaintId} has been resolved. Please provide feedback.`,
      "complaint",
      complaint._id
    );

    await session.commitTransaction();
    session.endSession();

    return complaint;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

// Submit feedback and close complaint or escalate
const submitFeedback = async (complaintId, rating, comment, userId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const complaint = await Complaint.findById(complaintId).session(session);
    if (!complaint) {
      throw new Error("Complaint not found");
    }

    if (complaint.status !== "resolved") {
      throw new Error("Complaint must be resolved before submitting feedback");
    }

    // Add feedback
    complaint.feedback = {
      rating,
      comment,
      submittedAt: new Date(),
    };

    // If satisfied (rating >= 3), close the complaint
    if (rating >= 3) {
      complaint.status = "closed";
      complaint.closedAt = new Date();
      complaint.history.push({
        status: "closed",
        updatedBy: userId,
        timestamp: new Date(),
        notes: `User satisfied with resolution. Rating: ${rating}/5, Comment: ${
          comment || "None"
        }`,
      });

      // Notify agency
      await sendNotification(
        complaint.assignedAgency,
        "Complaint Closed",
        `Complaint ${complaint.complaintId} has been closed with rating: ${rating}/5`,
        "complaint",
        complaint._id
      );
    } else {
      // If not satisfied, escalate the complaint
      complaint.status = "escalated";
      complaint.escalation = {
        escalatedAt: new Date(),
        reason: comment || "User not satisfied with resolution",
      };
      complaint.history.push({
        status: "escalated",
        updatedBy: userId,
        timestamp: new Date(),
        notes: `User not satisfied with resolution. Rating: ${rating}/5, Comment: ${
          comment || "None"
        }`,
      });

      // Find appellate authority (super admin)
      const appellateAuthority = await User.findOne({
        role: "superAdmin",
        status: "approved",
      })
        .select("_id")
        .session(session);

      if (appellateAuthority) {
        complaint.escalation.appellateAuthority = appellateAuthority._id;

        // Notify appellate authority
        await sendNotification(
          appellateAuthority._id,
          "Complaint Escalated",
          `Complaint ${complaint.complaintId} has been escalated due to unsatisfactory resolution`,
          "complaint",
          complaint._id
        );
      }

      // Notify agency
      await sendNotification(
        complaint.assignedAgency,
        "Complaint Escalated",
        `Complaint ${complaint.complaintId} has been escalated. Rating: ${rating}/5`,
        "complaint",
        complaint._id
      );
    }

    await complaint.save({ session });

    await session.commitTransaction();
    session.endSession();

    return complaint;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

// Final resolution by appellate authority
const finalizeComplaint = async (complaintId, resolution, authorityId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const complaint = await Complaint.findById(complaintId).session(session);
    if (!complaint) {
      throw new Error("Complaint not found");
    }

    if (complaint.status !== "escalated") {
      throw new Error("Only escalated complaints can receive final resolution");
    }

    // Update complaint
    complaint.status = "finalResolution";
    complaint.escalation.finalResolution = resolution;
    complaint.escalation.finalResolvedAt = new Date();
    complaint.closedAt = new Date();
    complaint.history.push({
      status: "finalResolution",
      updatedBy: authorityId,
      timestamp: new Date(),
      notes: `Final resolution: ${resolution}`,
    });

    await complaint.save({ session });

    // Notify user
    await sendNotification(
      complaint.userId,
      "Final Resolution",
      `Your escalated complaint ${complaint.complaintId} has received final resolution from the appellate authority`,
      "complaint",
      complaint._id
    );

    // Notify agency
    await sendNotification(
      complaint.assignedAgency,
      "Final Resolution",
      `Escalated complaint ${complaint.complaintId} has received final resolution from the appellate authority`,
      "complaint",
      complaint._id
    );

    await session.commitTransaction();
    session.endSession();

    return complaint;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

// Get complaint statistics
const getComplaintStats = async (filters = {}) => {
  try {
    const matchStage = {};

    // Apply filters
    if (filters.userId)
      matchStage.userId = mongoose.Types.ObjectId(filters.userId);
    if (filters.category) matchStage.category = filters.category;
    if (filters.resourceId)
      matchStage.resourceId = mongoose.Types.ObjectId(filters.resourceId);
    if (filters.dateFrom && filters.dateTo) {
      matchStage.createdAt = {
        $gte: new Date(filters.dateFrom),
        $lte: new Date(filters.dateTo),
      };
    }

    const result = await Complaint.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
          },
          assigned: {
            $sum: { $cond: [{ $eq: ["$status", "assigned"] }, 1, 0] },
          },
          resolved: {
            $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] },
          },
          closed: {
            $sum: { $cond: [{ $eq: ["$status", "closed"] }, 1, 0] },
          },
          escalated: {
            $sum: { $cond: [{ $eq: ["$status", "escalated"] }, 1, 0] },
          },
          finalResolution: {
            $sum: { $cond: [{ $eq: ["$status", "finalResolution"] }, 1, 0] },
          },
          avgRating: {
            $avg: "$feedback.rating",
          },
        },
      },
    ]);

    return (
      result[0] || {
        total: 0,
        pending: 0,
        assigned: 0,
        resolved: 0,
        closed: 0,
        escalated: 0,
        finalResolution: 0,
        avgRating: 0,
      }
    );
  } catch (error) {
    throw error;
  }
};

// Get category-wise complaint distribution
const getCategoryDistribution = async (filters = {}) => {
  try {
    const matchStage = {};

    // Apply filters
    if (filters.userId)
      matchStage.userId = mongoose.Types.ObjectId(filters.userId);
    if (filters.resourceId)
      matchStage.resourceId = mongoose.Types.ObjectId(filters.resourceId);
    if (filters.dateFrom && filters.dateTo) {
      matchStage.createdAt = {
        $gte: new Date(filters.dateFrom),
        $lte: new Date(filters.dateTo),
      };
    }

    const result = await Complaint.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          category: "$_id",
          count: 1,
          _id: 0,
        },
      },
    ]);

    return result;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getComplaints,
  getComplaintById,
  createComplaint,
  assignComplaint,
  assignToStaff,
  resolveComplaint,
  submitFeedback,
  finalizeComplaint,
  getComplaintStats,
  getCategoryDistribution,
};
