const mongoose = require('mongoose');

const connectionRequestSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    default: '',
    maxlength: 500
  },
  status: {
    type: String,
    default: 'pending',
    enum: ['pending', 'accepted', 'declined']
  }
}, {
  timestamps: true
});

// Indexes for better performance
connectionRequestSchema.index({ receiverId: 1, status: 1 });
connectionRequestSchema.index({ senderId: 1 });

// Validation to prevent self-requests
connectionRequestSchema.pre('save', function(next) {
  if (this.senderId.equals(this.receiverId)) {
    next(new Error('Cannot send connection request to yourself'));
  } else {
    next();
  }
});

module.exports = mongoose.model('ConnectionRequest', connectionRequestSchema);