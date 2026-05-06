const app  = require('./app');
const pool = require('./config/db');
const { loadJobsFromDB } = require('./services/schedulerService');

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    console.log('Connecting to database...');
    await pool.query('SELECT 1');
    console.log('Database connection verified');

    await loadJobsFromDB();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
};

start();