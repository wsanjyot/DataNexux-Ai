const { buildAndRunQuery } = require('../services/queryEngine');
const { validationResult }  = require('express-validator');

const runQuery = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { table, conditions, columns, orderBy, direction, limit, groupBy } = req.body;

  try {
    const result = await buildAndRunQuery(
      { table, conditions, columns, orderBy, direction, limit, groupBy },
      req.user.role
    );

    res.json({
      success: true,
      sql:     result.sql,
      columns: result.columns,
      rows:    result.rows,
      count:   result.count,
    });
  } catch (err) {
    console.error('Query error:', err.message);
    const status = err.message.startsWith('Access denied') ? 403 : 500;
    res.status(status).json({ error: err.message });
  }
};

module.exports = { runQuery };