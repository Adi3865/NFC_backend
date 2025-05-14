const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  resourceId: {
    type: String,
    required: true,
    unique: true
  },
  resourceType: {
    type: String,
    enum: ['personal', 'functional', 'general'],
    required: true
  },
  resourceName: {
    type: String,
    required: true,
    trim: true
  },
  resourceCategory: {
    type: String,
    required: true
  },
  location: {
    block: String,
    sector: String,
    floor: Number
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: true
});

const Resource = mongoose.model('Resource', resourceSchema);
module.exports = Resource;