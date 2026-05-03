import { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import api from '../services/api';
import { TableSkeleton } from '../components/shared/Skeleton';

const AuditLogs = () => {
  const [logs, setLogs]       = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.post('/api/query/run', {
      table:     'audit_logs',
      orderBy:   'executed_at',
      direction: 'DESC',
      limit:     100,
    }).then(res => {
      setLogs(res.data.rows);
      setLoading(false);
    });
  }, []);

  const roleBadge = (role) => {
    const map = {
      admin:   'bg-red-900 text-red-300',
      analyst: 'bg-blue-900 text-blue-300',
      viewer:  'bg-gray-700 text-gray-300',
    };
    return map[role] || 'bg-gray-700 text-gray-300';
  };

  if (loading) return (
  <Layout title="Audit Logs">
    <div className="max-w-6xl mx-auto">
      <TableSkeleton rows={8} />
    </div>
  </Layout>
);

  return (
    <Layout title="Audit Logs">
      <div className="max-w-6xl mx-auto">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-gray-400 text-sm">{logs.length} queries logged</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-800 border-b border-gray-700">
                  <th className="px-4 py-3 text-left text-gray-400 font-medium">Role</th>
                  <th className="px-4 py-3 text-left text-gray-400 font-medium">Source</th>
                  <th className="px-4 py-3 text-left text-gray-400 font-medium">Query</th>
                  <th className="px-4 py-3 text-left text-gray-400 font-medium">Rows</th>
                  <th className="px-4 py-3 text-left text-gray-400 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <tr key={i} className="border-t border-gray-800 hover:bg-gray-800 transition">
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleBadge(log.user_role)}`}>
                        {log.user_role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">{log.source}</td>
                    <td className="px-4 py-3 text-gray-300 font-mono text-xs max-w-xs truncate">
                      {log.query_text}
                    </td>
                    <td className="px-4 py-3 text-gray-400">{log.row_count}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(log.executed_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AuditLogs;