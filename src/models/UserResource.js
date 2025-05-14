const mongoose = require('mongoose');

const userResourceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resource',
    required: true
  },
  isPrimary: {
    type: Boolean,
    default: false
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date
}, {
  timestamps: true
});

// Compound index to ensure a user can't have the same resource multiple times
userResourceSchema.index({ userId: 1, resourceId: 1 }, { unique: true });

const UserResource = mongoose.model('UserResource', userResourceSchema);
module.exports = UserResource;