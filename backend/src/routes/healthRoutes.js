const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * @swagger
 * /api/v1/health:
 *   get:
 *     tags: [Health]
 *     summary: Basic health check
 *     security: []
 *     responses:
 *       200:
 *         description: Service is healthy
 */
router.get('/', (req, res) => {
  successResponse(res, {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: '1.0.0',
  }, 'Service is healthy');
});

/**
 * @swagger
 * /api/v1/health/db:
 *   get:
 *     tags: [Health]
 *     summary: Database connectivity check
 *     security: []
 *     responses:
 *       200:
 *         description: Database is connected
 *       503:
 *         description: Database is unreachable
 */
router.get('/db', async (req, res) => {
  try {
    const start = Date.now();
    await pool.query('SELECT 1');
    const latency = Date.now() - start;
    return successResponse(res, {
      status: 'connected',
      latency_ms: latency,
      pool: {
        total: pool.totalCount,
        idle: pool.idleCount,
        waiting: pool.waitingCount,
      },
    }, 'Database healthy');
  } catch (err) {
    return errorResponse(res, 'Database unreachable', 503, [{ message: err.message }]);
  }
});

module.exports = router;
