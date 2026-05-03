const pool = require('../config/db');

const auditLog = async (req, res, next) => {
  const originalJson = res.json.bind(res);

  res.json = async (data) => {
    res.json = originalJson;

    if (req.user) {
      try {
        const queryText = data?.sql || null;
        const rowCount  = data?.count || 0;
        const source    = req.body?.table || 'unknown';

        await pool.query(
          `INSERT INTO audit_logs (user_id, user_role, query_text, source, row_count)
           VALUES ($1, $2, $3, $4, $5)`,
          [req.user.id, req.user.role, queryText, source, rowCount]
        );
      } catch (err) {
        console.error('Audit log error:', err.message);
      }
    }

    return originalJson(data);
  };

  next();
};

module.exports = auditLog;