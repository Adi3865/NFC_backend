const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema({
  optionText: {
    type: String,
    required: true,
    trim: true
  },
  count: {
    type: Number,
    default: 0
  }
});

const pollSchema = new mongoose.Schema({
  pollId: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  question: {
    type: String,
    required: true,
    trim: true
  },
  options: [optionSchema],
  allowMultipleSelections: {
    type: Boolean,
    default: false
  },
  targetUsers: {
    type: String,
    enum: ['all', 'residents', 'staff', 'admins'],
    default: 'all'
  },
  targetDepartments: [{
    type: String
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'closed', 'archived'],
    default: 'draft'
  },
  totalResponses: {
    type: Number,
    default: 0
  },
  isAnonymous: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
pollSchema.index({ status: 1, endDate: 1 });
pollSchema.index({ createdBy: 1, createdAt: -1 });
pollSchema.index({ targetUsers: 1, status: 1 });

const Poll = mongoose.model('Poll', pollSchema);
module.exports = Poll;