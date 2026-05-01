const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { pool } = require('../db/database');
const { JWT_SECRET, authenticate } = require('../middleware/auth');

// POST /api/auth/signup
router.post('/signup', [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['admin', 'member']).withMessage('Role must be admin or member'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, email, password, role = 'member' } = req.body;

  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows[0]) return res.status(409).json({ error: 'Email already registered' });

  const hashedPassword = await bcrypt.hash(password, 10);
  const { rows } = await pool.query(
    'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
    [name, email, hashedPassword, role]
  );

  const user = rows[0];
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
  res.status(201).json({ token, user });
});

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;
  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  const user = rows[0];
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
  const { password: _, ...safeUser } = user;
  res.json({ token, user: safeUser });
});

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

// GET /api/auth/users
router.get('/users', authenticate, async (req, res) => {
  const { rows } = await pool.query('SELECT id, name, email, role FROM users ORDER BY name');
  res.json(rows);
});

module.exports = router;
