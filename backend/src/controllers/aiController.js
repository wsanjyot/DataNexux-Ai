const { generateSQL, generateInsights } = require('../services/groqService');
const pool                              = require('../config/db');
const { validationResult }              = require('express-validator');

const askAI = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { question, history = [] } = req.body;
  const userRole = req.user.role;

  try {
    const sql    = await generateSQL(question, userRole, history);
    const result = await pool.query(sql);

    const columns = result.fields.map(f => f.name);
    const rows    = result.rows;

    // Generate insights in parallel
    const insights = await generateInsights(question, columns, rows);

    res.json({
      success:  true,
      question,
      sql,
      columns,
      rows,
      count:    result.rowCount,
      insights,
    });
  } catch (err) {
    console.error('AI error:', err.message);
    const status = err.message.includes('blocked') ? 403 : 500;
    res.status(status).json({ error: err.message });
  }
};

module.exports = { askAI };