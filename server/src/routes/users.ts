import express from 'express';
import { supabaseAdmin } from '../config/database';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { body } from 'express-validator';
import { handleValidationErrors } from '../middleware/validation';

const router = express.Router();

// Get user profile
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select(`
      id, name, email, avatar, profession, bio, expertise, rating, review_count, 
      is_verified, social_links, created_at,
      sessions_completed, total_earnings
    `)
    .eq('id', id)
    .single();

  if (error || !user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  res.json({
    success: true,
    data: { user }
  });
}));

// Update user profile
router.put('/profile', 
  authenticateToken,
  [
    body('name').optional().trim().isLength({ min: 2, max: 50 }),
    body('profession').optional().trim().isLength({ max: 100 }),
    body('bio').optional().trim().isLength({ max: 500 }),
    body('expertise').optional().isArray(),
    body('social_links').optional().isObject(),
    handleValidationErrors
  ],
  asyncHandler(async (req: AuthRequest, res) => {
    const { name, profession, bio, expertise, social_links } = req.body;
    
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (profession !== undefined) updateData.profession = profession;
    if (bio !== undefined) updateData.bio = bio;
    if (expertise !== undefined) updateData.expertise = expertise;
    if (social_links !== undefined) updateData.social_links = social_links;
    
    updateData.updated_at = new Date().toISOString();

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', req.user!.id)
      .select('id, name, email, avatar, profession, bio, expertise, rating, review_count, is_verified, social_links')
      .single();

    if (error) {
      console.error('Profile update error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update profile'
      });
    }

    res.json({
      success: true,
      data: { user }
    });
  })
);

// Get user stats
router.get('/:id/stats', asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Get user stats
  const [
    { count: sessionsCount },
    { count: connectionsCount },
    { count: postsCount },
    { data: recentSessions }
  ] = await Promise.all([
    supabaseAdmin.from('sessions').select('*', { count: 'exact', head: true }).eq('expert_id', id).eq('status', 'completed'),
    supabaseAdmin.from('connections').select('*', { count: 'exact', head: true }).or(`user1_id.eq.${id},user2_id.eq.${id}`),
    supabaseAdmin.from('posts').select('*', { count: 'exact', head: true }).eq('user_id', id),
    supabaseAdmin.from('sessions')
      .select('id, title, scheduled_at, status, client:client_id(name, avatar)')
      .eq('expert_id', id)
      .order('scheduled_at', { ascending: false })
      .limit(5)
  ]);

  res.json({
    success: true,
    data: {
      stats: {
        sessions_completed: sessionsCount || 0,
        connections: connectionsCount || 0,
        posts: postsCount || 0
      },
      recent_sessions: recentSessions || []
    }
  });
}));

// Search users
router.get('/', asyncHandler(async (req, res) => {
  const { 
    q, 
    profession, 
    expertise, 
    location,
    field,
    experience,
    rating, 
    verified,
    page = 1, 
    limit = 20 
  } = req.query;

  let query = supabaseAdmin
    .from('users')
    .select('id, name, avatar, profession, bio, expertise, rating, review_count, is_verified');

  // Text search
  if (q) {
    query = query.or(`name.ilike.%${q}%,profession.ilike.%${q}%,bio.ilike.%${q}%`);
  }

  // Filter by profession
  if (profession) {
    query = query.ilike('profession', `%${profession}%`);
  }

  // Filter by expertise
  if (expertise) {
    query = query.contains('expertise', [expertise]);
  }

  // Filter by location
  if (location && location !== 'Remote/Global') {
    query = query.ilike('location', `%${location}%`);
  }

  // Filter by field
  if (field) {
    query = query.eq('field', field);
  }

  // Filter by experience
  if (experience) {
    query = query.ilike('experience', `%${experience}%`);
  }

  // Filter by rating
  if (rating) {
    query = query.gte('rating', parseFloat(rating as string));
  }

  // Filter by verified status
  if (verified === 'true') {
    query = query.eq('is_verified', true);
  }

  // Pagination
  const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
  query = query.range(offset, offset + parseInt(limit as string) - 1);

  const { data: users, error } = await query;

  if (error) {
    console.error('User search error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to search users'
    });
  }

  res.json({
    success: true,
    data: {
      users,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: users?.length || 0
      }
    }
  });
}));

// Get user's posts
router.get('/:id/posts', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

  const { data: posts, error } = await supabaseAdmin
    .from('posts')
    .select(`
      id, type, content, caption, media_url, thumbnail, likes, comments, shares,
      created_at, tags,
      user:user_id(id, name, avatar, profession, is_verified)
    `)
    .eq('user_id', id)
    .order('created_at', { ascending: false })
    .range(offset, offset + parseInt(limit as string) - 1);

  if (error) {
    console.error('Posts fetch error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch posts'
    });
  }

  res.json({
    success: true,
    data: { posts }
  });
}));

export { router as userRoutes };