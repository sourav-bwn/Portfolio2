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
  const data = db.prepare('SELECT * FROM mastered_apps ORDER BY order_index ASC').all();
  res.json(data);
});

router.post('/', auth, (req, res) => {
  const { name, image_path, order_index } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  const r = db.prepare('INSERT INTO mastered_apps (name, image_path, order_index) VALUES (?, ?, ?)').run(name, image_path || '', order_index || 0);
  res.json({ id: r.lastInsertRowid, name, image_path: image_path || '', order_index: order_index || 0 });
});

router.put('/:id', auth, (req, res) => {
  const { name, image_path, order_index } = req.body;
  db.prepare('UPDATE mastered_apps SET name = COALESCE(?, name), image_path = COALESCE(?, image_path), order_index = COALESCE(?, order_index) WHERE id = ?')
    .run(name, image_path, order_index, req.params.id);
  res.json({ message: 'Updated' });
});

router.delete('/:id', auth, (req, res) => {
  db.prepare('DELETE FROM mastered_apps WHERE id = ?').run(req.params.id);
  res.json({ message: 'Deleted' });
});

module.exports = router;
