const express = require('express');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const multer = require('multer');

const db = require('./database');

const app = express();
const PORT = process.env.PORT || 8743;
const JWT_SECRET = process.env.JWT_SECRET || 'portfolio-admin-secret-key-001';

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/static', express.static(path.join(__dirname, '.')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, 'uploads')),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

app.post('/api/upload', (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) return res.status(400).json({ error: 'Upload failed' });
    if (!req.file) return res.status(400).json({ error: 'No file provided' });
    res.json({ image_path: '/uploads/' + req.file.filename });
  });
});

function authMiddleware(req, res, next) {
  const h = req.headers.authorization;
  if (!h || !h.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' });
  try { req.user = jwt.verify(h.split(' ')[1], JWT_SECRET); next(); }
  catch { res.status(401).json({ error: 'Invalid token' }); }
}

app.use('/api/auth', require('./routes/auth'));
app.use('/api/skills', require('./routes/skills'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/thoughts', require('./routes/thoughts'));
app.use('/api/apps', require('./routes/apps'));
app.use('/api/constructs', require('./routes/constructs'));
app.use('/api/roadmap', require('./routes/roadmap'));
app.use('/api', require('./routes/portfolio'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log(`Portfolio: http://localhost:${PORT}/`);
  console.log(`Admin: http://localhost:${PORT}/admin`);
});

module.exports = app;
