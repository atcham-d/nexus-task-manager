const express = require('express');
const router = express.Router();
const {
  listTasks, getTask, createTask, updateTask, deleteTask, getTaskStats,
} = require('../controllers/taskController');
const { createTaskValidator, updateTaskValidator, listTasksValidator } = require('../validators/taskValidator');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { param } = require('express-validator');

router.use(authenticate);

/**
 * @swagger
 * /api/v1/tasks/stats:
 *   get:
 *     tags: [Tasks]
 *     summary: Get task statistics (admin sees all, user sees own)
 *     responses:
 *       200:
 *         description: Task stats including totals by status and overdue count
 */
router.get('/stats', getTaskStats);

/**
 * @swagger
 * /api/v1/tasks:
 *   get:
 *     tags: [Tasks]
 *     summary: List tasks with filtering, sorting, and pagination
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, in_progress, completed, archived] }
 *       - in: query
 *         name: priority
 *         schema: { type: string, enum: [low, medium, high] }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, default: created_at }
 *       - in: query
 *         name: order
 *         schema: { type: string, enum: [asc, desc], default: desc }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated list of tasks
 */
router.get('/', listTasksValidator, validate, listTasks);

/**
 * @swagger
 * /api/v1/tasks/{id}:
 *   get:
 *     tags: [Tasks]
 *     summary: Get a single task by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Task details
 *       404:
 *         description: Task not found
 */
router.get('/:id', [param('id').isUUID()], validate, getTask);

/**
 * @swagger
 * /api/v1/tasks:
 *   post:
 *     tags: [Tasks]
 *     summary: Create a new task
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title: { type: string, example: "Complete API documentation" }
 *               description: { type: string }
 *               status: { type: string, enum: [pending, in_progress, completed, archived], default: pending }
 *               priority: { type: string, enum: [low, medium, high], default: medium }
 *               due_date: { type: string, format: date-time, example: "2025-12-31T23:59:59Z" }
 *     responses:
 *       201:
 *         description: Task created successfully
 */
router.post('/', createTaskValidator, validate, createTask);

/**
 * @swagger
 * /api/v1/tasks/{id}:
 *   patch:
 *     tags: [Tasks]
 *     summary: Update a task (partial update)
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
 *               title: { type: string }
 *               description: { type: string }
 *               status: { type: string, enum: [pending, in_progress, completed, archived] }
 *               priority: { type: string, enum: [low, medium, high] }
 *               due_date: { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: Task updated
 *       404:
 *         description: Task not found
 */
router.patch('/:id', updateTaskValidator, validate, updateTask);

/**
 * @swagger
 * /api/v1/tasks/{id}:
 *   delete:
 *     tags: [Tasks]
 *     summary: Delete a task
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Task deleted
 *       404:
 *         description: Task not found
 */
router.delete('/:id', [param('id').isUUID()], validate, deleteTask);

module.exports = router;
