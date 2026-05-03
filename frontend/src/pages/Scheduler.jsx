import { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import api from '../services/api';
import { toast } from 'react-toastify';

const CRON_PRESETS = [
  { label: 'Every day at 9am',     value: '0 9 * * *' },
  { label: 'Every Monday at 9am',  value: '0 9 * * 1' },
  { label: 'Every hour',           value: '0 * * * *' },
  { label: '1st of every month',   value: '0 9 1 * *' },
];

const Scheduler = () => {
  const [jobs, setJobs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm]       = useState({
    name:       '',
    table:      '',
    cron_expr:  '0 9 * * *',
    limit:      100,
  });
  const [sources, setSources] = useState([]);
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/api/scheduler'),
      api.get('/api/sources'),
    ]).then(([jobsRes, sourcesRes]) => {
      setJobs(jobsRes.data.jobs);
      setSources(sourcesRes.data.sources.flatMap(s => s.tables));
      setLoading(false);
    });
  }, []);

  const createJob = async () => {
    if (!form.name || !form.table || !form.cron_expr) {
      return toast.error('Name, table and schedule are required');
    }
    setSaving(true);
    try {
      const res = await api.post('/api/scheduler', {
        name:       form.name,
        query_json: { table: form.table, limit: form.limit },
        cron_expr:  form.cron_expr,
      });
      setJobs([res.data.job, ...jobs]);
      setForm({ name: '', table: '', cron_expr: '0 9 * * *', limit: 100 });
      toast.success('Job scheduled successfully');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create job');
    } finally {
      setSaving(false);
    }
  };

  const deleteJob = async (id) => {
    try {
      await api.delete(`/api/scheduler/${id}`);
      setJobs(jobs.filter(j => j.id !== id));
      toast.success('Job deleted');
    } catch {
      toast.error('Failed to delete job');
    }
  };

  if (loading) return (
    <Layout title="Scheduler">
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"/>
      </div>
    </Layout>
  );

  return (
    <Layout title="Scheduler">
      <div className="max-w-4xl mx-auto">

        {/* Create job form */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
          <h3 className="text-white font-semibold mb-5">Schedule a new report</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Job name</label>
              <input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Daily customer report"
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Table</label>
              <select
                value={form.table}
                onChange={e => setForm({ ...form, table: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none"
              >
                <option value="">Select table...</option>
                {sources.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">Schedule</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {CRON_PRESETS.map(p => (
                <button
                  key={p.value}
                  onClick={() => setForm({ ...form, cron_expr: p.value })}
                  className={`px-3 py-1.5 rounded-lg text-xs transition ${
                    form.cron_expr === p.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <input
              value={form.cron_expr}
              onChange={e => setForm({ ...form, cron_expr: e.target.value })}
              placeholder="0 9 * * *"
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            onClick={createJob}
            disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition"
          >
            {saving ? 'Scheduling...' : 'Schedule report'}
          </button>
        </div>

        {/* Jobs list */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-white font-semibold mb-4">
            Active jobs
            <span className="ml-2 text-sm font-normal text-gray-400">{jobs.length} total</span>
          </h3>

          {jobs.length === 0 ? (
            <p className="text-gray-500 text-sm">No scheduled jobs yet.</p>
          ) : (
            <div className="space-y-3">
              {jobs.map(job => (
                <div key={job.id} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700">
                  <div>
                    <p className="text-white font-medium text-sm">{job.name}</p>
                    <p className="text-gray-400 text-xs mt-0.5">
                      Table: <span className="font-mono text-gray-300">{job.query_json?.table}</span>
                      <span className="mx-2">·</span>
                      Schedule: <span className="font-mono text-gray-300">{job.cron_expr}</span>
                    </p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      Last run: {job.last_run_at ? new Date(job.last_run_at).toLocaleString() : 'Never'}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteJob(job.id)}
                    className="text-red-400 hover:text-red-300 text-sm transition ml-4"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Scheduler;