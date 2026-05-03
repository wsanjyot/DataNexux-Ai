const express      = require('express');
const { body }     = require('express-validator');
const { runQuery } = require('../controllers/queryController');
const authenticate = require('../middleware/authMiddleware');
const authorize    = require('../middleware/rbacMiddleware');
const auditLog     = require('../middleware/auditMiddleware');

const router = express.Router();

/**
 * @swagger
 * /api/query/run:
 *   post:
 *     summary: Run a parameterised query against a data source
 *     tags: [Query]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [table]
 *             properties:
 *               table:
 *                 type: string
 *                 example: customers
 *               columns:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: [name, city]
 *               conditions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     column:
 *                       type: string
 *                     operator:
 *                       type: string
 *                     value:
 *                       type: string
 *               orderBy:
 *                 type: string
 *                 example: created_at
 *               direction:
 *                 type: string
 *                 example: DESC
 *               limit:
 *                 type: integer
 *                 example: 10
 *     responses:
 *       200:
 *         description: Query results with SQL
 *       403:
 *         description: Access denied for this table
 */

router.post('/run',
  authenticate,
  authorize('admin', 'analyst', 'viewer'),
  auditLog,
  [
    body('table').notEmpty().withMessage('Table name is required'),
  ],
  runQuery
);

module.exports = router;