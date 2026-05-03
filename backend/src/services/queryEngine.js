const pool = require('../config/db');

const ALLOWED_TABLES = {
  admin:   ['customers', 'products', 'orders', 'order_items', 'monthly_sales', 'website_traffic', 'employees', 'refund_requests', 'profit_loss', 'audit_logs', 'scheduled_jobs'],
  analyst: ['customers', 'products', 'orders', 'order_items', 'monthly_sales', 'website_traffic'],
  viewer:  ['customers', 'products', 'orders'],
};

const VALID_OPERATORS = ['=', '!=', '>', '<', '>=', '<=', 'LIKE', 'ILIKE'];
const VALID_DIRECTIONS = ['ASC', 'DESC'];

function sanitizeIdentifier(name) {
  return name.replace(/[^a-zA-Z0-9_]/g, '');
}

const buildAndRunQuery = async ({ table, conditions = [], columns = [], orderBy = null, direction = 'ASC', limit = 100, groupBy = null }, userRole) => {

  // ── Role check ────────────────────────────────────────────────
  const allowed = ALLOWED_TABLES[userRole] || [];
  if (!allowed.includes(table)) {
    throw new Error(`Access denied: your role cannot query the '${table}' table`);
  }

  // ── SELECT columns ────────────────────────────────────────────
  const cols = columns.length > 0
    ? columns.map(sanitizeIdentifier).join(', ')
    : '*';

  // ── WHERE clause ──────────────────────────────────────────────
  const values = [];
  let whereClause = '';

  if (conditions.length > 0) {
    const clauses = conditions.map((cond, i) => {
      const col = sanitizeIdentifier(cond.column);
      const op  = VALID_OPERATORS.includes(cond.operator) ? cond.operator : '=';
      values.push(cond.value);
      return `${col} ${op} $${i + 1}`;
    });
    whereClause = `WHERE ${clauses.join(' AND ')}`;
  }

  // ── GROUP BY ──────────────────────────────────────────────────
  const groupClause = groupBy
    ? `GROUP BY ${sanitizeIdentifier(groupBy)}`
    : '';

  // ── ORDER BY ──────────────────────────────────────────────────
  const dir         = VALID_DIRECTIONS.includes(direction.toUpperCase()) ? direction.toUpperCase() : 'ASC';
  const orderClause = orderBy
    ? `ORDER BY ${sanitizeIdentifier(orderBy)} ${dir}`
    : '';

  // ── LIMIT ─────────────────────────────────────────────────────
  const safeLimit = Math.min(parseInt(limit) || 100, 1000);

  // ── Build final SQL ───────────────────────────────────────────
  const sql = `
    SELECT ${cols}
    FROM ${sanitizeIdentifier(table)}
    ${whereClause}
    ${groupClause}
    ${orderClause}
    LIMIT ${safeLimit}
  `.trim().replace(/\s+/g, ' ');

  const result = await pool.query(sql, values);

  return {
    sql,
    rows:    result.rows,
    columns: result.fields.map(f => f.name),
    count:   result.rowCount,
  };
};

module.exports = { buildAndRunQuery, ALLOWED_TABLES };