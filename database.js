const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const db = new Database(path.join(__dirname, 'portfolio.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function seed() {
  const adminCount = db.prepare('SELECT COUNT(*) as count FROM admin_users').get();
  if (adminCount.count === 0) {
    const hash = bcrypt.hashSync('Garai', 10);
    db.prepare('INSERT INTO admin_users (username, password_hash) VALUES (?, ?)').run('Sourav', hash);
  }

  const statCount = db.prepare('SELECT COUNT(*) as count FROM stats').get();
  if (statCount.count === 0) {
    const insertStat = db.prepare('INSERT INTO stats (key, value, label) VALUES (?, ?, ?)');
    insertStat.run('projects_built', 50, 'Projects Built');
    insertStat.run('core_skills', 14, 'Core Skills');
    insertStat.run('tools_mastered', 7, 'Tools Mastered');
  }

  const skillCount = db.prepare('SELECT COUNT(*) as count FROM skills').get();
  if (skillCount.count === 0) {
    const skills = [
      'Autonomous AI Agents', 'Visual Design', 'Creative Technology', 'Motion Design',
      'Cinematic Grading · 001', 'Frontend Engineering', 'AI Systems', 'Storytelling',
      'Interface Architecture', 'Audience Psychology', 'Prompt Engineering', 'Brand Identity',
      'Systems Thinking', 'Future Vision'
    ];
    const insertSkill = db.prepare('INSERT INTO skills (name, order_index) VALUES (?, ?)');
    skills.forEach((name, i) => insertSkill.run(name, i));
  }

  const tsCount = db.prepare('SELECT COUNT(*) as count FROM thought_systems').get();
  if (tsCount.count === 0) {
    const systems = [
      'Autonomous AI Agents', 'Visual Design', 'Creative Technology', 'Motion Design',
      'Cinematic Grading · 001', 'Frontend Engineering', 'AI Systems', 'Storytelling',
      'Interface Architecture', 'Audience Psychology', 'Prompt Engineering', 'Brand Identity',
      'Systems Thinking', 'Future Vision'
    ];
    const insertTS = db.prepare('INSERT INTO thought_systems (name, order_index) VALUES (?, ?)');
    systems.forEach((name, i) => insertTS.run(name, i));
  }

  const appCount = db.prepare('SELECT COUNT(*) as count FROM mastered_apps').get();
  if (appCount.count === 0) {
    const apps = ['Photoshop', 'Illustrator', 'Premiere Pro', 'After Effects', 'Lightroom', 'Figma', 'Canva', 'CapCut', 'PicsArt'];
    const insertApp = db.prepare('INSERT INTO mastered_apps (name, image_path, order_index) VALUES (?, ?, ?)');
    apps.forEach((name, i) => insertApp.run(name, '', i));
  }

  const constructCount = db.prepare('SELECT COUNT(*) as count FROM constructs').get();
  if (constructCount.count === 0) {
    const constructs = [
      { tag: 'SYSTEMS', title: 'AI Metaverse Portfolio OS', description: 'An immersive operating system serving as a portfolio, blurring the line between a website and a digital entity.', card_num: '01', color: '#6366f1' },
      { tag: 'API', title: 'API-Based AI Application', description: 'Connecting disparate intelligence systems into a unified, responsive interface.', card_num: '02', color: '#8b5cf6' },
      { tag: 'LOCAL', title: 'Offline AI System', description: 'A contained, secure intelligence network capable of autonomous operations without external connectivity.', card_num: '03', color: '#ec4899' },
      { tag: 'GAMIFICATION', title: 'AI Study-to-Game Engine', description: 'Transforming complex educational concepts into interactive, playable experiences using generative logic.', card_num: '04', color: '#f59e0b' },
      { tag: 'MOBILE', title: 'Autonomous Android Agentic AI App', description: 'An intelligent pocket system that manages tasks and executes decisions independently.', card_num: '05', color: '#10b981' },
      { tag: 'MEDIA', title: 'AI Video Automation System', description: 'Streamlining the production pipeline by algorithmically editing and composing cinematic sequences.', card_num: '06', color: '#3b82f6' },
      { tag: 'CONCEPTS', title: 'Fictional Portfolio Website Concepts', description: 'Experimental layouts envisioning the future of digital presence and identity.', card_num: '07', color: '#8b5cf6' },
      { tag: 'ART', title: 'Anime Portrait Transformation Workflow', description: 'A specialized generative pipeline maintaining stylistic consistency across varying inputs.', card_num: '08', color: '#ec4899' },
      { tag: 'DESIGN', title: '3D Minimal Visual Design Concepts', description: 'Spatial explorations emphasizing negative space and atmospheric lighting.', card_num: '09', color: '#06b6d4' },
      { tag: 'VISION', title: 'Custom "001 Code" Color Grading Preset', description: 'A proprietary visual language defining a distinct cinematic mood.', card_num: '10', color: '#f59e0b' },
      { tag: 'EDUCATION', title: 'Interactive Educational Content System', description: 'Dynamic learning environments that adapt to the user\'s cognitive pace.', card_num: '11', color: '#10b981' },
      { tag: 'BRANDING', title: 'AI-Based Personal Branding Identity', description: 'Algorithmic generation of cohesive visual assets aligned with a core narrative.', card_num: '12', color: '#6366f1' },
      { tag: 'ARCHITECTURE', title: 'Advanced Portfolio Architecture Planning', description: 'Structural blueprints for scalable, immersive digital experiences.', card_num: '13', color: '#3b82f6' },
      { tag: 'DEV', title: 'GitHub Web Deployment Workflow', description: 'Automated, continuous integration pipelines ensuring seamless system updates.', card_num: '14', color: '#ef4444' }
    ];
    const insertConstruct = db.prepare('INSERT INTO constructs (tag, title, description, card_num, accent_color, order_index) VALUES (?, ?, ?, ?, ?, ?)');
    constructs.forEach((c, i) => insertConstruct.run(c.tag, c.title, c.description, c.card_num, c.color, i));
  }

  const roadmapCount = db.prepare('SELECT COUNT(*) as count FROM roadmap').get();
  if (roadmapCount.count === 0) {
    const roadmap = [
      { year: 2021, phase: 'First Contact', description: 'Discovered the digital world and became obsessed with technology.' },
      { year: 2022, phase: 'Shadow Protocol', description: 'Learned ethical hacking and cybersecurity systems.' },
      { year: 2023, phase: 'Code Awakening', description: 'Started freelancing and building with code.' },
      { year: 2024, phase: 'Creator Expansion', description: 'Expanded into software, web design, and animation.' },
      { year: 2025, phase: 'AI Ascension', description: 'Entered the world of Artificial Intelligence.' },
      { year: 2026, phase: 'Intelligence Integration', description: 'Integrated AI into futuristic digital experiences.' }
    ];
    const insertRoadmap = db.prepare('INSERT INTO roadmap (year, phase, description, order_index) VALUES (?, ?, ?, ?)');
    roadmap.forEach((r, i) => insertRoadmap.run(r.year, r.phase, r.description, i));
  }
}

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      order_index INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value INTEGER NOT NULL DEFAULT 0,
      label TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS thought_systems (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      order_index INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS mastered_apps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      image_path TEXT DEFAULT '',
      order_index INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS constructs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tag TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      card_num TEXT NOT NULL,
      accent_color TEXT DEFAULT '#6366f1',
      order_index INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS roadmap (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      year INTEGER NOT NULL,
      phase TEXT NOT NULL,
      description TEXT DEFAULT '',
      order_index INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  seed();
}

initDatabase();

module.exports = db;
