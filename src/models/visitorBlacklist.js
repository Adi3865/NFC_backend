const mongoose = require('mongoose');

const visitorBlacklistSchema = new mongoose.Schema({
  mobileNumber: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  photo: String,
  reason: {
    type: String,
    required: true
  },
  blockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastVisitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Visitor'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const VisitorBlacklist = mongoose.model('VisitorBlacklist', visitorBlacklistSchema);
module.exports = VisitorBlacklist;