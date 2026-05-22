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
  const data = db.prepare('SELECT * FROM constructs ORDER BY order_index ASC').all();
  res.json(data);
});

router.post('/', auth, (req, res) => {
  const { tag, title, description, card_num, accent_color, order_index } = req.body;
  if (!tag || !title || !card_num) return res.status(400).json({ error: 'Tag, title, and card_num required' });
  const r = db.prepare('INSERT INTO constructs (tag, title, description, card_num, accent_color, order_index) VALUES (?, ?, ?, ?, ?, ?)')
    .run(tag, title, description || '', card_num, accent_color || '#6366f1', order_index || 0);
  res.json({ id: r.lastInsertRowid, tag, title, description: description || '', card_num, accent_color: accent_color || '#6366f1', order_index: order_index || 0 });
});

router.put('/:id', auth, (req, res) => {
  const { tag, title, description, card_num, accent_color, order_index } = req.body;
  db.prepare(`UPDATE constructs SET
    tag = COALESCE(?, tag), title = COALESCE(?, title), description = COALESCE(?, description),
    card_num = COALESCE(?, card_num), accent_color = COALESCE(?, accent_color), order_index = COALESCE(?, order_index)
    WHERE id = ?`).run(tag, title, description, card_num, accent_color, order_index, req.params.id);
  res.json({ message: 'Updated' });
});

router.delete('/:id', auth, (req, res) => {
  db.prepare('DELETE FROM constructs WHERE id = ?').run(req.params.id);
  res.json({ message: 'Deleted' });
});

module.exports = router;
