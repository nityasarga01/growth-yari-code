/*
  # Availability Management System

  1. New Tables
    - `availability_slots` - Expert availability slots with pricing
    - `availability_settings` - Expert availability preferences

  2. Security
    - Enable RLS on new tables
    - Add policies for experts to manage their availability
    - Allow users to view expert availability

  3. Features
    - Time slot management with pricing
    - Free session availability toggle
    - Recurring availability patterns
*/

-- Availability settings table
CREATE TABLE IF NOT EXISTS availability_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  offers_free_sessions boolean DEFAULT false,
  free_session_duration integer DEFAULT 30, -- minutes
  default_paid_duration integer DEFAULT 60, -- minutes
  default_paid_price numeric(10,2) DEFAULT 75,
  timezone text DEFAULT 'UTC',
  buffer_time integer DEFAULT 15, -- minutes between sessions
  advance_booking_days integer DEFAULT 30, -- how far in advance can people book
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Availability slots table
CREATE TABLE IF NOT EXISTS availability_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  slot_type text NOT NULL CHECK (slot_type IN ('free', 'paid', 'blocked')),
  price numeric(10,2) DEFAULT 0,
  duration integer NOT NULL, -- minutes
  is_booked boolean DEFAULT false,
  booked_by uuid REFERENCES users(id) ON DELETE SET NULL,
  session_id uuid REFERENCES sessions(id) ON DELETE SET NULL,
  is_recurring boolean DEFAULT false,
  recurring_pattern text, -- 'weekly', 'daily', etc.
  recurring_until date,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE availability_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;

-- Availability settings policies
CREATE POLICY "Users can view all availability settings" ON availability_settings FOR SELECT USING (true);
CREATE POLICY "Users can manage own availability settings" ON availability_settings FOR ALL USING (auth.uid()::text = user_id);

-- Availability slots policies
CREATE POLICY "Users can view all availability slots" ON availability_slots FOR SELECT USING (true);
CREATE POLICY "Users can manage own availability slots" ON availability_slots FOR ALL USING (auth.uid()::text = user_id);
CREATE POLICY "Users can book available slots" ON availability_slots FOR UPDATE USING (
  slot_type != 'blocked' AND NOT is_booked AND auth.uid()::text != user_id
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_availability_slots_user_date ON availability_slots(user_id, date);
CREATE INDEX IF NOT EXISTS idx_availability_slots_date_time ON availability_slots(date, start_time);
CREATE INDEX IF NOT EXISTS idx_availability_slots_booked ON availability_slots(is_booked);
CREATE INDEX IF NOT EXISTS idx_availability_settings_user ON availability_settings(user_id);

-- Function to get available slots for an expert
CREATE OR REPLACE FUNCTION get_expert_available_slots(
  expert_id uuid,
  start_date date DEFAULT CURRENT_DATE,
  end_date date DEFAULT CURRENT_DATE + INTERVAL '30 days'
)
RETURNS TABLE(
  slot_id uuid,
  slot_date date,
  start_time time,
  end_time time,
  slot_type text,
  price numeric,
  duration integer,
  is_available boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id as slot_id,
    a.date as slot_date,
    a.start_time,
    a.end_time,
    a.slot_type,
    a.price,
    a.duration,
    (NOT a.is_booked AND a.date >= CURRENT_DATE) as is_available
  FROM availability_slots a
  WHERE a.user_id = expert_id
    AND a.date BETWEEN start_date AND end_date
    AND a.slot_type IN ('free', 'paid')
  ORDER BY a.date, a.start_time;
END;
$$ LANGUAGE plpgsql;