const express          = require('express');
const { getSources }   = require('../controllers/sourcesController');
const authenticate     = require('../middleware/authMiddleware');

const router = express.Router();
/**
 * @swagger
 * /api/sources:
 *   get:
 *     summary: Get available data sources filtered by role
 *     tags: [Sources]
 *     responses:
 *       200:
 *         description: List of accessible data sources and tables
 *       401:
 *         description: No token provided
 */

router.get('/', authenticate, getSources);

module.exports = router;