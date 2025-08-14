// Core types for the GrowthYari backend
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  profession?: string;
  expertise: string[];
  rating: number;
  review_count: number;
  is_verified: boolean;
  social_links?: {
    linkedin?: string;
    twitter?: string;
    website?: string;
  };
  location?: string;
  experience?: string;
  field?: string;
  role?: string;
  sessions_completed?: number;
  total_earnings?: number;
  created_at: string;
  updated_at?: string;
}

export interface Post {
  id: string;
  user_id: string;
  user?: User;
  type: 'video' | 'thought' | 'image';
  content: string;
  caption?: string;
  media_url?: string;
  thumbnail?: string;
  tags: string[];
  likes: number;
  comments: number;
  shares: number;
  created_at: string;
  updated_at?: string;
}

export interface Session {
  id: string;
  expert_id: string;
  client_id: string;
  expert?: User;
  client?: User;
  title: string;
  description: string;
  duration: number;
  price: number;
  scheduled_at: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  meeting_link?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface Connection {
  id: string;
  user1_id: string;
  user2_id: string;
  user1?: User;
  user2?: User;
  connected_at: string;
}

export interface ConnectionRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  sender?: User;
  receiver?: User;
  message?: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  updated_at?: string;
}

export interface YariConnectSession {
  id: string;
  user1_id: string;
  user2_id: string;
  user1?: User;
  user2?: User;
  started_at: string;
  ended_at?: string;
  duration: number;
  status: 'active' | 'ended';
}

export interface Payment {
  id: string;
  session_id: string;
  client_id: string;
  expert_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  stripe_payment_intent_id?: string;
  created_at: string;
  completed_at?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  sender_id?: string;
  sender?: User;
  type: string;
  title: string;
  message: string;
  data?: any;
  is_read: boolean;
  created_at: string;
  updated_at?: string;
}

export interface ChatMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  session_id?: string;
  message: string;
  is_read: boolean;
  created_at: string;
}