const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
  // Visitor details
  visitorId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  mobileNumber: {
    type: String,
    required: true,
    trim: true
  },
  photo: {
    type: String, // URL or Base64 string
  },
  idCardPhoto: {
    type: String, // URL or Base64 string
  },
  
  // Request details
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  purpose: {
    type: String,
    required: true,
    trim: true
  },
  expectedArrivalTime: {
    type: Date,
    required: true
  },
  expectedDuration: {
    type: Number, // In hours
    default: 2
  },
  
  // Group visitor details
  isGroupVisit: {
    type: Boolean,
    default: false
  },
  groupSize: {
    type: Number,
    default: 1
  },
  additionalVisitors: [{
    name: String,
    mobileNumber: String,
    photo: String
  }],
  
  // Status tracking
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'checked-in', 'checked-out', 'cancelled'],
    default: 'pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvalTime: Date,
  
  // Check-in information
  checkInTime: Date,
  tokenNumber: String, // Generated when checked in
  
  // Check-out information
  checkOutTime: Date,
  tokenReturned: {
    type: Boolean,
    default: false
  },
  
  // Additional information
  remarks: String,
  isBlacklisted: {
    type: Boolean,
    default: false
  },
  blacklistedReason: String
}, {
  timestamps: true
});

// Index for efficient queries
visitorSchema.index({ requestedBy: 1, status: 1 });
visitorSchema.index({ mobileNumber: 1 });
visitorSchema.index({ status: 1, createdAt: -1 });

const Visitor = mongoose.model('Visitor', visitorSchema);
module.exports = Visitor;