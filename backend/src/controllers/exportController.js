const { toXLSX, toJSON }   = require('../services/exportService');
const { validationResult } = require('express-validator');

const exportData = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { columns, rows, format = 'xlsx', filename = 'export' } = req.body;

  try {
    if (!columns || !rows) {
      return res.status(400).json({ error: 'columns and rows are required' });
    }

    if (format === 'xlsx') {
      const buffer = toXLSX(columns, rows);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
      return res.send(buffer);
    }

    if (format === 'json') {
      const data = toJSON(columns, rows);
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
      return res.send(JSON.stringify(data, null, 2));
    }

    return res.status(400).json({ error: 'Invalid format. Use xlsx or json' });

  } catch (err) {
    console.error('Export error:', err.message);
    res.status(500).json({ error: 'Export failed' });
  }
};

module.exports = { exportData };