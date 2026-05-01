const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { pool } = require('../db/database');
const { authenticate, requireProjectAccess, requireProjectAdmin } = require('../middleware/auth');

// GET /api/tasks/dashboard - user's dashboard summary
router.get('/dashboard', authenticate, async (req, res) => {
  const userId = req.user.id;
  const isAdmin = req.user.role === 'admin';

  const baseWhere = isAdmin ? '' : `
    AND t.project_id IN (SELECT project_id FROM project_members WHERE user_id = ${userId})
  `;

  const [total, byStatus, byPriority, overdue, myTasks] = await Promise.all([
    pool.query(`SELECT COUNT(*) FROM tasks t WHERE 1=1 ${baseWhere}`),
    pool.query(`SELECT status, COUNT(*) as count FROM tasks t WHERE 1=1 ${baseWhere} GROUP BY status`),
    pool.query(`SELECT priority, COUNT(*) as count FROM tasks t WHERE 1=1 ${baseWhere} GROUP BY priority`),
    pool.query(`
      SELECT t.*, p.name as project_name, u.name as assignee_name
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.due_date < NOW() AND t.status != 'done' ${baseWhere}
      ORDER BY t.due_date ASC LIMIT 5
    `),
    pool.query(`
      SELECT t.*, p.name as project_name
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      WHERE t.assigned_to = $1 AND t.status != 'done'
      ORDER BY t.due_date ASC NULLS LAST LIMIT 10
    `, [userId]),
  ]);

  res.json({
    total: parseInt(total.rows[0].count),
    by_status: byStatus.rows,
    by_priority: byPriority.rows,
    overdue: overdue.rows,
    my_tasks: myTasks.rows,
  });
});

// GET /api/tasks/project/:projectId
router.get('/project/:projectId', authenticate, requireProjectAccess, async (req, res) => {
  const { status, priority, assigned_to } = req.query;
  let conditions = ['t.project_id = $1'];
  let params = [req.params.projectId];
  let i = 2;

  if (status) { conditions.push(`t.status = $${i++}`); params.push(status); }
  if (priority) { conditions.push(`t.priority = $${i++}`); params.push(priority); }
  if (assigned_to) { conditions.push(`t.assigned_to = $${i++}`); params.push(assigned_to); }

  const { rows } = await pool.query(`
    SELECT t.*,
      u1.name as assignee_name,
      u2.name as creator_name
    FROM tasks t
    LEFT JOIN users u1 ON t.assigned_to = u1.id
    LEFT JOIN users u2 ON t.created_by = u2.id
    WHERE ${conditions.join(' AND ')}
    ORDER BY
      CASE t.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
      t.due_date ASC NULLS LAST,
      t.created_at DESC
  `, params);

  res.json(rows);
});

// POST /api/tasks/project/:projectId
router.post('/project/:projectId', authenticate, requireProjectAdmin, [
  body('title').trim().isLength({ min: 2 }).withMessage('Title required'),
  body('description').optional().trim(),
  body('assigned_to').optional().isInt(),
  body('status').optional().isIn(['todo', 'in_progress', 'done']),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('due_date').optional().isDate(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { title, description, assigned_to, status, priority, due_date } = req.body;
  const { rows } = await pool.query(
    `INSERT INTO tasks (title, description, project_id, assigned_to, created_by, status, priority, due_date)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [title, description || null, req.params.projectId, assigned_to || null,
     req.user.id, status || 'todo', priority || 'medium', due_date || null]
  );
  res.status(201).json(rows[0]);
});

// PUT /api/tasks/:id
router.put('/:id', authenticate, async (req, res) => {
  const { rows: existing } = await pool.query('SELECT * FROM tasks WHERE id = $1', [req.params.id]);
  if (!existing[0]) return res.status(404).json({ error: 'Task not found' });

  const task = existing[0];
  // Global admins and project admins can edit any task fields.
  if (req.user.role !== 'admin') {
    const { rows: mem } = await pool.query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [task.project_id, req.user.id]
    );
    if (!mem[0]) return res.status(403).json({ error: 'Access denied' });

    if (mem[0].role !== 'admin') {
      const requestedFields = Object.keys(req.body);
      const allowedFields = ['status'];
      const hasDisallowed = requestedFields.some(field => !allowedFields.includes(field));
      if (hasDisallowed) return res.status(403).json({ error: 'Members can only update task status' });
      if (task.assigned_to !== req.user.id) {
        return res.status(403).json({ error: 'Members can only update their own tasks' });
      }
    }
  }

  const { title, description, assigned_to, status, priority, due_date } = req.body;
  const { rows } = await pool.query(
    `UPDATE tasks SET
      title = COALESCE($1, title),
      description = COALESCE($2, description),
      assigned_to = CASE WHEN $3::int IS NOT NULL THEN $3::int ELSE assigned_to END,
      status = COALESCE($4, status),
      priority = COALESCE($5, priority),
      due_date = CASE WHEN $6::date IS NOT NULL THEN $6::date ELSE due_date END,
      updated_at = NOW()
     WHERE id = $7 RETURNING *`,
    [title || null, description || null, assigned_to || null,
     status || null, priority || null, due_date || null, req.params.id]
  );
  res.json(rows[0]);
});

// DELETE /api/tasks/:id
router.delete('/:id', authenticate, async (req, res) => {
  const { rows: existing } = await pool.query('SELECT * FROM tasks WHERE id = $1', [req.params.id]);
  if (!existing[0]) return res.status(404).json({ error: 'Task not found' });

  if (req.user.role !== 'admin') {
    const { rows: mem } = await pool.query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [existing[0].project_id, req.user.id]
    );
    if (!mem[0] || mem[0].role !== 'admin') {
      return res.status(403).json({ error: 'Project admin access required to delete tasks' });
    }
  }

  await pool.query('DELETE FROM tasks WHERE id = $1', [req.params.id]);
  res.json({ message: 'Task deleted' });
});

module.exports = router;
