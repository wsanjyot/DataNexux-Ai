const { Pool } = require('pg');

// Uses DATABASE_URL on Railway, falls back to individual vars locally
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    })
  : new Pool({
      user:     process.env.DB_USER,
      host:     process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port:     process.env.DB_PORT || 5432,
    });

pool.on('connect', () => {
  console.log('Connected to PostgreSQL');
});

pool.on('error', (err) => {
  console.error('Unexpected database error:', err.message);
  process.exit(-1);
});

module.exports = pool;