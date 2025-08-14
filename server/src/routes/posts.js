const express = require('express');
const Post = require('../models/Post');
const PostLike = require('../models/PostLike');
const PostComment = require('../models/PostComment');
const { isConnected, getMockDB } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get feed posts
router.get('/feed', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    if (isConnected()) {
      const posts = await Post.find()
        .populate('userId', 'name avatar profession isVerified')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const formattedPosts = posts.map(post => ({
        id: post._id,
        type: post.type,
        content: post.content,
        caption: post.caption,
        mediaUrl: post.mediaUrl,
        thumbnail: post.thumbnail,
        tags: post.tags,
        likes: post.likes,
        comments: post.comments,
        shares: post.shares,
        createdAt: post.createdAt,
        user: {
          id: post.userId._id,
          name: post.userId.name,
          avatar: post.userId.avatar,
          profession: post.userId.profession,
          isVerified: post.userId.isVerified
        }
      }));

      return res.json({
        success: true,
        data: { posts: formattedPosts }
      });
    } else {
      // Mock posts for development
      const mockPosts = [
        {
          id: '1',
          type: 'thought',
          content: 'Just finished an amazing product strategy session. The key to successful product development is understanding your users deeply and iterating based on real feedback.',
          caption: null,
          tags: ['ProductManagement', 'Strategy', 'UserResearch'],
          likes: 45,
          comments: 12,
          shares: 8,
          createdAt: new Date().toISOString(),
          user: {
            id: '1',
            name: 'Sarah Johnson',
            avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
            profession: 'UX Designer',
            isVerified: true
          }
        },
        {
          id: '2',
          type: 'thought',
          content: 'The future of work is remote-first, but that doesn\'t mean we should lose the human connection. Building strong team culture in distributed teams requires intentional effort and the right tools.',
          caption: null,
          tags: ['RemoteWork', 'TeamCulture', 'Leadership'],
          likes: 67,
          comments: 23,
          shares: 15,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          user: {
            id: '2',
            name: 'Mike Chen',
            avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
            profession: 'Product Manager',
            isVerified: true
          }
        }
      ];

      return res.json({
        success: true,
        data: { posts: mockPosts }
      });
    }
  } catch (error) {
    console.error('Feed fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch feed'
    });
  }
});

// Create post
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { type, content, caption, media_url, thumbnail, tags = [] } = req.body;

    console.log('Creating post:', { type, content, caption, media_url, thumbnail, tags });

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Content is required'
      });
    }

    if (isConnected()) {
      const post = new Post({
        userId: req.user._id || req.user.id,
        type,
        content,
        caption,
        mediaUrl: media_url,
        thumbnail,
        tags
      });

      await post.save();
      await post.populate('userId', 'name avatar profession isVerified');

      const formattedPost = {
        id: post._id,
        type: post.type,
        content: post.content,
        caption: post.caption,
        mediaUrl: post.mediaUrl,
        media_url: post.mediaUrl, // Include both formats for compatibility
        thumbnail: post.thumbnail,
        tags: post.tags,
        likes: post.likes,
        comments: post.comments,
        shares: post.shares,
        createdAt: post.createdAt,
        user: {
          id: post.userId._id,
          name: post.userId.name,
          avatar: post.userId.avatar,
          profession: post.userId.profession,
          isVerified: post.userId.isVerified
        }
      };

      console.log('Post created successfully:', formattedPost);

      return res.status(201).json({
        success: true,
        data: { post: formattedPost }
      });
    } else {
      // Mock post creation for development
      const mockDB = getMockDB();
      const mockPost = {
        id: 'post-' + Date.now(),
        type,
        content,
        caption,
        mediaUrl,
        media_url: media_url,
        thumbnail,
        tags,
        likes: 0,
        comments: 0,
        shares: 0,
        createdAt: new Date().toISOString(),
        user: req.user
      };

      mockDB.posts.set(mockPost.id, mockPost);

      console.log('Mock post created:', mockPost);

      return res.status(201).json({
        success: true,
        data: { post: mockPost }
      });
    }
  } catch (error) {
    console.error('Post creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create post'
    });
  }
});

// Like/Unlike post
router.post('/:id/like', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;

    if (isConnected()) {
      // Check if already liked
      const existingLike = await PostLike.findOne({ postId: id, userId });

      if (existingLike) {
        // Unlike
        await PostLike.deleteOne({ postId: id, userId });
        await Post.findByIdAndUpdate(id, { $inc: { likes: -1 } });

        res.json({
          success: true,
          data: { liked: false }
        });
      } else {
        // Like
        const like = new PostLike({ postId: id, userId });
        await like.save();
        await Post.findByIdAndUpdate(id, { $inc: { likes: 1 } });

        res.json({
          success: true,
          data: { liked: true }
        });
      }
    } else {
      // Mock like functionality
      res.json({
        success: true,
        data: { liked: true }
      });
    }
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to like post'
    });
  }
});

// Add comment to post
router.post('/:id/comments', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user._id || req.user.id;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Comment content is required'
      });
    }

    if (isConnected()) {
      const comment = new PostComment({
        postId: id,
        userId: userId,
        content: content.trim()
      });

      await comment.save();
      await comment.populate('userId', 'name avatar profession');

      // Increment comment count
      await Post.findByIdAndUpdate(id, { $inc: { comments: 1 } });

      const formattedComment = {
        id: comment._id,
        content: comment.content,
        createdAt: comment.createdAt,
        user: {
          id: comment.userId._id,
          name: comment.userId.name,
          avatar: comment.userId.avatar,
          profession: comment.userId.profession
        }
      };

      return res.status(201).json({
        success: true,
        data: { comment: formattedComment }
      });
    } else {
      // Mock comment for development
      const mockComment = {
        id: 'comment-' + Date.now(),
        content: content.trim(),
        createdAt: new Date().toISOString(),
        user: req.user
      };

      return res.status(201).json({
        success: true,
        data: { comment: mockComment }
      });
    }
  } catch (error) {
    console.error('Comment creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create comment'
    });
  }
});

// Get post comments
router.get('/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    if (isConnected()) {
      const comments = await PostComment.find({ postId: id })
        .populate('userId', 'name avatar profession')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const formattedComments = comments.map(comment => ({
        id: comment._id,
        content: comment.content,
        createdAt: comment.createdAt,
        user: {
          id: comment.userId._id,
          name: comment.userId.name,
          avatar: comment.userId.avatar,
          profession: comment.userId.profession
        }
      }));

      return res.json({
        success: true,
        data: { comments: formattedComments }
      });
    } else {
      // Mock comments for development
      const mockComments = [
        {
          id: '1',
          content: 'Great insights! Thanks for sharing.',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          user: {
            id: '1',
            name: 'John Doe',
            avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&dpr=1',
            profession: 'Software Engineer'
          }
        }
      ];

      return res.json({
        success: true,
        data: { comments: mockComments }
      });
    }
  } catch (error) {
    console.error('Comments fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch comments'
    });
  }
});

module.exports = router;