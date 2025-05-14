const asyncHandler = require('express-async-handler');
const resourceService = require('../services/resourceService');

// @desc    Create a new resource
// @route   POST /api/resources
// @access  Private/Admin
const createResource = asyncHandler(async (req, res) => {
  try {
    const resource = await resourceService.createResource(req.body);
    
    res.status(201).json({
      success: true,
      data: resource,
      message: 'Resource created successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get all resources
// @route   GET /api/resources
// @access  Private
const getAllResources = asyncHandler(async (req, res) => {
  const { resourceType, resourceCategory } = req.query;
  const filters = {};
  
  if (resourceType) filters.resourceType = resourceType;
  if (resourceCategory) filters.resourceCategory = resourceCategory;
  
  const resources = await resourceService.getAllResources(filters);
  
  res.status(200).json({
    success: true,
    count: resources.length,
    data: resources
  });
});

// @desc    Get resource by ID
// @route   GET /api/resources/:id
// @access  Private
const getResourceById = asyncHandler(async (req, res) => {
  const resource = await resourceService.getResourceById(req.params.id);
  
  if (!resource) {
    return res.status(404).json({
      success: false,
      message: 'Resource not found'
    });
  }
  
  res.status(200).json({
    success: true,
    data: resource
  });
});

module.exports = {
  createResource,
  getAllResources,
  getResourceById
};