-- Cultural Tourism App Database Schema

-- Table for storing cultural sites and monuments
CREATE TABLE cultural_sites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    historical_context TEXT,
    cultural_significance TEXT,
    location_country VARCHAR(100),
    location_city VARCHAR(100),
    location_coordinates POINT,
    site_type VARCHAR(50) CHECK (site_type IN ('monument', 'artwork', 'building', 'statue', 'museum', 'church', 'castle', 'other')),
    construction_date VARCHAR(100),
    architect_artist VARCHAR(255),
    image_keywords TEXT[], -- For image recognition matching
    fun_facts TEXT[],
    visitor_tips TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for storing user recognition history
CREATE TABLE user_recognitions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    cultural_site_id UUID REFERENCES cultural_sites(id) ON DELETE CASCADE,
    image_url TEXT,
    recognition_confidence DECIMAL(3,2), -- 0.00 to 1.00
    audio_url TEXT,
    audio_duration INTEGER, -- in seconds
    generated_script TEXT,
    recognized_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for user favorites
CREATE TABLE user_favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    cultural_site_id UUID REFERENCES cultural_sites(id) ON DELETE CASCADE,
    favorited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, cultural_site_id)
);

-- Table for caching generated content to reduce API costs
CREATE TABLE content_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cultural_site_id UUID REFERENCES cultural_sites(id) ON DELETE CASCADE,
    content_type VARCHAR(20) CHECK (content_type IN ('script', 'audio')),
    content_hash VARCHAR(64), -- Hash of input parameters
    content_data TEXT, -- JSON data or URL
    language VARCHAR(5) DEFAULT 'en',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days')
);

-- Indexes for better performance
CREATE INDEX idx_cultural_sites_country ON cultural_sites(location_country);
CREATE INDEX idx_cultural_sites_type ON cultural_sites(site_type);
CREATE INDEX idx_cultural_sites_keywords ON cultural_sites USING GIN(image_keywords);
CREATE INDEX idx_user_recognitions_user ON user_recognitions(user_id);
CREATE INDEX idx_user_recognitions_site ON user_recognitions(cultural_site_id);
CREATE INDEX idx_user_favorites_user ON user_favorites(user_id);
CREATE INDEX idx_content_cache_site ON content_cache(cultural_site_id);
CREATE INDEX idx_content_cache_hash ON content_cache(content_hash);

-- Enable Row Level Security
ALTER TABLE cultural_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_recognitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Cultural sites are public (readable by everyone)
CREATE POLICY "Cultural sites are publicly readable" ON cultural_sites
    FOR SELECT USING (true);

-- Users can only see their own recognitions
CREATE POLICY "Users can view own recognitions" ON user_recognitions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recognitions" ON user_recognitions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only manage their own favorites
CREATE POLICY "Users can view own favorites" ON user_favorites
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites" ON user_favorites
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites" ON user_favorites
    FOR DELETE USING (auth.uid() = user_id);

-- Content cache is publicly readable but only system can write
CREATE POLICY "Content cache is publicly readable" ON content_cache
    FOR SELECT USING (true);
