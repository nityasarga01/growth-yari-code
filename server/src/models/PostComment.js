const mongoose = require('mongoose');

const postCommentSchema = new mongoose.Schema({
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 1000
  }
}, {
  timestamps: true
});

// Index for better performance
postCommentSchema.index({ postId: 1, createdAt: -1 });

module.exports = mongoose.model('PostComment', postCommentSchema);