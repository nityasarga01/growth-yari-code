const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session'
  },
  message: {
    type: String,
    required: true,
    maxlength: 1000
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for better performance
chatMessageSchema.index({ senderId: 1, recipientId: 1, createdAt: -1 });
chatMessageSchema.index({ recipientId: 1, isRead: 1 });

// Validation to prevent self-messages
chatMessageSchema.pre('save', function(next) {
  if (this.senderId.equals(this.recipientId)) {
    next(new Error('Cannot send message to yourself'));
  } else {
    next();
  }
});

module.exports = mongoose.model('ChatMessage', chatMessageSchema);