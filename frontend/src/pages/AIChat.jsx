import { useState } from 'react';
import Layout from '../components/layout/Layout';
import api from '../services/api';
import { toast } from 'react-toastify';
import {
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const SUGGESTIONS = [
  'Show me the top 5 products by price',
  'Which city has the most customers?',
  'What is the total revenue for each region?',
  'How many orders are in each status?',
  'Show me the top 10 customers by name',
  'What are the most expensive products in Electronics?',
];

const ResultsPanel = ({ data }) => {
  const [view, setView] = useState('table');

  if (!data) return null;

  const isNumeric = (val) => !isNaN(parseFloat(val)) && isFinite(val);
  const numericCols = data.columns.filter(col =>
    data.rows.length > 0 && isNumeric(data.rows[0][col])
  );
  const labelCol = data.columns.find(col => !isNumeric(data.rows[0]?.[col]));

  const chartData = data.rows.map(row => {
    const obj = {};
    data.columns.forEach(col => { obj[col] = row[col]; });
    return obj;
  });

  return (
    <div className="mt-3">
      {numericCols.length > 0 && (
        <div className="flex gap-2 mb-3">
          {['table', 'chart'].map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                view === v
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      )}

      {view === 'table' && (
        <div className="overflow-x-auto rounded-lg border border-gray-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-800">
                {data.columns.map(col => (
                  <th key={col} className="px-4 py-2 text-left text-gray-400 font-medium">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row, i) => (
                <tr key={i} className="border-t border-gray-800 hover:bg-gray-800 transition">
                  {data.columns.map(col => (
                    <td key={col} className="px-4 py-2 text-gray-300">
                      {row[col] !== null ? String(row[col]) : '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === 'chart' && numericCols.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-4">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151"/>
              <XAxis
                dataKey={labelCol}
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                interval={0}
                angle={-30}
                textAnchor="end"
                height={50}
              />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }}/>
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', color: '#fff' }}/>
              <Legend />
              {numericCols.map((col, i) => (
                <Bar key={col} dataKey={col} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]}/>
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

const Message = ({ msg }) => (
  <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
    <div className={`max-w-3xl w-full ${msg.role === 'user' ? 'ml-12' : 'mr-4'}`}>

      {msg.role === 'user' && (
        <div className="bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm">
          {msg.content}
        </div>
      )}

      {msg.role === 'ai' && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl rounded-tl-sm p-4">
          {msg.loading ? (
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"/>
              Generating SQL and fetching results...
            </div>
          ) : msg.error ? (
            <p className="text-red-400 text-sm">{msg.error}</p>
          ) : (
            <>
              <p className="text-gray-300 text-sm mb-3">
                Found <span className="text-white font-medium">{msg.data?.count}</span> results
              </p>

              {/* AI Insights */}
              {msg.insights && (
                <div className="bg-blue-950 border border-blue-800 rounded-lg px-4 py-3 mb-3">
                  <p className="text-xs text-blue-400 font-medium mb-1">AI Insights</p>
                  <p className="text-blue-200 text-sm leading-relaxed">{msg.insights}</p>
                </div>
              )}

              {/* Generated SQL */}
              <div className="bg-gray-950 border border-gray-700 rounded-lg p-3 mb-3">
                <p className="text-xs text-gray-500 mb-1">Generated SQL</p>
                <code className="text-green-400 text-xs font-mono">{msg.sql}</code>
              </div>

              <ResultsPanel data={msg.data} />
            </>
          )}
        </div>
      )}
    </div>
  </div>
);

const AIChat = () => {
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading]   = useState(false);

  const sendQuestion = async (q) => {
    const text = q || question.trim();
    if (!text) return;

    const newMessages = [
      ...messages,
      { role: 'user', content: text },
      { role: 'ai', loading: true },
    ];

    setMessages(newMessages);
    setQuestion('');
    setLoading(true);

    try {
      const history = messages
        .filter(m => !m.loading)
        .map(m => ({
          role:    m.role === 'user' ? 'user' : 'assistant',
          content: m.role === 'user'
            ? m.content
            : `SQL: ${m.sql || ''} — returned ${m.data?.count || 0} rows`,
        }));

      const res = await api.post('/api/ai/ask', {
        question: text,
        history,
      });

      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role:     'ai',
          sql:      res.data.sql,
          insights: res.data.insights,
          data: {
            columns: res.data.columns,
            rows:    res.data.rows,
            count:   res.data.count,
          },
        };
        return updated;
      });
    } catch (err) {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role:  'ai',
          error: err.response?.data?.error || 'Something went wrong',
        };
        return updated;
      });
      toast.error('AI request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="AI Chat">
      <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-8rem)]">

        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center">
            <h2 className="text-2xl font-bold text-white mb-2">Ask your data anything</h2>
            <p className="text-gray-400 mb-8">Type a question in plain English and get instant results</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => sendQuestion(s)}
                  className="text-left px-4 py-3 bg-gray-900 border border-gray-800 hover:border-blue-500 rounded-xl text-sm text-gray-300 hover:text-white transition"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.length > 0 && (
          <div className="flex-1 overflow-y-auto py-4 space-y-2">
            {messages.map((msg, i) => <Message key={i} msg={msg} />)}
          </div>
        )}

        {messages.length > 0 && (
          <div className="flex justify-end mb-2">
            <button
              onClick={() => setMessages([])}
              className="text-xs text-gray-500 hover:text-gray-300 transition"
            >
              Clear chat
            </button>
          </div>
        )}

        <div className="pt-4 border-t border-gray-800">
          <div className="flex gap-3">
            <input
              type="text"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !loading && sendQuestion()}
              placeholder="Ask a question about your data..."
              disabled={loading}
              className="flex-1 bg-gray-900 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition disabled:opacity-50"
            />
            <button
              onClick={() => sendQuestion()}
              disabled={loading || !question.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-3 rounded-xl text-sm font-medium transition"
            >
              Ask
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AIChat;