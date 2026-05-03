const pool = require('../config/db');
const cron = require('node-cron');
const { addJob, removeJob } = require('../services/schedulerService');
const { validationResult }  = require('express-validator');

// POST /api/scheduler
const createJob = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, query_json, cron_expr } = req.body;

  if (!cron.validate(cron_expr)) {
    return res.status(400).json({ error: 'Invalid cron expression' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO scheduled_jobs (user_id, name, query_json, cron_expr)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.user.id, name, JSON.stringify(query_json), cron_expr]
    );

    const job = result.rows[0];
    await addJob(job.id);

    res.status(201).json({
      success: true,
      job,
    });
  } catch (err) {
    console.error('Create job error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/scheduler
const getJobs = async (req, res) => {
  try {
    const query = req.user.role === 'admin'
      ? `SELECT sj.*, u.name AS created_by
         FROM scheduled_jobs sj
         JOIN users u ON u.id = sj.user_id
         ORDER BY sj.created_at DESC`
      : `SELECT sj.*, u.name AS created_by
         FROM scheduled_jobs sj
         JOIN users u ON u.id = sj.user_id
         WHERE sj.user_id = $1
         ORDER BY sj.created_at DESC`;

    const params = req.user.role === 'admin' ? [] : [req.user.id];
    const result = await pool.query(query, params);

    res.json({ jobs: result.rows });
  } catch (err) {
    console.error('Get jobs error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// DELETE /api/scheduler/:id
const deleteJob = async (req, res) => {
  const { id } = req.params;

  try {
    const check = await pool.query(
      `SELECT * FROM scheduled_jobs WHERE id = $1`, [id]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (req.user.role !== 'admin' && check.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await pool.query(`DELETE FROM scheduled_jobs WHERE id = $1`, [id]);
    removeJob(id);

    res.json({ success: true, message: 'Job deleted' });
  } catch (err) {
    console.error('Delete job error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { createJob, getJobs, deleteJob };