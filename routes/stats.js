const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../database');
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'portfolio-admin-secret-key-001';

function auth(req, res, next) {
  const h = req.headers.authorization;
  if (!h || !h.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' });
  try { req.user = jwt.verify(h.split(' ')[1], JWT_SECRET); next(); }
  catch { res.status(401).json({ error: 'Invalid token' }); }
}

router.get('/', (req, res) => {
  const data = db.prepare('SELECT * FROM stats').all();
  res.json(data);
});

router.post('/', auth, (req, res) => {
  const { key, value, label } = req.body;
  if (!key || !label) return res.status(400).json({ error: 'Key and label required' });
  const r = db.prepare('INSERT INTO stats (key, value, label) VALUES (?, ?, ?)').run(key, value || 0, label);
  res.json({ id: r.lastInsertRowid, key, value: value || 0, label });
});

router.put('/:id', auth, (req, res) => {
  const { key, value, label } = req.body;
  db.prepare('UPDATE stats SET key = COALESCE(?, key), value = COALESCE(?, value), label = COALESCE(?, label) WHERE id = ?')
    .run(key, value, label, req.params.id);
  res.json({ message: 'Updated' });
});

router.delete('/:id', auth, (req, res) => {
  db.prepare('DELETE FROM stats WHERE id = ?').run(req.params.id);
  res.json({ message: 'Deleted' });
});

module.exports = router;
