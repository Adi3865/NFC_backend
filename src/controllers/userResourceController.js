const asyncHandler = require('express-async-handler');
const userResourceService = require('../services/userResourceService');

// @desc    Request resource allocation
// @route   POST /api/user-resources
// @access  Private
const requestResourceAllocation = asyncHandler(async (req, res) => {
  try {
    const { resourceId, isPrimary = false } = req.body;
    const userResource = await userResourceService.requestResourceAllocation(
      req.user._id,
      resourceId,
      isPrimary
    );
    
    res.status(201).json({
      success: true,
      data: userResource,
      message: 'Resource allocation requested successfully. Awaiting approval.'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get my resources
// @route   GET /api/user-resources/my
// @access  Private
const getMyResources = asyncHandler(async (req, res) => {
  const resources = await userResourceService.getUserResources(req.user._id);
  
  res.status(200).json({
    success: true,
    count: resources.length,
    data: resources
  });
});

// @desc    Get pending resource allocations
// @route   GET /api/user-resources/pending
// @access  Private/Admin
const getPendingAllocations = asyncHandler(async (req, res) => {
  const allocations = await userResourceService.getPendingAllocations();
  
  res.status(200).json({
    success: true,
    count: allocations.length,
    data: allocations
  });
});

// @desc    Approve resource allocation
// @route   PUT /api/user-resources/:id/approve
// @access  Private/Admin
const approveAllocation = asyncHandler(async (req, res) => {
  try {
    const allocation = await userResourceService.updateAllocationStatus(
      req.params.id,
      'approved',
      req.user._id
    );
    
    res.status(200).json({
      success: true,
      data: allocation,
      message: 'Resource allocation approved successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Reject resource allocation
// @route   PUT /api/user-resources/:id/reject
// @access  Private/Admin
const rejectAllocation = asyncHandler(async (req, res) => {
  try {
    const allocation = await userResourceService.updateAllocationStatus(
      req.params.id,
      'rejected',
      req.user._id
    );
    
    res.status(200).json({
      success: true,
      data: allocation,
      message: 'Resource allocation rejected'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = {
  requestResourceAllocation,
  getMyResources,
  getPendingAllocations,
  approveAllocation,
  rejectAllocation
};