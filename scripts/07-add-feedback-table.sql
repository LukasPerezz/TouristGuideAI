-- Create recognition feedback table for improving the detection model
CREATE TABLE IF NOT EXISTS recognition_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  actual_site_id UUID REFERENCES cultural_sites(id) ON DELETE SET NULL,
  recognized_site_id UUID REFERENCES cultural_sites(id) ON DELETE SET NULL,
  is_correct BOOLEAN NOT NULL,
  confidence_score DECIMAL(3,2),
  image_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE recognition_feedback ENABLE ROW LEVEL SECURITY;

-- Users can insert their own feedback
CREATE POLICY "Users can insert their own feedback" ON recognition_feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view their own feedback
CREATE POLICY "Users can view their own feedback" ON recognition_feedback
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can view all feedback
CREATE POLICY "Admins can view all feedback" ON recognition_feedback
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_recognition_feedback_user_id ON recognition_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_recognition_feedback_created_at ON recognition_feedback(created_at);
CREATE INDEX IF NOT EXISTS idx_recognition_feedback_is_correct ON recognition_feedback(is_correct);
