/*
  # GrowthYari Database Schema

  1. New Tables
    - `users` - User profiles and authentication
    - `posts` - User posts (video reels, thoughts, images)
    - `post_likes` - Post likes tracking
    - `post_comments` - Post comments
    - `sessions` - Professional sessions/consultations
    - `connections` - User connections
    - `connection_requests` - Connection requests
    - `yari_connect_sessions` - YariConnect video chat sessions
    - `payments` - Payment transactions
    - `notifications` - User notifications
    - `chat_messages` - Chat messages between users

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for each table

  3. Functions
    - Helper functions for incrementing counters
    - Search functions
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  password text NOT NULL,
  avatar text,
  profession text,
  bio text,
  expertise text[] DEFAULT '{}',
  rating numeric(3,2) DEFAULT 0,
  review_count integer DEFAULT 0,
  is_verified boolean DEFAULT false,
  social_links jsonb DEFAULT '{}',
  location text,
  experience text,
  field text,
  role text DEFAULT 'user',
  sessions_completed integer DEFAULT 0,
  total_earnings numeric(10,2) DEFAULT 0,
  last_login timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Posts table
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('video', 'thought', 'image')),
  content text NOT NULL,
  caption text,
  media_url text,
  thumbnail text,
  tags text[] DEFAULT '{}',
  likes integer DEFAULT 0,
  comments integer DEFAULT 0,
  shares integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Post likes table
CREATE TABLE IF NOT EXISTS post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Post comments table
CREATE TABLE IF NOT EXISTS post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id uuid REFERENCES users(id) ON DELETE CASCADE,
  client_id uuid REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  duration integer NOT NULL, -- in minutes
  price numeric(10,2) NOT NULL DEFAULT 0,
  scheduled_at timestamptz NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  meeting_link text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Connections table
CREATE TABLE IF NOT EXISTS connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id uuid REFERENCES users(id) ON DELETE CASCADE,
  user2_id uuid REFERENCES users(id) ON DELETE CASCADE,
  connected_at timestamptz DEFAULT now(),
  UNIQUE(user1_id, user2_id),
  CHECK (user1_id != user2_id)
);

-- Connection requests table
CREATE TABLE IF NOT EXISTS connection_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES users(id) ON DELETE CASCADE,
  receiver_id uuid REFERENCES users(id) ON DELETE CASCADE,
  message text DEFAULT '',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CHECK (sender_id != receiver_id)
);

-- YariConnect sessions table
CREATE TABLE IF NOT EXISTS yari_connect_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id uuid REFERENCES users(id) ON DELETE CASCADE,
  user2_id uuid REFERENCES users(id) ON DELETE CASCADE,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  duration integer DEFAULT 0, -- in seconds
  status text DEFAULT 'active' CHECK (status IN ('active', 'ended')),
  CHECK (user1_id != user2_id)
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id text PRIMARY KEY, -- Stripe payment intent ID
  session_id uuid REFERENCES sessions(id) ON DELETE CASCADE,
  client_id uuid REFERENCES users(id) ON DELETE CASCADE,
  expert_id uuid REFERENCES users(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL,
  currency text DEFAULT 'usd',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  stripe_payment_intent_id text,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  updated_at timestamptz DEFAULT now()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES users(id) ON DELETE SET NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  data jsonb DEFAULT '{}',
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES users(id) ON DELETE CASCADE,
  recipient_id uuid REFERENCES users(id) ON DELETE CASCADE,
  session_id uuid REFERENCES sessions(id) ON DELETE SET NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  CHECK (sender_id != recipient_id)
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE connection_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE yari_connect_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users policies
CREATE POLICY "Users can view all profiles" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid()::text = id);

-- Posts policies
CREATE POLICY "Anyone can view posts" ON posts FOR SELECT USING (true);
CREATE POLICY "Users can create posts" ON posts FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can update own posts" ON posts FOR UPDATE USING (auth.uid()::text = user_id);
CREATE POLICY "Users can delete own posts" ON posts FOR DELETE USING (auth.uid()::text = user_id);

-- Post likes policies
CREATE POLICY "Anyone can view post likes" ON post_likes FOR SELECT USING (true);
CREATE POLICY "Users can like posts" ON post_likes FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can unlike posts" ON post_likes FOR DELETE USING (auth.uid()::text = user_id);

-- Post comments policies
CREATE POLICY "Anyone can view comments" ON post_comments FOR SELECT USING (true);
CREATE POLICY "Users can create comments" ON post_comments FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can update own comments" ON post_comments FOR UPDATE USING (auth.uid()::text = user_id);
CREATE POLICY "Users can delete own comments" ON post_comments FOR DELETE USING (auth.uid()::text = user_id);

-- Sessions policies
CREATE POLICY "Users can view their sessions" ON sessions FOR SELECT USING (
  auth.uid()::text = expert_id OR auth.uid()::text = client_id
);
CREATE POLICY "Users can create sessions as client" ON sessions FOR INSERT WITH CHECK (auth.uid()::text = client_id);
CREATE POLICY "Users can update their sessions" ON sessions FOR UPDATE USING (
  auth.uid()::text = expert_id OR auth.uid()::text = client_id
);

-- Connections policies
CREATE POLICY "Users can view their connections" ON connections FOR SELECT USING (
  auth.uid()::text = user1_id OR auth.uid()::text = user2_id
);
CREATE POLICY "Users can create connections" ON connections FOR INSERT WITH CHECK (
  auth.uid()::text = user1_id OR auth.uid()::text = user2_id
);
CREATE POLICY "Users can delete their connections" ON connections FOR DELETE USING (
  auth.uid()::text = user1_id OR auth.uid()::text = user2_id
);

-- Connection requests policies
CREATE POLICY "Users can view their connection requests" ON connection_requests FOR SELECT USING (
  auth.uid()::text = sender_id OR auth.uid()::text = receiver_id
);
CREATE POLICY "Users can create connection requests" ON connection_requests FOR INSERT WITH CHECK (auth.uid()::text = sender_id);
CREATE POLICY "Users can update received requests" ON connection_requests FOR UPDATE USING (auth.uid()::text = receiver_id);

-- YariConnect sessions policies
CREATE POLICY "Users can view their YariConnect sessions" ON yari_connect_sessions FOR SELECT USING (
  auth.uid()::text = user1_id OR auth.uid()::text = user2_id
);
CREATE POLICY "Users can create YariConnect sessions" ON yari_connect_sessions FOR INSERT WITH CHECK (
  auth.uid()::text = user1_id OR auth.uid()::text = user2_id
);
CREATE POLICY "Users can update their YariConnect sessions" ON yari_connect_sessions FOR UPDATE USING (
  auth.uid()::text = user1_id OR auth.uid()::text = user2_id
);

-- Payments policies
CREATE POLICY "Users can view their payments" ON payments FOR SELECT USING (
  auth.uid()::text = client_id OR auth.uid()::text = expert_id
);
CREATE POLICY "System can manage payments" ON payments FOR ALL USING (true);

-- Notifications policies
CREATE POLICY "Users can view their notifications" ON notifications FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can update their notifications" ON notifications FOR UPDATE USING (auth.uid()::text = user_id);
CREATE POLICY "Users can delete their notifications" ON notifications FOR DELETE USING (auth.uid()::text = user_id);
CREATE POLICY "System can create notifications" ON notifications FOR INSERT WITH CHECK (true);

-- Chat messages policies
CREATE POLICY "Users can view their messages" ON chat_messages FOR SELECT USING (
  auth.uid()::text = sender_id OR auth.uid()::text = recipient_id
);
CREATE POLICY "Users can send messages" ON chat_messages FOR INSERT WITH CHECK (auth.uid()::text = sender_id);
CREATE POLICY "Users can update received messages" ON chat_messages FOR UPDATE USING (auth.uid()::text = recipient_id);

-- Helper functions
CREATE OR REPLACE FUNCTION increment_post_likes(post_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE posts SET likes = likes + 1 WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_post_likes(post_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE posts SET likes = GREATEST(likes - 1, 0) WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_post_comments(post_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE posts SET comments = comments + 1 WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- Search function for expertise
CREATE OR REPLACE FUNCTION search_expertise(search_term text)
RETURNS TABLE(expertise text) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT unnest(u.expertise) as expertise
  FROM users u
  WHERE unnest(u.expertise) ILIKE '%' || search_term || '%'
  ORDER BY expertise;
END;
$$ LANGUAGE plpgsql;

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_profession ON users(profession);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_type ON posts(type);
CREATE INDEX IF NOT EXISTS idx_sessions_expert_id ON sessions(expert_id);
CREATE INDEX IF NOT EXISTS idx_sessions_client_id ON sessions(client_id);
CREATE INDEX IF NOT EXISTS idx_sessions_scheduled_at ON sessions(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_connections_user1_id ON connections(user1_id);
CREATE INDEX IF NOT EXISTS idx_connections_user2_id ON connections(user2_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_recipient_id ON chat_messages(recipient_id);