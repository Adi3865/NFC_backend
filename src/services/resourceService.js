const Resource = require('../models/Resource');
const { generateResourceId } = require('../utils/generateId');

/**
 * Create a new resource
 * @param {object} resourceData - Resource data
 * @returns {object} - Created resource
 */
const createResource = async (resourceData) => {
  const { resourceType, resourceName, resourceCategory, location } = resourceData;
  
  const newResource = await Resource.create({
    resourceId: generateResourceId(),
    resourceType,
    resourceName,
    resourceCategory,
    location,
    status: 'active'
  });
  
  return newResource;
};

/**
 * Get all resources with filters
 * @param {object} filters - Filter conditions
 * @returns {Array} - List of resources
 */
const getAllResources = async (filters = {}) => {
  return await Resource.find({ ...filters, status: 'active' })
    .sort({ resourceName: 1 });
};

/**
 * Get resource by ID
 * @param {string} resourceId - Resource ID
 * @returns {object} - Resource object
 */
const getResourceById = async (resourceId) => {
  return await Resource.findById(resourceId);
};

module.exports = {
  createResource,
  getAllResources,
  getResourceById
};