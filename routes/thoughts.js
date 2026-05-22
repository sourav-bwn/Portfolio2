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
  const data = db.prepare('SELECT * FROM thought_systems ORDER BY order_index ASC').all();
  res.json(data);
});

router.post('/', auth, (req, res) => {
  const { name, order_index } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  const r = db.prepare('INSERT INTO thought_systems (name, order_index) VALUES (?, ?)').run(name, order_index || 0);
  res.json({ id: r.lastInsertRowid, name, order_index: order_index || 0 });
});

router.put('/:id', auth, (req, res) => {
  const { name, order_index } = req.body;
  db.prepare('UPDATE thought_systems SET name = COALESCE(?, name), order_index = COALESCE(?, order_index) WHERE id = ?')
    .run(name, order_index, req.params.id);
  res.json({ message: 'Updated' });
});

router.delete('/:id', auth, (req, res) => {
  db.prepare('DELETE FROM thought_systems WHERE id = ?').run(req.params.id);
  res.json({ message: 'Deleted' });
});

module.exports = router;
