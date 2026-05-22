const express = require('express');
const db = require('../database');
const router = express.Router();

router.get('/portfolio', (req, res) => {
  const skills = db.prepare('SELECT * FROM skills ORDER BY order_index ASC').all();
  const stats = db.prepare('SELECT * FROM stats').all();
  const thoughts = db.prepare('SELECT * FROM thought_systems ORDER BY order_index ASC').all();
  const apps = db.prepare('SELECT * FROM mastered_apps ORDER BY order_index ASC').all();
  const constructs = db.prepare('SELECT * FROM constructs ORDER BY order_index ASC').all();
  const roadmap = db.prepare('SELECT * FROM roadmap ORDER BY order_index ASC').all();
  res.json({ skills, stats, thoughts, apps, constructs, roadmap });
});

module.exports = router;
