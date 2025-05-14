const UserResource = require('../models/UserResource');
const Resource = require('../models/Resource');

/**
 * Request resource allocation for a user
 * @param {string} userId - User ID
 * @param {string} resourceId - Resource ID
 * @param {boolean} isPrimary - If this is the primary resource
 * @returns {object} - Created user-resource mapping
 */
const requestResourceAllocation = async (userId, resourceId, isPrimary) => {
  // Verify resource exists
  const resource = await Resource.findById(resourceId);
  if (!resource) {
    throw new Error('Resource not found');
  }
  
  // Check if user already has this resource
  const existingMapping = await UserResource.findOne({ userId, resourceId });
  if (existingMapping) {
    throw new Error('Resource already allocated or pending approval');
  }
  
  // If marked as primary, update all other resources to non-primary
  if (isPrimary) {
    await UserResource.updateMany(
      { userId, approvalStatus: 'approved' },
      { isPrimary: false }
    );
  }
  
  // Create the mapping
  const userResource = await UserResource.create({
    userId,
    resourceId,
    isPrimary,
    approvalStatus: 'pending'
  });
  
  return userResource;
};

/**
 * Get resources allocated to a user
 * @param {string} userId - User ID
 * @returns {Array} - List of resources
 */
const getUserResources = async (userId) => {
  return await UserResource.find({ userId })
    .populate('resourceId')
    .sort({ isPrimary: -1, createdAt: -1 });
};

/**
 * Get pending resource allocations
 * @returns {Array} - List of pending allocations
 */
const getPendingAllocations = async () => {
  return await UserResource.find({ approvalStatus: 'pending' })
    .populate('userId', 'name email userId')
    .populate('resourceId')
    .sort({ createdAt: 1 });
};

/**
 * Approve or reject resource allocation
 * @param {string} mappingId - User-Resource mapping ID
 * @param {string} status - New status ('approved' or 'rejected')
 * @param {string} adminId - Admin user ID
 * @returns {object} - Updated mapping
 */
const updateAllocationStatus = async (mappingId, status, adminId) => {
  const mapping = await UserResource.findById(mappingId);
  
  if (!mapping) {
    throw new Error('Resource allocation request not found');
  }
  
  mapping.approvalStatus = status;
  mapping.approvedBy = adminId;
  mapping.approvedAt = new Date();
  
  await mapping.save();
  
  return mapping;
};

module.exports = {
  requestResourceAllocation,
  getUserResources,
  getPendingAllocations,
  updateAllocationStatus
};