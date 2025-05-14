const mongoose = require('mongoose');

const pollResponseSchema = new mongoose.Schema({
  pollId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Poll',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  selectedOptions: [{
    type: mongoose.Schema.Types.ObjectId
  }],
  responseText: {
    type: String,
    trim: true
  },
  deviceInfo: {
    type: String,
    trim: true
  },
  ipAddress: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Compound index to ensure a user can't vote multiple times for the same poll
pollResponseSchema.index({ pollId: 1, userId: 1 }, { unique: true });

const PollResponse = mongoose.model('PollResponse', pollResponseSchema);
module.exports = PollResponse;