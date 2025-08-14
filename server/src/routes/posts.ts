import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin } from '../config/database';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { validatePost } from '../middleware/validation';

const router = express.Router();

// Get feed posts
router.get('/feed', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { page = 1, limit = 10 } = req.query;
  const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

  const { data: posts, error } = await supabaseAdmin
    .from('posts')
    .select(`
      id, type, content, caption, media_url, thumbnail, likes, comments, shares,
      created_at, tags,
      user:user_id(id, name, avatar, profession, is_verified)
    `)
    .order('created_at', { ascending: false })
    .range(offset, offset + parseInt(limit as string) - 1);

  if (error) {
    console.error('Feed fetch error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch feed'
    });
  }

  res.json({
    success: true,
    data: { posts }
  });
}));

// Create post
router.post('/', authenticateToken, validatePost, asyncHandler(async (req: AuthRequest, res) => {
  const { type, content, caption, media_url, thumbnail, tags = [] } = req.body;

  console.log('Creating post:', { type, content, caption, media_url, thumbnail, tags });

  const postId = uuidv4();
  const { data: post, error } = await supabaseAdmin
    .from('posts')
    .insert({
      id: postId,
      user_id: req.user!.id,
      type,
      content,
      caption,
      media_url,
      thumbnail,
      tags,
      likes: 0,
      comments: 0,
      shares: 0,
      created_at: new Date().toISOString()
    })
    .select(`
      id, type, content, caption, media_url, thumbnail, likes, comments, shares,
      created_at, tags,
      user:user_id(id, name, avatar, profession, is_verified)
    `)
    .single();

  if (error) {
    console.error('Post creation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create post'
    });
  }

  console.log('Post created successfully:', post);

  res.status(201).json({
    success: true,
    data: { post }
  });
}));

// Get single post
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { data: post, error } = await supabaseAdmin
    .from('posts')
    .select(`
      id, type, content, caption, media_url, thumbnail, likes, comments, shares,
      created_at, tags,
      user:user_id(id, name, avatar, profession, is_verified)
    `)
    .eq('id', id)
    .single();

  if (error || !post) {
    return res.status(404).json({
      success: false,
      error: 'Post not found'
    });
  }

  res.json({
    success: true,
    data: { post }
  });
}));

// Like/Unlike post
router.post('/:id/like', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;

  // Check if already liked
  const { data: existingLike } = await supabaseAdmin
    .from('post_likes')
    .select('id')
    .eq('post_id', id)
    .eq('user_id', req.user!.id)
    .single();

  if (existingLike) {
    // Unlike
    await supabaseAdmin
      .from('post_likes')
      .delete()
      .eq('post_id', id)
      .eq('user_id', req.user!.id);

    // Decrement likes count
    await supabaseAdmin.rpc('decrement_post_likes', { post_id: id });

    res.json({
      success: true,
      data: { liked: false }
    });
  } else {
    // Like
    await supabaseAdmin
      .from('post_likes')
      .insert({
        id: uuidv4(),
        post_id: id,
        user_id: req.user!.id,
        created_at: new Date().toISOString()
      });

    // Increment likes count
    await supabaseAdmin.rpc('increment_post_likes', { post_id: id });

    res.json({
      success: true,
      data: { liked: true }
    });
  }
}));

// Add comment to post
router.post('/:id/comments', 
  authenticateToken,
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Comment content is required'
      });
    }

    const commentId = uuidv4();
    const { data: comment, error } = await supabaseAdmin
      .from('post_comments')
      .insert({
        id: commentId,
        post_id: id,
        user_id: req.user!.id,
        content: content.trim(),
        created_at: new Date().toISOString()
      })
      .select(`
        id, content, created_at,
        user:user_id(id, name, avatar, profession)
      `)
      .single();

    if (error) {
      console.error('Comment creation error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to add comment'
      });
    }

    // Increment comments count
    await supabaseAdmin.rpc('increment_post_comments', { post_id: id });

    res.status(201).json({
      success: true,
      data: { comment }
    });
  })
);

// Get post comments
router.get('/:id/comments', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 20 } = req.query;

  const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

  const { data: comments, error } = await supabaseAdmin
    .from('post_comments')
    .select(`
      id, content, created_at,
      user:user_id(id, name, avatar, profession)
    `)
    .eq('post_id', id)
    .order('created_at', { ascending: false })
    .range(offset, offset + parseInt(limit as string) - 1);

  if (error) {
    console.error('Comments fetch error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch comments'
    });
  }

  res.json({
    success: true,
    data: { comments }
  });
}));

// Delete post
router.delete('/:id', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;

  // Check if user owns the post
  const { data: post } = await supabaseAdmin
    .from('posts')
    .select('user_id')
    .eq('id', id)
    .single();

  if (!post || post.user_id !== req.user!.id) {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to delete this post'
    });
  }

  const { error } = await supabaseAdmin
    .from('posts')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Post deletion error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete post'
    });
  }

  res.json({
    success: true,
    message: 'Post deleted successfully'
  });
}));

export { router as postRoutes };