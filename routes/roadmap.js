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
  const data = db.prepare('SELECT * FROM roadmap ORDER BY order_index ASC').all();
  res.json(data);
});

router.post('/', auth, (req, res) => {
  const { year, phase, description, order_index } = req.body;
  if (!year || !phase) return res.status(400).json({ error: 'Year and phase required' });
  const r = db.prepare('INSERT INTO roadmap (year, phase, description, order_index) VALUES (?, ?, ?, ?)')
    .run(year, phase, description || '', order_index || 0);
  res.json({ id: r.lastInsertRowid, year, phase, description: description || '', order_index: order_index || 0 });
});

router.put('/:id', auth, (req, res) => {
  const { year, phase, description, order_index } = req.body;
  db.prepare('UPDATE roadmap SET year = COALESCE(?, year), phase = COALESCE(?, phase), description = COALESCE(?, description), order_index = COALESCE(?, order_index) WHERE id = ?')
    .run(year, phase, description, order_index, req.params.id);
  res.json({ message: 'Updated' });
});

router.delete('/:id', auth, (req, res) => {
  db.prepare('DELETE FROM roadmap WHERE id = ?').run(req.params.id);
  res.json({ message: 'Deleted' });
});

module.exports = router;
