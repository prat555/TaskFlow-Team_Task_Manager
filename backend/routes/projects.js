const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { pool } = require('../db/database');
const { authenticate, requireProjectAccess, requireProjectAdmin } = require('../middleware/auth');

// GET /api/projects
router.get('/', authenticate, async (req, res) => {
  let query, params;
  if (req.user.role === 'admin') {
    query = `
      SELECT p.*, u.name as owner_name,
        (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count
      FROM projects p JOIN users u ON p.owner_id = u.id
      ORDER BY p.created_at DESC
    `;
    params = [];
  } else {
    query = `
      SELECT p.*, u.name as owner_name, pm.role as my_role,
        (SELECT COUNT(*) FROM project_members WHERE project_id = p.id) as member_count,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count
      FROM projects p
      JOIN users u ON p.owner_id = u.id
      JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = $1
      ORDER BY p.created_at DESC
    `;
    params = [req.user.id];
  }
  const { rows } = await pool.query(query, params);
  res.json(rows);
});

// POST /api/projects
router.post('/', authenticate, [
  body('name').trim().isLength({ min: 2 }).withMessage('Project name required'),
  body('description').optional().trim(),
], async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Only admins can create projects' });
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, description } = req.body;
  const { rows } = await pool.query(
    'INSERT INTO projects (name, description, owner_id) VALUES ($1, $2, $3) RETURNING *',
    [name, description || null, req.user.id]
  );
  await pool.query(
    'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)',
    [rows[0].id, req.user.id, 'admin']
  );
  res.status(201).json(rows[0]);
});

// GET /api/projects/:id
router.get('/:id', authenticate, requireProjectAccess, async (req, res) => {
  const { rows: proj } = await pool.query(
    'SELECT p.*, u.name as owner_name FROM projects p JOIN users u ON p.owner_id = u.id WHERE p.id = $1',
    [req.params.id]
  );
  if (!proj[0]) return res.status(404).json({ error: 'Project not found' });

  const { rows: members } = await pool.query(
    `SELECT u.id, u.name, u.email, u.role as global_role, pm.role as project_role, pm.joined_at
     FROM project_members pm JOIN users u ON u.id = pm.user_id
     WHERE pm.project_id = $1 ORDER BY u.name`,
    [req.params.id]
  );

  const { rows: myMem } = await pool.query(
    'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
    [req.params.id, req.user.id]
  );

  res.json({ ...proj[0], members, my_role: myMem[0]?.role || 'admin' });
});

// PUT /api/projects/:id
router.put('/:id', authenticate, requireProjectAdmin, [
  body('name').optional().trim().isLength({ min: 2 }),
  body('description').optional().trim(),
], async (req, res) => {
  const { name, description } = req.body;
  const { rows } = await pool.query(
    `UPDATE projects SET
      name = COALESCE($1, name),
      description = COALESCE($2, description)
     WHERE id = $3 RETURNING *`,
    [name || null, description || null, req.params.id]
  );
  res.json(rows[0]);
});

// DELETE /api/projects/:id
router.delete('/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Only admins can delete projects' });
  await pool.query('DELETE FROM projects WHERE id = $1', [req.params.id]);
  res.json({ message: 'Project deleted' });
});

// POST /api/projects/:id/members - add member
router.post('/:id/members', authenticate, requireProjectAdmin, [
  body('user_id').isInt().withMessage('User ID required'),
  body('role').optional().isIn(['admin', 'member']),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { user_id, role = 'member' } = req.body;
  await pool.query(
    'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT (project_id, user_id) DO UPDATE SET role = $3',
    [req.params.id, user_id, role]
  );
  res.json({ message: 'Member added' });
});

// DELETE /api/projects/:id/members/:userId
router.delete('/:id/members/:userId', authenticate, requireProjectAdmin, async (req, res) => {
  await pool.query(
    'DELETE FROM project_members WHERE project_id = $1 AND user_id = $2',
    [req.params.id, req.params.userId]
  );
  res.json({ message: 'Member removed' });
});

module.exports = router;
