const express = require('express');
const router = express.Router();
const { listUsers, getUser, updateUser, deleteUser, getDashboardStats } = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { body, param, query } = require('express-validator');

router.use(authenticate, authorize('admin'));

/**
 * @swagger
 * /api/v1/users/dashboard:
 *   get:
 *     tags: [Users]
 *     summary: Admin dashboard stats (users + tasks summary)
 *     responses:
 *       200:
 *         description: Aggregated dashboard statistics
 *       403:
 *         description: Admin only
 */
router.get('/dashboard', getDashboardStats);

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     tags: [Users]
 *     summary: List all users (admin only)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: role
 *         schema: { type: string, enum: [user, admin] }
 *     responses:
 *       200:
 *         description: Paginated user list
 */
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('role').optional().isIn(['user', 'admin']),
  ],
  validate,
  listUsers
);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get a single user by ID (admin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: User details
 *       404:
 *         description: User not found
 */
router.get('/:id', [param('id').isUUID()], validate, getUser);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   patch:
 *     tags: [Users]
 *     summary: Update a user (admin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               role: { type: string, enum: [user, admin] }
 *               is_active: { type: boolean }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: User updated
 */
router.patch(
  '/:id',
  [
    param('id').isUUID(),
    body('name').optional().trim().isLength({ min: 2, max: 100 }),
    body('role').optional().isIn(['user', 'admin']),
    body('is_active').optional().isBoolean(),
    body('password').optional().isLength({ min: 8 }),
  ],
  validate,
  updateUser
);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   delete:
 *     tags: [Users]
 *     summary: Delete a user (admin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: User deleted
 */
router.delete('/:id', [param('id').isUUID()], validate, deleteUser);

module.exports = router;
