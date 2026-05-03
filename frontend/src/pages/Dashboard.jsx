import { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { KPISkeleton, ChartSkeleton } from '../components/shared/Skeleton';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
const useCountUp = (target, duration = 1500) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!target) return;

    const isRevenue = typeof target === 'string' && target.includes('₹');
    const numericTarget = isRevenue
      ? parseFloat(target.replace('₹', '').replace('L', ''))
      : parseInt(target);

    if (isNaN(numericTarget)) return;

    let start = 0;
    const increment = numericTarget / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= numericTarget) {
        setCount(numericTarget);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 16);

    return () => clearInterval(timer);
  }, [target, duration]);

  const isRevenue = typeof target === 'string' && target.includes('₹');
  if (isRevenue) return `₹${count.toFixed(1)}L`;
  return Math.floor(count).toLocaleString();
};

const KPICard = ({ title, value, sub, color }) => {
  const animated = useCountUp(value);
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-600 transition-all duration-300">
      <p className="text-gray-400 text-sm">{title}</p>
      <p className={`text-2xl font-bold mt-1 ${color || 'text-white'}`}>
        {value ? animated : '—'}
      </p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
};

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const safeQuery = async (payload) => {
  try {
    const res = await api.post('/api/query/run', payload);
    return res.data;
  } catch {
    return { rows: [], count: 0, columns: [] };
  }
};

const Dashboard = () => {
  const { user } = useAuth();
  const [kpis, setKpis]               = useState(null);
  const [salesData, setSalesData]     = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [orderStatus, setOrderStatus] = useState([]);
  const [traffic, setTraffic]         = useState([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const ordersRes    = await safeQuery({ table: 'orders', limit: 1000 });
        const revenueRes   = await safeQuery({ table: 'orders', columns: ['total'], limit: 1000 });
        const customersRes = await safeQuery({ table: 'customers', limit: 1000 });
        const productsRes  = await safeQuery({ table: 'products', limit: 1000 });

        const revenue = revenueRes.rows
          .reduce((sum, r) => sum + parseFloat(r.total || 0), 0);

        setKpis({
          revenue:   `₹${(revenue / 100000).toFixed(1)}L`,
          orders:    ordersRes.count,
          customers: customersRes.count,
          products:  productsRes.count,
        });

        const statusCount = {};
        ordersRes.rows.forEach(r => {
          statusCount[r.status] = (statusCount[r.status] || 0) + 1;
        });
        setOrderStatus(Object.entries(statusCount).map(([name, value]) => ({ name, value })));

        const productsTop = await safeQuery({
          table:     'products',
          columns:   ['name', 'price', 'category'],
          orderBy:   'price',
          direction: 'DESC',
          limit:     8,
        });
        setTopProducts(productsTop.rows.map(r => ({
          name:  r.name.length > 12 ? r.name.slice(0, 12) + '…' : r.name,
          price: parseFloat(r.price),
        })));

        if (user?.role === 'admin' || user?.role === 'analyst') {
          const salesRes = await safeQuery({
            table:     'monthly_sales',
            columns:   ['month', 'region', 'revenue'],
            orderBy:   'month',
            direction: 'ASC',
            limit:     60,
          });

          const trafficRes = await safeQuery({
            table:     'website_traffic',
            columns:   ['date', 'visitors', 'conversions'],
            orderBy:   'date',
            direction: 'ASC',
            limit:     30,
          });

          const salesMap = {};
          salesRes.rows.forEach(r => {
            const m = r.month?.slice(0, 7);
            if (!salesMap[m]) salesMap[m] = { month: m };
            salesMap[m][r.region] = parseFloat(r.revenue);
          });
          setSalesData(Object.values(salesMap).slice(-12));

          setTraffic(trafficRes.rows.map(r => ({
            date:        r.date?.slice(5),
            visitors:    r.visitors,
            conversions: r.conversions,
          })));
        }

      } catch (err) {
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [user]);

 if (loading) return (
  <Layout title="Dashboard">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {[...Array(4)].map((_, i) => <KPISkeleton key={i} />)}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
      <div className="lg:col-span-2"><ChartSkeleton height="h-60" /></div>
      <ChartSkeleton height="h-60" />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2"><ChartSkeleton height="h-56" /></div>
      <ChartSkeleton height="h-56" />
    </div>
  </Layout>
);

  return (
    <Layout title="Dashboard">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard title="Total Revenue"   value={kpis?.revenue}   color="text-green-400"  sub="All time" />
        <KPICard title="Total Orders"    value={kpis?.orders}    color="text-blue-400"   sub="All time" />
        <KPICard title="Total Customers" value={kpis?.customers} color="text-purple-400" sub="Registered" />
        <KPICard title="Total Products"  value={kpis?.products}  color="text-amber-400"  sub="In catalogue" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {(user?.role === 'admin' || user?.role === 'analyst') ? (
          <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-white font-medium mb-4">Monthly revenue by region</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151"/>
                <XAxis dataKey="month" tick={{ fill: '#9ca3af', fontSize: 11 }}/>
                <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }}/>
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', color: '#fff' }}/>
                <Legend />
                {['North', 'South', 'East', 'West', 'Central'].map((r, i) => (
                  <Bar key={r} dataKey={r} fill={COLORS[i]} radius={[2, 2, 0, 0]}/>
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-500 text-sm">Monthly sales data</p>
              <p className="text-gray-600 text-xs mt-1">Available to Analyst and Admin roles</p>
            </div>
          </div>
        )}

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-white font-medium mb-4">Order status</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={orderStatus}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
              >
                {orderStatus.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]}/>
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', color: '#fff' }}/>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {(user?.role === 'admin' || user?.role === 'analyst') ? (
          <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-white font-medium mb-4">Website traffic — last 30 days</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={traffic}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151"/>
                <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 10 }} interval={4}/>
                <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }}/>
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', color: '#fff' }}/>
                <Legend />
                <Line type="monotone" dataKey="visitors"    stroke="#3b82f6" strokeWidth={2} dot={false}/>
                <Line type="monotone" dataKey="conversions" stroke="#10b981" strokeWidth={2} dot={false}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-500 text-sm">Website traffic data</p>
              <p className="text-gray-600 text-xs mt-1">Available to Analyst and Admin roles</p>
            </div>
          </div>
        )}

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-white font-medium mb-4">Top products by price</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topProducts} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151"/>
              <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 10 }}/>
              <YAxis type="category" dataKey="name" tick={{ fill: '#9ca3af', fontSize: 10 }} width={80}/>
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', color: '#fff' }}/>
              <Bar dataKey="price" fill="#8b5cf6" radius={[0, 4, 4, 0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;