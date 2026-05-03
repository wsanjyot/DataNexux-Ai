const express      = require('express');
const { body }     = require('express-validator');
const { createJob, getJobs, deleteJob } = require('../controllers/schedulerController');
const authenticate = require('../middleware/authMiddleware');
const authorize    = require('../middleware/rbacMiddleware');

const router = express.Router();

/**
 * @swagger
 * /api/scheduler:
 *   get:
 *     summary: Get all scheduled jobs
 *     tags: [Scheduler]
 *     responses:
 *       200:
 *         description: List of scheduled jobs
 */
router.get('/',
  authenticate,
  authorize('admin', 'analyst'),
  getJobs
);
/**
 * @swagger
 * /api/scheduler:
 *   post:
 *     summary: Create a new scheduled job
 *     tags: [Scheduler]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, query_json, cron_expr]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Daily customer report
 *               query_json:
 *                 type: object
 *                 example: { "table": "customers", "limit": 10 }
 *               cron_expr:
 *                 type: string
 *                 example: "0 9 * * *"
 *     responses:
 *       201:
 *         description: Job created successfully
 */

router.post('/',
  authenticate,
  authorize('admin', 'analyst'),
  [
    body('name').notEmpty().withMessage('Job name is required'),
    body('query_json').notEmpty().withMessage('Query is required'),
    body('cron_expr').notEmpty().withMessage('Cron expression is required'),
  ],
  createJob
);
/**
 * @swagger
 * /api/scheduler/{id}:
 *   delete:
 *     summary: Delete a scheduled job
 *     tags: [Scheduler]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job deleted successfully
 *       404:
 *         description: Job not found
 */
router.delete('/:id',
  authenticate,
  authorize('admin', 'analyst'),
  deleteJob
);

module.exports = router;