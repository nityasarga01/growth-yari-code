import express from 'express';
import { supabaseAdmin } from '../config/database';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Global search
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
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
  const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
  const searchLimit = parseInt(limit as string);

  const results: any = {};

  try {
    // Search users
    if (type === 'all' || type === 'users') {
      const { data: users, error: usersError } = await supabaseAdmin
        .from('users')
        .select('id, name, avatar, profession, bio, expertise, rating, review_count, is_verified')
        .or(`name.ilike.%${searchQuery}%,profession.ilike.%${searchQuery}%,bio.ilike.%${searchQuery}%`)
        .range(0, searchLimit - 1);

      if (!usersError) {
        results.users = users || [];
      }
    }

    // Search posts
    if (type === 'all' || type === 'posts') {
      const { data: posts, error: postsError } = await supabaseAdmin
        .from('posts')
        .select(`
          id, type, content, caption, media_url, thumbnail, likes, comments, shares,
          created_at, tags,
          user:user_id(id, name, avatar, profession, is_verified)
        `)
        .or(`content.ilike.%${searchQuery}%,caption.ilike.%${searchQuery}%`)
        .order('created_at', { ascending: false })
        .range(0, searchLimit - 1);

      if (!postsError) {
        results.posts = posts || [];
      }
    }

    // Search sessions (upcoming public sessions or session titles)
    if (type === 'all' || type === 'sessions') {
      const { data: sessions, error: sessionsError } = await supabaseAdmin
        .from('sessions')
        .select(`
          id, title, description, duration, price, scheduled_at, status,
          expert:expert_id(id, name, avatar, profession)
        `)
        .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
        .eq('status', 'confirmed')
        .gte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true })
        .range(0, searchLimit - 1);

      if (!sessionsError) {
        results.sessions = sessions || [];
      }
    }

    // If searching for all, limit results per category
    if (type === 'all') {
      const maxPerCategory = Math.floor(searchLimit / 3);
      results.users = results.users?.slice(0, maxPerCategory) || [];
      results.posts = results.posts?.slice(0, maxPerCategory) || [];
      results.sessions = results.sessions?.slice(0, maxPerCategory) || [];
    }

    res.json({
      success: true,
      data: {
        query: searchQuery,
        results,
        total: Object.values(results).reduce((sum: number, arr: any) => sum + (arr?.length || 0), 0)
      }
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      error: 'Search failed'
    });
  }
}));

// Search suggestions/autocomplete
router.get('/suggestions', authenticateToken, asyncHandler(async (req, res) => {
  const { q } = req.query;

  if (!q || typeof q !== 'string' || q.trim().length < 2) {
    return res.json({
      success: true,
      data: { suggestions: [] }
    });
  }

  const searchQuery = q.trim();

  try {
    // Get user name suggestions
    const { data: userSuggestions } = await supabaseAdmin
      .from('users')
      .select('name, profession')
      .ilike('name', `%${searchQuery}%`)
      .limit(5);

    // Get profession suggestions
    const { data: professionSuggestions } = await supabaseAdmin
      .from('users')
      .select('profession')
      .ilike('profession', `%${searchQuery}%`)
      .limit(5);

    // Get expertise suggestions
    const { data: expertiseSuggestions } = await supabaseAdmin
      .rpc('search_expertise', { search_term: searchQuery })
      .limit(5);

    const suggestions = [
      ...(userSuggestions?.map(u => ({ type: 'user', text: u.name, subtitle: u.profession })) || []),
      ...(professionSuggestions?.map(p => ({ type: 'profession', text: p.profession })) || []),
      ...(expertiseSuggestions?.map(e => ({ type: 'expertise', text: e.expertise })) || [])
    ].slice(0, 10);

    res.json({
      success: true,
      data: { suggestions }
    });
  } catch (error) {
    console.error('Suggestions error:', error);
    res.json({
      success: true,
      data: { suggestions: [] }
    });
  }
}));

// Trending searches
router.get('/trending', authenticateToken, asyncHandler(async (req, res) => {
  // This would typically come from analytics/search logs
  // For now, return static trending topics
  const trending = [
    { text: 'UX Design', count: 1250 },
    { text: 'Product Management', count: 980 },
    { text: 'Digital Marketing', count: 875 },
    { text: 'Data Science', count: 720 },
    { text: 'Software Engineering', count: 650 },
    { text: 'Business Strategy', count: 540 },
    { text: 'Leadership', count: 480 },
    { text: 'Entrepreneurship', count: 420 }
  ];

  res.json({
    success: true,
    data: { trending }
  });
}));

export { router as searchRoutes };