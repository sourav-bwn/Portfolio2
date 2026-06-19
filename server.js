require('dotenv').config();
require('express-async-errors');

const express = require('express');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { supabase, BUCKET_NAME } = require('./supabase');

const app = express();
const PORT = process.env.PORT || 8743;
const JWT_SECRET = process.env.JWT_SECRET || 'portfolio2-jwt-secret-change-me';

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ── Multer config for memory storage (we upload to Supabase directly) ──
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only PNG, JPEG, GIF, WebP allowed'));
  }
});

// ── Auth Middleware ──
function authMiddleware(req, res, next) {
  const h = req.headers.authorization;
  if (!h || !h.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    req.user = jwt.verify(h.split(' ')[1], JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// ── Upload helper ──
async function uploadToSupabase(file, folder = '') {
  const ext = file.originalname.split('.').pop();
  const filename = `${folder ? folder + '/' : ''}${Date.now()}-${uuidv4()}.${ext}`;
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filename, file.buffer, {
      contentType: file.mimetype,
      upsert: false
    });
  if (error) throw new Error('Upload failed: ' + error.message);
  const { data: { publicUrl } } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filename);
  return publicUrl;
}

// ── Supabase check ──
app.use('/api', (req, res, next) => {
  if (!supabase) return res.status(500).json({ error: 'Database not connected. Check SUPABASE_URL and SUPABASE_SERVICE_KEY.' });
  next();
});

// ══════════════════════════════════════════
//  PUBLIC ENDPOINTS (no auth required)
// ══════════════════════════════════════════

app.get('/api/skills', async (req, res) => {
  const { data, error } = await supabase
    .from('skills')
    .select('*')
    .order('order_index');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

app.get('/api/stats', async (req, res) => {
  const { data, error } = await supabase
    .from('stats')
    .select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

app.get('/api/thought-systems', async (req, res) => {
  const { data, error } = await supabase
    .from('thought_systems')
    .select('*')
    .order('order_index');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

app.get('/api/apps', async (req, res) => {
  const { data, error } = await supabase
    .from('mastered_apps')
    .select('*')
    .order('order_index');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

app.get('/api/projects', async (req, res) => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('order_index');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

app.get('/api/certificates', async (req, res) => {
  const { data, error } = await supabase
    .from('certificates')
    .select('*')
    .order('order_index');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

app.get('/api/roadmap', async (req, res) => {
  const { data, error } = await supabase
    .from('roadmap')
    .select('*')
    .order('order_index');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

app.get('/api/portfolio', async (req, res) => {
  const [
    skills, stats, thoughts, apps,
    projects, certificates, roadmap
  ] = await Promise.all([
    supabase.from('skills').select('*').order('order_index'),
    supabase.from('stats').select('*'),
    supabase.from('thought_systems').select('*').order('order_index'),
    supabase.from('mastered_apps').select('*').order('order_index'),
    supabase.from('projects').select('*').order('order_index'),
    supabase.from('certificates').select('*').order('order_index'),
    supabase.from('roadmap').select('*').order('order_index')
  ]);
  res.json({
    skills: skills.data || [],
    stats: stats.data || [],
    thoughts: thoughts.data || [],
    apps: apps.data || [],
    projects: projects.data || [],
    certificates: certificates.data || [],
    roadmap: roadmap.data || []
  });
});

// ── Auth endpoints ──
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  const bcrypt = require('bcryptjs');
  const { data: user } = await supabase
    .from('admin_users')
    .select('*')
    .eq('username', username)
    .single();
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign(
    { id: user.id, username: user.username },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
  res.json({ token, user: { id: user.id, username: user.username } });
});

app.get('/api/auth/verify', authMiddleware, (req, res) => {
  res.json({ valid: true, user: req.user });
});

app.post('/api/auth/setup', async (req, res) => {
  const bcrypt = require('bcryptjs');
  const username = process.env.ADMIN_USERNAME || 'Sourav';
  const password = process.env.ADMIN_PASSWORD || 'Garai';
  const hash = await bcrypt.hash(password, 10);
  const { error } = await supabase
    .from('admin_users')
    .upsert({ username, password_hash: hash }, { onConflict: 'username' });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Admin user configured' });
});

// ══════════════════════════════════════════
//  PROTECTED CRUD ENDPOINTS
// ══════════════════════════════════════════

// ── Generic CRUD factory ──
function createCrudRoutes(table, allowedFields) {
  const router = express.Router();

  // POST /api/:table
  router.post('/', authMiddleware, async (req, res) => {
    const payload = {};
    allowedFields.forEach(f => {
      if (req.body[f] !== undefined) payload[f] = req.body[f];
    });
    const { data, error } = await supabase
      .from(table)
      .insert(payload)
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  // PUT /api/:table/:id
  router.put('/:id', authMiddleware, async (req, res) => {
    const payload = {};
    allowedFields.forEach(f => {
      if (req.body[f] !== undefined) payload[f] = req.body[f];
    });
    const { data, error } = await supabase
      .from(table)
      .update(payload)
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  // DELETE /api/:table/:id
  router.delete('/:id', authMiddleware, async (req, res) => {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', req.params.id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: 'Deleted' });
  });

  return router;
}

app.use('/api/admin/skills', createCrudRoutes('skills', ['name', 'category', 'icon', 'order_index']));
app.use('/api/admin/stats', createCrudRoutes('stats', ['key', 'value', 'label']));
app.use('/api/admin/thought-systems', createCrudRoutes('thought_systems', ['name', 'order_index']));
app.use('/api/admin/apps', createCrudRoutes('mastered_apps', ['name', 'image_path', 'order_index']));
app.use('/api/admin/roadmap', createCrudRoutes('roadmap', ['year', 'phase', 'description', 'order_index']));
app.use('/api/admin/projects', createCrudRoutes('projects', [
  'tag', 'title', 'description', 'card_num',
  'accent_color', 'link', 'image_url', 'order_index'
]));

// ── Certificates CRUD (with file upload) ──
app.get('/api/admin/certificates', authMiddleware, async (req, res) => {
  const { data, error } = await supabase
    .from('certificates')
    .select('*')
    .order('order_index');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

app.post('/api/admin/certificates', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { title, issuer, date_earned, order_index } = req.body;
    if (!title) return res.status(400).json({ error: 'Title required' });
    let image_url = '';
    if (req.file) {
      image_url = await uploadToSupabase(req.file, 'certificates');
    }
    const { data, error } = await supabase
      .from('certificates')
      .insert({
        title,
        issuer: issuer || '',
        date_earned: date_earned || '',
        image_url,
        order_index: parseInt(order_index) || 0
      })
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/admin/certificates/:id', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { title, issuer, date_earned, order_index } = req.body;
    const payload = {};
    if (title !== undefined) payload.title = title;
    if (issuer !== undefined) payload.issuer = issuer;
    if (date_earned !== undefined) payload.date_earned = date_earned;
    if (order_index !== undefined) payload.order_index = parseInt(order_index);
    if (req.file) {
      payload.image_url = await uploadToSupabase(req.file, 'certificates');
    }
    const { data, error } = await supabase
      .from('certificates')
      .update(payload)
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/admin/certificates/:id', authMiddleware, async (req, res) => {
  const { error } = await supabase
    .from('certificates')
    .delete()
    .eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Deleted' });
});

// ── File upload endpoint (general) ──
app.post('/api/upload', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });
    const url = await uploadToSupabase(req.file, 'uploads');
    res.json({ image_path: url });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ══════════════════════════════════════════
//  ADMIN PANEL ROUTES (EJS)
// ══════════════════════════════════════════

app.get('/admin', (req, res) => {
  res.render('login');
});

app.get('/admin/dashboard', (req, res) => {
  res.render('dashboard', { section: 'dashboard' });
});

app.get('/admin/skills', (req, res) => {
  res.render('dashboard', { section: 'skills' });
});

app.get('/admin/projects', (req, res) => {
  res.render('dashboard', { section: 'projects' });
});

app.get('/admin/certificates', (req, res) => {
  res.render('dashboard', { section: 'certificates' });
});

app.get('/admin/stats', (req, res) => {
  res.render('dashboard', { section: 'stats' });
});

app.get('/admin/thoughts', (req, res) => {
  res.render('dashboard', { section: 'thoughts' });
});

app.get('/admin/apps', (req, res) => {
  res.render('dashboard', { section: 'apps' });
});

app.get('/admin/roadmap', (req, res) => {
  res.render('dashboard', { section: 'roadmap' });
});

// ── Serve frontend ──
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Global error handler ──
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// ── Export for Vercel serverless ──
module.exports = app;

// ── Start (local dev only — Vercel manages the listener) ──
if (!process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`╔═══════════════════════════════════════╗`);
    console.log(`║  Portfolio2 Supabase Edition          ║`);
    console.log(`║  Server: http://0.0.0.0:${PORT}        ║`);
    console.log(`║  Admin:  http://localhost:${PORT}/admin ║`);
    console.log(`╚═══════════════════════════════════════╝`);
  });
}
