const express = require('express');
const User = require('../models/User');
const Post = require('../models/Post');
const Session = require('../models/Session');
const { isConnected, getMockDB } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Global search
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      q, 
      type = 'all', // 'users', 'posts', 'sessions', 'all'
      page = 1, 
      limit = 20 
    } = req.query;

    if (!q || typeof q !== 'string' || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    const searchQuery = q.trim();
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const searchLimit = parseInt(limit);

    if (isConnected()) {
      const results = {};

      try {
        // Search users
        if (type === 'all' || type === 'users') {
          const users = await User.find({
            $or: [
              { name: { $regex: searchQuery, $options: 'i' } },
              { profession: { $regex: searchQuery, $options: 'i' } },
              { bio: { $regex: searchQuery, $options: 'i' } }
            ]
          })
          .select('name avatar profession bio expertise rating reviewCount isVerified')
          .limit(searchLimit);

          results.users = users.map(user => ({
            id: user._id,
            name: user.name,
            avatar: user.avatar,
            profession: user.profession,
            bio: user.bio,
            expertise: user.expertise,
            rating: user.rating,
            reviewCount: user.reviewCount,
            isVerified: user.isVerified
          }));
        }

        // Search posts
        if (type === 'all' || type === 'posts') {
          const posts = await Post.find({
            $or: [
              { content: { $regex: searchQuery, $options: 'i' } },
              { caption: { $regex: searchQuery, $options: 'i' } }
            ]
          })
          .populate('userId', 'name avatar profession isVerified')
          .sort({ createdAt: -1 })
          .limit(searchLimit);

          results.posts = posts.map(post => ({
            id: post._id,
            type: post.type,
            content: post.content,
            caption: post.caption,
            mediaUrl: post.mediaUrl,
            thumbnail: post.thumbnail,
            likes: post.likes,
            comments: post.comments,
            shares: post.shares,
            createdAt: post.createdAt,
            tags: post.tags,
            user: {
              id: post.userId._id,
              name: post.userId.name,
              avatar: post.userId.avatar,
              profession: post.userId.profession,
              isVerified: post.userId.isVerified
            }
          }));
        }

        // Search sessions
        if (type === 'all' || type === 'sessions') {
          const sessions = await Session.find({
            $or: [
              { title: { $regex: searchQuery, $options: 'i' } },
              { description: { $regex: searchQuery, $options: 'i' } }
            ],
            status: 'confirmed',
            scheduledAt: { $gte: new Date() }
          })
          .populate('expertId', 'name avatar profession')
          .sort({ scheduledAt: 1 })
          .limit(searchLimit);

          results.sessions = sessions.map(session => ({
            id: session._id,
            title: session.title,
            description: session.description,
            duration: session.duration,
            price: session.price,
            scheduledAt: session.scheduledAt,
            status: session.status,
            expert: {
              id: session.expertId._id,
              name: session.expertId.name,
              avatar: session.expertId.avatar,
              profession: session.expertId.profession
            }
          }));
        }

        // If searching for all, limit results per category
        if (type === 'all') {
          const maxPerCategory = Math.floor(searchLimit / 3);
          results.users = (results.users || []).slice(0, maxPerCategory);
          results.posts = (results.posts || []).slice(0, maxPerCategory);
          results.sessions = (results.sessions || []).slice(0, maxPerCategory);
        }

        const total = Object.values(results).reduce((sum, arr) => sum + (arr?.length || 0), 0);

        res.json({
          success: true,
          data: {
            query: searchQuery,
            results,
            total
          }
        });
      } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({
          success: false,
          error: 'Search failed'
        });
      }
    } else {
      // Mock search results for development
      const mockResults = {
        users: [
          {
            id: '1',
            name: 'Sarah Johnson',
            avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
            profession: 'UX Designer',
            bio: 'Senior UX Designer with 8+ years experience',
            expertise: ['User Experience', 'Design Systems', 'Prototyping'],
            rating: 4.9,
            reviewCount: 42,
            isVerified: true
          }
        ],
        posts: [
          {
            id: '1',
            type: 'thought',
            content: 'The key to successful product development is understanding your users deeply.',
            tags: ['ProductManagement', 'Strategy'],
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
          }
        ],
        sessions: []
      };

      return res.json({
        success: true,
        data: {
          query: searchQuery,
          results: mockResults,
          total: mockResults.users.length + mockResults.posts.length + mockResults.sessions.length
        }
      });
    }
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      error: 'Search failed'
    });
  }
});

module.exports = router;