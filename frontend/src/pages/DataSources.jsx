import { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import api from '../services/api';

const DataSources = () => {
  const [sources, setSources] = useState([]);
  const [role, setRole]       = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/sources').then(res => {
      setSources(res.data.sources);
      setRole(res.data.role);
      setLoading(false);
    });
  }, []);

  const colors = {
    store:     'border-blue-500 bg-blue-950',
    analytics: 'border-purple-500 bg-purple-950',
    admin:     'border-red-500 bg-red-950',
  };

  const badges = {
    store:     'bg-blue-900 text-blue-300',
    analytics: 'bg-purple-900 text-purple-300',
    admin:     'bg-red-900 text-red-300',
  };

  if (loading) return (
    <Layout title="Data Sources">
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"/>
      </div>
    </Layout>
  );

  return (
    <Layout title="Data Sources">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <p className="text-gray-400 text-sm">
            Showing data sources available to your role —
            <span className="text-white font-medium ml-1">{role}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {sources.map(source => (
            <div
              key={source.id}
              className={`border rounded-xl p-6 ${colors[source.id] || 'border-gray-700 bg-gray-900'}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-white font-semibold text-lg">{source.name}</h3>
                  <p className="text-gray-400 text-sm mt-0.5">{source.description}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${badges[source.id] || 'bg-gray-700 text-gray-300'}`}>
                  {source.tables.length} tables
                </span>
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                {source.tables.map(table => (
                  <span
                    key={table}
                    className="px-3 py-1 bg-gray-800 border border-gray-700 rounded-lg text-xs text-gray-300 font-mono"
                  >
                    {table}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default DataSources;