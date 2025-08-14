const express = require('express');
const User = require('../models/User');
const { isConnected, getMockDB } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Search users
router.get('/', async (req, res) => {
  try {
    const { q, profession, expertise, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    if (isConnected()) {
      let query = {};

      // Text search
      if (q) {
        query.$or = [
          { name: { $regex: q, $options: 'i' } },
          { profession: { $regex: q, $options: 'i' } },
          { bio: { $regex: q, $options: 'i' } }
        ];
      }

      // Filter by profession
      if (profession) {
        query.profession = { $regex: profession, $options: 'i' };
      }

      // Filter by expertise
      if (expertise) {
        query.expertise = { $in: [expertise] };
      }

      const users = await User.find(query)
        .select('name avatar profession bio expertise rating reviewCount isVerified')
        .skip(skip)
        .limit(parseInt(limit));

      const formattedUsers = users.map(user => ({
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

      return res.json({
        success: true,
        data: { users: formattedUsers }
      });
    } else {
      // Mock users for development
      const mockUsers = [
        {
          id: '1',
          name: 'Sarah Johnson',
          email: 'sarah@example.com',
          avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
          profession: 'UX Designer',
          bio: 'Senior UX Designer with 8+ years experience',
          expertise: ['User Experience', 'Design Systems', 'Prototyping'],
          rating: 4.9,
          reviewCount: 42,
          isVerified: true
        },
        {
          id: '2',
          name: 'Mike Chen',
          email: 'mike@example.com',
          avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
          profession: 'Product Manager',
          bio: 'Product Manager at tech startup',
          expertise: ['Product Strategy', 'Agile', 'Data Analysis'],
          rating: 4.7,
          reviewCount: 28,
          isVerified: true
        },
        {
          id: '3',
          name: 'Emily Rodriguez',
          email: 'emily@example.com',
          avatar: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
          profession: 'Marketing Director',
          bio: 'Marketing Director with growth focus',
          expertise: ['Digital Marketing', 'Brand Strategy', 'Content Marketing'],
          rating: 4.8,
          reviewCount: 35,
          isVerified: true
        }
      ];

      return res.json({
        success: true,
        data: { users: mockUsers }
      });
    }
  } catch (error) {
    console.error('User search error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search users'
    });
  }
});

module.exports = router;