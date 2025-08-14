const mongoose = require('mongoose');

const connectionSchema = new mongoose.Schema({
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
  connectedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Ensure unique connections and prevent self-connections
connectionSchema.index({ user1Id: 1, user2Id: 1 }, { unique: true });

// Validation to prevent self-connections
connectionSchema.pre('save', function(next) {
  if (this.user1Id.equals(this.user2Id)) {
    next(new Error('Cannot connect to yourself'));
  } else {
    next();
  }
});

module.exports = mongoose.model('Connection', connectionSchema);