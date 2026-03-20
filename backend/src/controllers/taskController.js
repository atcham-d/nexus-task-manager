const xss = require('xss');
const { query } = require('../config/database');
const { successResponse, errorResponse, paginationMeta } = require('../utils/response');

const listTasks = async (req, res, next) => {
  try {
    const {
      page = 1, limit = 10, status, priority,
      sortBy = 'created_at', order = 'desc', search,
    } = req.query;

    const offset = (page - 1) * limit;
    const isAdmin = req.user.role === 'admin';

    let conditions = [];
    let params = [];
    let pIdx = 1;

    if (!isAdmin) {
      conditions.push(`t.user_id = $${pIdx++}`);
      params.push(req.user.id);
    }
    if (status) { conditions.push(`t.status = $${pIdx++}`); params.push(status); }
    if (priority) { conditions.push(`t.priority = $${pIdx++}`); params.push(priority); }
    if (search) {
      conditions.push(`(t.title ILIKE $${pIdx} OR t.description ILIKE $${pIdx})`);
      params.push(`%${xss(search)}%`);
      pIdx++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const orderField = ['created_at', 'updated_at', 'due_date', 'title', 'priority'].includes(sortBy) ? sortBy : 'created_at';
    const orderDir = order === 'asc' ? 'ASC' : 'DESC';

    const countResult = await query(
      `SELECT COUNT(*) FROM tasks t ${where}`, params
    );
    const total = parseInt(countResult.rows[0].count);

    const tasksResult = await query(
      `SELECT t.*, u.name as owner_name, u.email as owner_email
       FROM tasks t
       JOIN users u ON t.user_id = u.id
       ${where}
       ORDER BY t.${orderField} ${orderDir}
       LIMIT $${pIdx} OFFSET $${pIdx + 1}`,
      [...params, limit, offset]
    );

    return successResponse(res, tasksResult.rows, 'Tasks fetched', 200, paginationMeta(total, page, limit));
  } catch (err) {
    next(err);
  }
};

const getTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isAdmin = req.user.role === 'admin';

    const result = await query(
      `SELECT t.*, u.name as owner_name, u.email as owner_email
       FROM tasks t JOIN users u ON t.user_id = u.id
       WHERE t.id = $1 ${isAdmin ? '' : 'AND t.user_id = $2'}`,
      isAdmin ? [id] : [id, req.user.id]
    );

    if (!result.rows.length) {
      return errorResponse(res, 'Task not found', 404);
    }

    return successResponse(res, result.rows[0], 'Task fetched');
  } catch (err) {
    next(err);
  }
};

const createTask = async (req, res, next) => {
  try {
    const { title, description, status = 'pending', priority = 'medium', due_date } = req.body;

    const result = await query(
      `INSERT INTO tasks (title, description, status, priority, due_date, user_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [xss(title.trim()), description ? xss(description.trim()) : null, status, priority, due_date || null, req.user.id]
    );

    return successResponse(res, result.rows[0], 'Task created', 201);
  } catch (err) {
    next(err);
  }
};

const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isAdmin = req.user.role === 'admin';

    // Verify ownership
    const existing = await query(
      `SELECT id FROM tasks WHERE id = $1 ${isAdmin ? '' : 'AND user_id = $2'}`,
      isAdmin ? [id] : [id, req.user.id]
    );
    if (!existing.rows.length) return errorResponse(res, 'Task not found', 404);

    const { title, description, status, priority, due_date } = req.body;
    const updates = [];
    const values = [];
    let pIdx = 1;

    if (title !== undefined) { updates.push(`title = $${pIdx++}`); values.push(xss(title.trim())); }
    if (description !== undefined) { updates.push(`description = $${pIdx++}`); values.push(xss(description.trim())); }
    if (status !== undefined) { updates.push(`status = $${pIdx++}`); values.push(status); }
    if (priority !== undefined) { updates.push(`priority = $${pIdx++}`); values.push(priority); }
    if (due_date !== undefined) { updates.push(`due_date = $${pIdx++}`); values.push(due_date || null); }

    if (!updates.length) return errorResponse(res, 'No fields to update', 400);

    values.push(id);
    const result = await query(
      `UPDATE tasks SET ${updates.join(', ')} WHERE id = $${pIdx} RETURNING *`,
      values
    );

    return successResponse(res, result.rows[0], 'Task updated');
  } catch (err) {
    next(err);
  }
};

const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isAdmin = req.user.role === 'admin';

    const result = await query(
      `DELETE FROM tasks WHERE id = $1 ${isAdmin ? '' : 'AND user_id = $2'} RETURNING id`,
      isAdmin ? [id] : [id, req.user.id]
    );

    if (!result.rows.length) return errorResponse(res, 'Task not found', 404);

    return successResponse(res, { id }, 'Task deleted');
  } catch (err) {
    next(err);
  }
};

const getTaskStats = async (req, res, next) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const condition = isAdmin ? '' : 'WHERE user_id = $1';
    const params = isAdmin ? [] : [req.user.id];

    const stats = await query(
      `SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status = 'archived') as archived,
        COUNT(*) FILTER (WHERE priority = 'high') as high_priority,
        COUNT(*) FILTER (WHERE due_date < NOW() AND status NOT IN ('completed','archived')) as overdue
       FROM tasks ${condition}`,
      params
    );

    return successResponse(res, stats.rows[0], 'Stats fetched');
  } catch (err) {
    next(err);
  }
};

module.exports = { listTasks, getTask, createTask, updateTask, deleteTask, getTaskStats };
