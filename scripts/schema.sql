-- ============================================================
-- Portfolio2 Supabase Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
  id BIGSERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Skills table
CREATE TABLE IF NOT EXISTS skills (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'skill',
  icon TEXT DEFAULT '',
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Stats table
CREATE TABLE IF NOT EXISTS stats (
  id BIGSERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value INTEGER DEFAULT 0,
  label TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Thought systems (the pill skills)
CREATE TABLE IF NOT EXISTS thought_systems (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Mastered apps (tool grid)
CREATE TABLE IF NOT EXISTS mastered_apps (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  image_path TEXT DEFAULT '',
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Projects (constructs)
CREATE TABLE IF NOT EXISTS projects (
  id BIGSERIAL PRIMARY KEY,
  tag TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  card_num TEXT NOT NULL DEFAULT '',
  accent_color TEXT DEFAULT '#6366f1',
  link TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Certificates (NEW)
CREATE TABLE IF NOT EXISTS certificates (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  issuer TEXT NOT NULL DEFAULT '',
  date_earned TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Roadmap
CREATE TABLE IF NOT EXISTS roadmap (
  id BIGSERIAL PRIMARY KEY,
  year INTEGER NOT NULL,
  phase TEXT NOT NULL,
  description TEXT DEFAULT '',
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default admin user (password: Garai)
-- The app will hash this on first run via /api/auth/setup
INSERT INTO admin_users (username, password_hash)
VALUES ('Sourav', '$2a$10$placeholder')
ON CONFLICT (username) DO NOTHING;

-- Seed default stats
INSERT INTO stats (key, value, label)
VALUES
  ('projects_built', 50, 'Projects Built'),
  ('core_skills', 14, 'Core Skills'),
  ('tools_mastered', 7, 'Tools Mastered')
ON CONFLICT (key) DO NOTHING;

-- Seed default skills
INSERT INTO skills (name, category, order_index)
VALUES
  ('Autonomous AI Agents', 'skill', 0),
  ('Visual Design', 'skill', 1),
  ('Creative Technology', 'skill', 2),
  ('Motion Design', 'skill', 3),
  ('Cinematic Grading · 001', 'skill', 4),
  ('Frontend Engineering', 'skill', 5),
  ('AI Systems', 'skill', 6),
  ('Storytelling', 'skill', 7),
  ('Interface Architecture', 'skill', 8),
  ('Audience Psychology', 'skill', 9),
  ('Prompt Engineering', 'skill', 10),
  ('Brand Identity', 'skill', 11),
  ('Systems Thinking', 'skill', 12),
  ('Future Vision', 'skill', 13)
ON CONFLICT DO NOTHING;

-- Seed thought systems
INSERT INTO thought_systems (name, order_index)
VALUES
  ('Autonomous AI Agents', 0),
  ('Visual Design', 1),
  ('Creative Technology', 2),
  ('Motion Design', 3),
  ('Cinematic Grading · 001', 4),
  ('Frontend Engineering', 5),
  ('AI Systems', 6),
  ('Storytelling', 7),
  ('Interface Architecture', 8),
  ('Audience Psychology', 9),
  ('Prompt Engineering', 10),
  ('Brand Identity', 11),
  ('Systems Thinking', 12),
  ('Future Vision', 13)
ON CONFLICT DO NOTHING;

-- Seed mastered apps
INSERT INTO mastered_apps (name, image_path, order_index)
VALUES
  ('Photoshop', '', 0),
  ('Illustrator', '', 1),
  ('Premiere Pro', '', 2),
  ('After Effects', '', 3),
  ('Lightroom', '', 4),
  ('Figma', '', 5),
  ('Canva', '', 6),
  ('CapCut', '', 7),
  ('PicsArt', '', 8)
ON CONFLICT DO NOTHING;

-- Seed projects
INSERT INTO projects (tag, title, description, card_num, accent_color, order_index)
VALUES
  ('SYSTEMS', 'AI Metaverse Portfolio OS', 'An immersive operating system serving as a portfolio, blurring the line between a website and a digital entity.', '01', '#6366f1', 0),
  ('API', 'API-Based AI Application', 'Connecting disparate intelligence systems into a unified, responsive interface.', '02', '#8b5cf6', 1),
  ('LOCAL', 'Offline AI System', 'A contained, secure intelligence network capable of autonomous operations without external connectivity.', '03', '#ec4899', 2),
  ('GAMIFICATION', 'AI Study-to-Game Engine', 'Transforming complex educational concepts into interactive, playable experiences using generative logic.', '04', '#f59e0b', 3),
  ('MOBILE', 'Autonomous Android Agentic AI App', 'An intelligent pocket system that manages tasks and executes decisions independently.', '05', '#10b981', 4),
  ('MEDIA', 'AI Video Automation System', 'Streamlining the production pipeline by algorithmically editing and composing cinematic sequences.', '06', '#3b82f6', 5),
  ('CONCEPTS', 'Fictional Portfolio Website Concepts', 'Experimental layouts envisioning the future of digital presence and identity.', '07', '#8b5cf6', 6),
  ('ART', 'Anime Portrait Transformation Workflow', 'A specialized generative pipeline maintaining stylistic consistency across varying inputs.', '08', '#ec4899', 7),
  ('DESIGN', '3D Minimal Visual Design Concepts', 'Spatial explorations emphasizing negative space and atmospheric lighting.', '09', '#06b6d4', 8),
  ('VISION', 'Custom "001 Code" Color Grading Preset', 'A proprietary visual language defining a distinct cinematic mood.', '10', '#f59e0b', 9),
   ('EDUCATION', 'Interactive Educational Content System', 'Dynamic learning environments that adapt to the user''s cognitive pace.', '11', '#10b981', 10),
  ('BRANDING', 'AI-Based Personal Branding Identity', 'Algorithmic generation of cohesive visual assets aligned with a core narrative.', '12', '#6366f1', 11),
  ('ARCHITECTURE', 'Advanced Portfolio Architecture Planning', 'Structural blueprints for scalable, immersive digital experiences.', '13', '#3b82f6', 12),
  ('DEV', 'GitHub Web Deployment Workflow', 'Automated, continuous integration pipelines ensuring seamless system updates.', '14', '#ef4444', 13)
ON CONFLICT DO NOTHING;

-- Seed roadmap
INSERT INTO roadmap (year, phase, description, order_index)
VALUES
  (2021, 'First Contact', 'Discovered the digital world and became obsessed with technology.', 0),
  (2022, 'Shadow Protocol', 'Learned ethical hacking and cybersecurity systems.', 1),
  (2023, 'Code Awakening', 'Started freelancing and building with code.', 2),
  (2024, 'Creator Expansion', 'Expanded into software, web design, and animation.', 3),
  (2025, 'AI Ascension', 'Entered the world of Artificial Intelligence.', 4),
  (2026, 'Intelligence Integration', 'Integrated AI into futuristic digital experiences.', 5)
ON CONFLICT DO NOTHING;

-- Create certificates storage bucket
-- Run this separately in Supabase Storage:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('certificates', 'certificates', true);
