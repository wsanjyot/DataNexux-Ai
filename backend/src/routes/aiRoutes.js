const express    = require('express');
const { body }   = require('express-validator');
const { askAI }  = require('../controllers/aiController');
const authenticate = require('../middleware/authMiddleware');
const authorize    = require('../middleware/rbacMiddleware');
const auditLog     = require('../middleware/auditMiddleware');

const router = express.Router();
/**
 * @swagger
 * /api/ai/ask:
 *   post:
 *     summary: Convert plain English question to SQL and return results
 *     tags: [AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [question]
 *             properties:
 *               question:
 *                 type: string
 *                 example: show me the top 5 products by price
 *     responses:
 *       200:
 *         description: Query results with generated SQL
 *       403:
 *         description: Access denied
 */

router.post('/ask',
  authenticate,
  authorize('admin', 'analyst'),
  auditLog,
  [
    body('question').notEmpty().withMessage('Question is required'),
  ],
  askAI
);

module.exports = router;