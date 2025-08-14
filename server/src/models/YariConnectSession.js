const mongoose = require('mongoose');

const yariConnectSessionSchema = new mongoose.Schema({
  user1Id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  user2Id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  endedAt: Date,
  duration: {
    type: Number,
    default: 0 // in seconds
  },
  status: {
    type: String,
    default: 'active',
    enum: ['active', 'ended']
  }
}, {
  timestamps: true
});

// Indexes for better performance
yariConnectSessionSchema.index({ user1Id: 1, startedAt: -1 });
yariConnectSessionSchema.index({ user2Id: 1, startedAt: -1 });
yariConnectSessionSchema.index({ status: 1 });

// Validation to prevent self-sessions
yariConnectSessionSchema.pre('save', function(next) {
  if (this.user1Id.equals(this.user2Id)) {
    next(new Error('Cannot start session with yourself'));
  } else {
    next();
  }
});

module.exports = mongoose.model('YariConnectSession', yariConnectSessionSchema);