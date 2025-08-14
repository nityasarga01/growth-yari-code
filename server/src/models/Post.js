const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['video', 'thought', 'image']
  },
  content: {
    type: String,
    required: true,
    maxlength: 2000
  },
  caption: {
    type: String,
    maxlength: 500
  },
  mediaUrl: String,
  thumbnail: String,
  tags: [{
    type: String,
    trim: true
  }],
  likes: {
    type: Number,
    default: 0
  },
  comments: {
    type: Number,
    default: 0
  },
  shares: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for better performance
postSchema.index({ userId: 1, createdAt: -1 });
postSchema.index({ type: 1 });
postSchema.index({ tags: 1 });

module.exports = mongoose.model('Post', postSchema);