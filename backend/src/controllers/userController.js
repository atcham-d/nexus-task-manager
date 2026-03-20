const bcrypt = require('bcryptjs');
const xss = require('xss');
const { query } = require('../config/database');
const { successResponse, errorResponse, paginationMeta } = require('../utils/response');

const listUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, role } = req.query;
    const offset = (page - 1) * limit;

    let conditions = [];
    let params = [];
    let pIdx = 1;

    if (search) {
      conditions.push(`(name ILIKE $${pIdx} OR email ILIKE $${pIdx})`);
      params.push(`%${xss(search)}%`);
      pIdx++;
    }
    if (role) {
      conditions.push(`role = $${pIdx++}`);
      params.push(role);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const total = parseInt((await query(`SELECT COUNT(*) FROM users ${where}`, params)).rows[0].count);
    const users = await query(
      `SELECT id, name, email, role, is_active, created_at FROM users ${where} ORDER BY created_at DESC LIMIT $${pIdx} OFFSET $${pIdx + 1}`,
      [...params, limit, offset]
    );

    return successResponse(res, users.rows, 'Users fetched', 200, paginationMeta(total, page, limit));
  } catch (err) {
    next(err);
  }
};

const getUser = async (req, res, next) => {
  try {
    const result = await query(
      'SELECT id, name, email, role, is_active, created_at, updated_at FROM users WHERE id = $1',
      [req.params.id]
    );
    if (!result.rows.length) return errorResponse(res, 'User not found', 404);
    return successResponse(res, result.rows[0], 'User fetched');
  } catch (err) {
    next(err);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, role, is_active, password } = req.body;

    const existing = await query('SELECT id FROM users WHERE id = $1', [id]);
    if (!existing.rows.length) return errorResponse(res, 'User not found', 404);

    const updates = [];
    const values = [];
    let pIdx = 1;

    if (name) { updates.push(`name = $${pIdx++}`); values.push(xss(name.trim())); }
    if (role) { updates.push(`role = $${pIdx++}`); values.push(role); }
    if (is_active !== undefined) { updates.push(`is_active = $${pIdx++}`); values.push(is_active); }
    if (password) {
      const hashed = await bcrypt.hash(password, 12);
      updates.push(`password = $${pIdx++}`);
      values.push(hashed);
    }

    if (!updates.length) return errorResponse(res, 'No fields to update', 400);

    values.push(id);
    const result = await query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${pIdx} RETURNING id, name, email, role, is_active, updated_at`,
      values
    );

    return successResponse(res, result.rows[0], 'User updated');
  } catch (err) {
    next(err);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (id === req.user.id) return errorResponse(res, 'Cannot delete yourself', 400);

    const result = await query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    if (!result.rows.length) return errorResponse(res, 'User not found', 404);

    return successResponse(res, { id }, 'User deleted');
  } catch (err) {
    next(err);
  }
};

const getDashboardStats = async (req, res, next) => {
  try {
    const [userStats, taskStats, recentUsers] = await Promise.all([
      query(`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE is_active) as active, COUNT(*) FILTER (WHERE role='admin') as admins FROM users`),
      query(`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status='pending') as pending, COUNT(*) FILTER (WHERE status='completed') as completed, COUNT(*) FILTER (WHERE due_date < NOW() AND status NOT IN ('completed','archived')) as overdue FROM tasks`),
      query(`SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC LIMIT 5`),
    ]);

    return successResponse(res, {
      users: userStats.rows[0],
      tasks: taskStats.rows[0],
      recentUsers: recentUsers.rows,
    }, 'Dashboard stats fetched');
  } catch (err) {
    next(err);
  }
};

module.exports = { listUsers, getUser, updateUser, deleteUser, getDashboardStats };
