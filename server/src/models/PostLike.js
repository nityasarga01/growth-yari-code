const mongoose = require('mongoose');

const postLikeSchema = new mongoose.Schema({
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Ensure unique likes per user per post
postLikeSchema.index({ postId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('PostLike', postLikeSchema);