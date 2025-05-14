const complaintService = require("../services/complaintService");
const { validationResult } = require("express-validator");
const { COMPLAINT_CATEGORIES } = require("../utils/constants");

/**
 * @desc    Create a new complaint
 * @route   POST /api/complaints
 * @access  Private
 */
const createComplaint = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { resourceId, category, subcategory, description, images } = req.body;

    // Validate image count
    if (images && images.length > 2) {
      return res.status(400).json({
        success: false,
        message: "Maximum 2 images allowed per complaint",
      });
    }

    const complaint = await complaintService.createComplaint(
      { resourceId, category, subcategory, description, images },
      req.user
    );

    res.status(201).json({
      success: true,
      data: complaint,
    });
  } catch (error) {
    console.error("Error creating complaint:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

/**
 * @desc    Get all complaints with filtering and pagination
 * @route   GET /api/complaints
 * @access  Private
 */
const getComplaints = async (req, res) => {
  try {
    const {
      userId,
      resourceId,
      category,
      status,
      dateFrom,
      dateTo,
      page,
      limit,
      sortField,
      sortOrder,
    } = req.query;

    // Handle different user roles
    const filters = {};

    if (req.user.role === "resident") {
      // Residents can only see their own complaints
      filters.userId = req.user._id;
    } else if (req.user.role === "departmentAdmin") {
      // Department admins can see complaints assigned to their department
      if (userId) filters.userId = userId;

      // Department admin can only see complaints in their department
      filters.category = req.user.department;
    } else if (req.user.role === "maintenanceStaff") {
      // Maintenance staff can only see complaints assigned to them
      filters.assignedStaff = req.user._id;
    } else {
      // Super admin can see all and filter as needed
      if (userId) filters.userId = userId;
      if (category) filters.category = category;
    }

    // Common filters
    if (resourceId) filters.resourceId = resourceId;
    if (status) filters.status = status;
    if (dateFrom && dateTo) {
      filters.dateFrom = dateFrom;
      filters.dateTo = dateTo;
    }

    const result = await complaintService.getComplaints(
      filters,
      page || 1,
      limit || 10,
      sortField || "createdAt",
      sortOrder || -1
    );

    res.status(200).json({
      success: true,
      count: result.totalDocs,
      totalPages: result.totalPages,
      page: result.page,
      data: result.docs,
    });
  } catch (error) {
    console.error("Error getting complaints:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

/**
 * @desc    Get complaint by ID
 * @route   GET /api/complaints/:id
 * @access  Private
 */
const getComplaintById = async (req, res) => {
  try {
    const complaint = await complaintService.getComplaintById(req.params.id);

    // Authorization check
    if (
      req.user.role === "resident" &&
      complaint.userId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this complaint",
      });
    }

    // Department admins can only access complaints in their department
    if (
      req.user.role === "departmentAdmin" &&
      complaint.category !== req.user.department
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this complaint",
      });
    }

    // Maintenance staff can only access assigned complaints
    if (
      req.user.role === "maintenanceStaff" &&
      (!complaint.assignedStaff ||
        complaint.assignedStaff.toString() !== req.user._id.toString())
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this complaint",
      });
    }

    res.status(200).json({
      success: true,
      data: complaint,
    });
  } catch (error) {
    console.error("Error getting complaint:", error);
    res.status(error.message === "Complaint not found" ? 404 : 500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

/**
 * @desc    Assign complaint to an agency
 * @route   PUT /api/complaints/:id/assign
 * @access  Private (Super Admin, Department Admin)
 */
const assignComplaint = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { agencyId } = req.body;

    const complaint = await complaintService.assignComplaint(
      req.params.id,
      agencyId,
      req.user._id
    );

    res.status(200).json({
      success: true,
      data: complaint,
    });
  } catch (error) {
    console.error("Error assigning complaint:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

/**
 * @desc    Assign complaint to staff
 * @route   PUT /api/complaints/:id/assign-staff
 * @access  Private (Department Admin)
 */
const assignToStaff = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { staffId } = req.body;

    const complaint = await complaintService.assignToStaff(
      req.params.id,
      staffId,
      req.user._id
    );

    res.status(200).json({
      success: true,
      data: complaint,
    });
  } catch (error) {
    console.error("Error assigning complaint to staff:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

/**
 * @desc    Mark complaint as resolved
 * @route   PUT /api/complaints/:id/resolve
 * @access  Private (Maintenance Staff, Department Admin)
 */
const resolveComplaint = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { resolutionNotes } = req.body;

    const complaint = await complaintService.resolveComplaint(
      req.params.id,
      resolutionNotes,
      req.user._id
    );

    res.status(200).json({
      success: true,
      data: complaint,
    });
  } catch (error) {
    console.error("Error resolving complaint:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

/**
 * @desc    Submit feedback for resolved complaint
 * @route   PUT /api/complaints/:id/feedback
 * @access  Private (Resident)
 */
const submitFeedback = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { rating, comment } = req.body;

    // Validate rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    const complaint = await complaintService.submitFeedback(
      req.params.id,
      rating,
      comment,
      req.user._id
    );

    res.status(200).json({
      success: true,
      data: complaint,
    });
  } catch (error) {
    console.error("Error submitting feedback:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

/**
 * @desc    Final resolution by appellate authority
 * @route   PUT /api/complaints/:id/final-resolution
 * @access  Private (Super Admin)
 */
const finalizeComplaint = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { resolution } = req.body;

    const complaint = await complaintService.finalizeComplaint(
      req.params.id,
      resolution,
      req.user._id
    );

    res.status(200).json({
      success: true,
      data: complaint,
    });
  } catch (error) {
    console.error("Error finalizing complaint:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

/**
 * @desc    Get complaint statistics
 * @route   GET /api/complaints/stats
 * @access  Private (Admin roles)
 */
const getComplaintStats = async (req, res) => {
  try {
    const { userId, category, resourceId, dateFrom, dateTo } = req.query;

    // Create filters based on role
    const filters = {};

    if (req.user.role === "departmentAdmin") {
      // Department admin can only see stats for their department
      filters.category = req.user.department;

      if (userId) filters.userId = userId;
    } else if (req.user.role === "resident") {
      // Residents can only see their own stats
      filters.userId = req.user._id;
    } else {
      // Super admin can filter as needed
      if (userId) filters.userId = userId;
      if (category) filters.category = category;
    }

    // Common filters
    if (resourceId) filters.resourceId = resourceId;
    if (dateFrom && dateTo) {
      filters.dateFrom = dateFrom;
      filters.dateTo = dateTo;
    }

    const stats = await complaintService.getComplaintStats(filters);

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error getting complaint stats:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

/**
 * @desc    Get category distribution
 * @route   GET /api/complaints/category-distribution
 * @access  Private (Admin roles)
 */
const getCategoryDistribution = async (req, res) => {
  try {
    const { userId, resourceId, dateFrom, dateTo } = req.query;

    // Create filters based on role
    const filters = {};

    if (req.user.role === "resident") {
      // Residents can only see their own stats
      filters.userId = req.user._id;
    } else {
      // Admins can filter as needed
      if (userId) filters.userId = userId;
    }

    // Common filters
    if (resourceId) filters.resourceId = resourceId;
    if (dateFrom && dateTo) {
      filters.dateFrom = dateFrom;
      filters.dateTo = dateTo;
    }

    const distribution = await complaintService.getCategoryDistribution(
      filters
    );

    res.status(200).json({
      success: true,
      data: distribution,
    });
  } catch (error) {
    console.error("Error getting category distribution:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

/**
 * @desc    Get subcategories for a given category
 * @route   GET /api/complaints/subcategories/:category
 * @access  Private
 */
const getSubcategories = async (req, res) => {
  try {
    const { category } = req.params;

    if (!COMPLAINT_CATEGORIES[category]) {
      return res.status(400).json({
        success: false,
        message: "Invalid category",
      });
    }

    res.status(200).json({
      success: true,
      data: COMPLAINT_CATEGORIES[category],
    });
  } catch (error) {
    console.error("Error getting subcategories:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

/**
 * @desc    Get all categories and subcategories
 * @route   GET /api/complaints/categories
 * @access  Private
 */
const getCategories = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: COMPLAINT_CATEGORIES,
    });
  } catch (error) {
    console.error("Error getting categories:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

module.exports = {
  createComplaint,
  getComplaints,
  getComplaintById,
  assignComplaint,
  assignToStaff,
  resolveComplaint,
  submitFeedback,
  finalizeComplaint,
  getComplaintStats,
  getCategoryDistribution,
  getSubcategories,
  getCategories,
};
