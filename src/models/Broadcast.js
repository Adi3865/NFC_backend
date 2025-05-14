const mongoose = require('mongoose');

const broadcastSchema = new mongoose.Schema({
  broadcastId: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  broadcastType: {
    type: String,
    enum: ['emergency', 'announcement', 'maintenance', 'general'],
    default: 'general'
  },
  notificationChannels: {
    app: {
      type: Boolean,
      default: true
    },
    sms: {
      type: Boolean,
      default: false
    }
  },
  targetUsers: {
    type: String,
    enum: ['all', 'residents', 'staff', 'admins'],
    default: 'all'
  },
  targetDepartments: [{
    type: String
  }],
  sentBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  scheduledAt: {
    type: Date
  },
  expiresAt: {
    type: Date
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'sent', 'expired'],
    default: 'draft'
  },
  isSent: {
    type: Boolean,
    default: false
  },
  sentAt: Date,
  deliveryStats: {
    total: {
      type: Number,
      default: 0
    },
    sent: {
      type: Number,
      default: 0
    },
    failed: {
      type: Number,
      default: 0
    }
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
broadcastSchema.index({ status: 1, scheduledAt: 1 });
broadcastSchema.index({ broadcastType: 1, createdAt: -1 });
broadcastSchema.index({ targetUsers: 1, status: 1 });

const Broadcast = mongoose.model('Broadcast', broadcastSchema);
module.exports = Broadcast;