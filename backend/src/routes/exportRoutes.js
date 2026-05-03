const express          = require('express');
const { body }         = require('express-validator');
const { exportData }   = require('../controllers/exportController');
const authenticate     = require('../middleware/authMiddleware');
const authorize        = require('../middleware/rbacMiddleware');

const router = express.Router();
/**
 * @swagger
 * /api/export:
 *   post:
 *     summary: Export query results as xlsx or json
 *     tags: [Export]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [columns, rows]
 *             properties:
 *               columns:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: [id, name, city]
 *               rows:
 *                 type: array
 *                 items:
 *                   type: object
 *               format:
 *                 type: string
 *                 example: xlsx
 *               filename:
 *                 type: string
 *                 example: customers_export
 *     responses:
 *       200:
 *         description: File download
 *       400:
 *         description: Invalid format
 */

router.post('/',
  authenticate,
  authorize('admin', 'analyst'),
  [
    body('columns').isArray().withMessage('columns must be an array'),
    body('rows').isArray().withMessage('rows must be an array'),
    body('format').optional().isIn(['xlsx', 'json']).withMessage('format must be xlsx or json'),
  ],
  exportData
);

module.exports = router;