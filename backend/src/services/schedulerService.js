const cron = require('node-cron');
const pool = require('../config/db');
const { buildAndRunQuery } = require('./queryEngine');

const activeJobs = new Map();

const registerJob = (job) => {
  if (activeJobs.has(job.id)) {
    activeJobs.get(job.id).stop();
  }

  const task = cron.schedule(job.cron_expr, async () => {
    console.log(`Running scheduled job: ${job.name}`);
    try {
      const result = await buildAndRunQuery(job.query_json, job.user_role);
      await pool.query(
        `UPDATE scheduled_jobs SET last_run_at = NOW() WHERE id = $1`,
        [job.id]
      );
      console.log(`Job '${job.name}' completed — ${result.count} rows`);
    } catch (err) {
      console.error(`Job '${job.name}' failed:`, err.message);
    }
  });

  activeJobs.set(job.id, task);
  console.log(`Registered job: ${job.name} (${job.cron_expr})`);
};

const loadJobsFromDB = async () => {
  try {
    const result = await pool.query(
      `SELECT sj.*, u.role AS user_role
       FROM scheduled_jobs sj
       JOIN users u ON u.id = sj.user_id
       WHERE sj.is_active = TRUE`
    );
    result.rows.forEach(registerJob);
    console.log(`Loaded ${result.rows.length} scheduled jobs from DB`);
  } catch (err) {
    console.error('Failed to load scheduled jobs:', err.message);
  }
};

const addJob = async (jobId) => {
  try {
    const result = await pool.query(
      `SELECT sj.*, u.role AS user_role
       FROM scheduled_jobs sj
       JOIN users u ON u.id = sj.user_id
       WHERE sj.id = $1`,
      [jobId]
    );
    if (result.rows.length > 0) {
      registerJob(result.rows[0]);
    }
  } catch (err) {
    console.error('Failed to add job:', err.message);
  }
};

const removeJob = (jobId) => {
  if (activeJobs.has(jobId)) {
    activeJobs.get(jobId).stop();
    activeJobs.delete(jobId);
    console.log(`Removed job: ${jobId}`);
  }
};

module.exports = { loadJobsFromDB, addJob, removeJob };