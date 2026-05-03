import { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import api from '../services/api';
import { toast } from 'react-toastify';
import { TableSkeleton } from '../components/shared/Skeleton';
import {
    BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
const OPERATORS = ['=', '!=', '>', '<', '>=', '<=', 'LIKE', 'ILIKE'];

const ResultsPanel = ({ result }) => {
    const [view, setView] = useState('table');
    if (!result) return null;

    const isNumeric = val => !isNaN(parseFloat(val)) && isFinite(val);
    const numericCols = result.columns.filter(col =>
        result.rows.length > 0 && isNumeric(result.rows[0][col])
    );
    const labelCol = result.columns.find(col =>
        result.rows.length > 0 && !isNumeric(result.rows[0][col])
    );

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mt-4">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <p className="text-white font-medium">Results</p>
                    <p className="text-gray-400 text-xs mt-0.5">{result.count} rows returned</p>
                </div>
                <div className="flex gap-2">
                    {['table', 'chart'].map(v => (
                        <button
                            key={v}
                            onClick={() => setView(v)}
                            className={`px-3 py-1 rounded-lg text-xs font-medium transition ${view === v ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                                }`}
                        >
                            {v.charAt(0).toUpperCase() + v.slice(1)}
                        </button>
                    ))}
                    <button
                        onClick={async () => {
                            try {
                                await api.post('/api/export', {
                                    columns: result.columns,
                                    rows: result.rows,
                                    format: 'xlsx',
                                    filename: 'query_export',
                                }, { responseType: 'blob' }).then(res => {
                                    const url = window.URL.createObjectURL(new Blob([res.data]));
                                    const link = document.createElement('a');
                                    link.href = url;
                                    link.setAttribute('download', 'query_export.xlsx');
                                    document.body.appendChild(link);
                                    link.click();
                                    link.remove();
                                });
                                toast.success('Exported successfully');
                            } catch {
                                toast.error('Export failed');
                            }
                        }}
                        className="px-3 py-1 rounded-lg text-xs font-medium bg-green-700 hover:bg-green-600 text-white transition"
                    >
                        Export XLSX
                    </button>
                </div>
            </div>

            {/* SQL display */}
            <div className="bg-gray-950 border border-gray-700 rounded-lg p-3 mb-4">
                <p className="text-xs text-gray-500 mb-1">Generated SQL</p>
                <code className="text-green-400 text-xs font-mono">{result.sql}</code>
            </div>

            {/* Table */}
            {view === 'table' && (
                <div className="overflow-x-auto rounded-lg border border-gray-700">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-800">
                                {result.columns.map(col => (
                                    <th key={col} className="px-4 py-2 text-left text-gray-400 font-medium">{col}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {result.rows.map((row, i) => (
                                <tr key={i} className="border-t border-gray-800 hover:bg-gray-800 transition">
                                    {result.columns.map(col => (
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

            {/* Chart */}
            {view === 'chart' && numericCols.length > 0 && (
                <div className="bg-gray-800 rounded-lg p-4">
                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={result.rows}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey={labelCol} tick={{ fill: '#9ca3af', fontSize: 11 }} angle={-20} textAnchor="end" height={50} />
                            <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
                            <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', color: '#fff' }} />
                            <Legend />
                            {numericCols.map((col, i) => (
                                <Bar key={col} dataKey={col} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
};

const QueryBuilder = () => {
    const [sources, setSources] = useState([]);
    const [table, setTable] = useState('');
    const [conditions, setConditions] = useState([]);
    const [orderBy, setOrderBy] = useState('');
    const [direction, setDirection] = useState('ASC');
    const [limit, setLimit] = useState(50);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        api.get('/api/sources').then(res => {
            const allTables = res.data.sources.flatMap(s => s.tables);
            setSources(allTables);
        });
    }, []);

    const addCondition = () => {
        setConditions([...conditions, { column: '', operator: '=', value: '' }]);
    };

    const updateCondition = (i, field, val) => {
        const updated = [...conditions];
        updated[i][field] = val;
        setConditions(updated);
    };

    const removeCondition = (i) => {
        setConditions(conditions.filter((_, idx) => idx !== i));
    };

    const runQuery = async () => {
        if (!table) return toast.error('Please select a table');
        setLoading(true);
        try {
            const res = await api.post('/api/query/run', {
                table,
                conditions: conditions.filter(c => c.column && c.value),
                orderBy: orderBy || undefined,
                direction,
                limit,
            });
            setResult(res.data);
            toast.success(`${res.data.count} rows returned`);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Query failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout title="Query Builder">
            <div className="max-w-4xl mx-auto">
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                    <h3 className="text-white font-semibold mb-5">Build your query</h3>

                    {/* Table selector */}
                    <div className="mb-5">
                        <label className="block text-sm text-gray-400 mb-1">Table</label>
                        <select
                            value={table}
                            onChange={e => setTable(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500"
                        >
                            <option value="">Select a table...</option>
                            {sources.map(t => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>

                    {/* Conditions */}
                    <div className="mb-5">
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm text-gray-400">Conditions (WHERE)</label>
                            <button
                                onClick={addCondition}
                                className="text-xs text-blue-400 hover:text-blue-300 transition"
                            >
                                + Add condition
                            </button>
                        </div>
                        {conditions.length === 0 && (
                            <p className="text-xs text-gray-600 italic">No conditions — returns all rows</p>
                        )}
                        <div className="space-y-2">
                            {conditions.map((cond, i) => (
                                <div key={i} className="flex gap-2 items-center">
                                    <input
                                        placeholder="column"
                                        value={cond.column}
                                        onChange={e => updateCondition(i, 'column', e.target.value)}
                                        className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                                    />
                                    <select
                                        value={cond.operator}
                                        onChange={e => updateCondition(i, 'operator', e.target.value)}
                                        className="bg-gray-800 border border-gray-700 text-white rounded-lg px-2 py-2 text-sm focus:outline-none"
                                    >
                                        {OPERATORS.map(op => <option key={op}>{op}</option>)}
                                    </select>
                                    <input
                                        placeholder="value"
                                        value={cond.value}
                                        onChange={e => updateCondition(i, 'value', e.target.value)}
                                        className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                                    />
                                    <button
                                        onClick={() => removeCondition(i)}
                                        className="text-red-400 hover:text-red-300 text-lg leading-none"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Order + Limit */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Order by</label>
                            <input
                                placeholder="column name"
                                value={orderBy}
                                onChange={e => setOrderBy(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Direction</label>
                            <select
                                value={direction}
                                onChange={e => setDirection(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none"
                            >
                                <option>ASC</option>
                                <option>DESC</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Limit</label>
                            <input
                                type="number"
                                value={limit}
                                onChange={e => setLimit(e.target.value)}
                                min={1}
                                max={1000}
                                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>

                    {/* Run button */}
                    <button
                        onClick={runQuery}
                        disabled={loading || !table}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition"
                    >
                        {loading ? 'Running...' : 'Run Query'}
                    </button>
                </div>

                {loading && <div className="mt-4"><TableSkeleton rows={5} /></div>}
                {!loading && result && <ResultsPanel result={result} />}
            </div>
        </Layout>
    );
};

export default QueryBuilder;