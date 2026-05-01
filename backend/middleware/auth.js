const jwt = require('jsonwebtoken');
const { pool } = require('../db/database');

const JWT_SECRET = process.env.JWT_SECRET || 'taskflow_secret_change_in_prod';

async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const { rows } = await pool.query(
      'SELECT id, name, email, role FROM users WHERE id = $1',
      [decoded.userId]
    );
    if (!rows[0]) return res.status(401).json({ error: 'User not found' });
    req.user = rows[0];
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

async function requireProjectAccess(req, res, next) {
  const projectId = req.params.projectId || req.params.id;
  if (req.user.role === 'admin') return next();
  const { rows } = await pool.query(
    'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
    [projectId, req.user.id]
  );
  if (!rows[0]) return res.status(403).json({ error: 'Access denied' });
  req.projectRole = rows[0].role;
  next();
}

async function requireProjectAdmin(req, res, next) {
  const projectId = req.params.projectId || req.params.id;
  if (req.user.role === 'admin') return next();
  const { rows } = await pool.query(
    'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
    [projectId, req.user.id]
  );
  if (!rows[0] || rows[0].role !== 'admin') {
    return res.status(403).json({ error: 'Project admin access required' });
  }
  next();
}

module.exports = { authenticate, requireProjectAccess, requireProjectAdmin, JWT_SECRET };
