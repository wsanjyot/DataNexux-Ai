import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const nav = [
  { path: '/dashboard', label: 'Dashboard',     roles: ['admin', 'analyst', 'viewer'] },
  { path: '/query',     label: 'Query Builder', roles: ['admin', 'analyst'] },
  { path: '/ai',        label: 'AI Chat',       roles: ['admin', 'analyst'] },
  { path: '/sources',   label: 'Data Sources',  roles: ['admin', 'analyst'] },
  { path: '/scheduler', label: 'Scheduler',     roles: ['admin', 'analyst'] },
  { path: '/audit',     label: 'Audit Logs',    roles: ['admin'] },
];

const Sidebar = () => {
  const { user }        = useAuth();
  const [open, setOpen] = useState(false);

  const NavItems = () => (
    <>
      {nav
        .filter(item => item.roles.includes(user?.role))
        .map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `block px-4 py-2.5 rounded-lg text-sm transition ${
                isActive
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
    </>
  );

  return (
    <>
      {/* ── Mobile hamburger button ────────────────────────── */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-gray-900 border border-gray-700 rounded-lg p-2 text-gray-400 hover:text-white transition"
      >
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6"  x2="17" y2="6"/>
          <line x1="3" y1="10" x2="17" y2="10"/>
          <line x1="3" y1="14" x2="17" y2="14"/>
        </svg>
      </button>

      {/* ── Mobile overlay ─────────────────────────────────── */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-60 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Mobile drawer ──────────────────────────────────── */}
      <div className={`
        lg:hidden fixed top-0 left-0 h-full w-64 bg-gray-900 border-r border-gray-800
        z-50 transform transition-transform duration-300
        ${open ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="px-6 py-5 border-b border-gray-800 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white">
              DataNexus <span className="text-blue-500">AI</span>
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">Data Aggregation Platform</p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="text-gray-400 hover:text-white transition"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="4" y1="4" x2="16" y2="16"/>
              <line x1="16" y1="4" x2="4" y2="16"/>
            </svg>
          </button>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          <NavItems />
        </nav>
        <div className="px-4 py-4 border-t border-gray-800">
          <p className="text-sm text-white font-medium truncate">{user?.name}</p>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block
            ${user?.role === 'admin'   ? 'bg-red-900 text-red-300' :
              user?.role === 'analyst' ? 'bg-blue-900 text-blue-300' :
                                         'bg-gray-700 text-gray-300'}`}>
            {user?.role}
          </span>
        </div>
      </div>

      {/* ── Desktop sidebar ────────────────────────────────── */}
      <aside className="hidden lg:flex w-60 min-h-screen bg-gray-900 border-r border-gray-800 flex-col">
        <div className="px-6 py-5 border-b border-gray-800">
          <h1 className="text-lg font-bold text-white">
            DataNexus <span className="text-blue-500">AI</span>
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">Data Aggregation Platform</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          <NavItems />
        </nav>
        <div className="px-4 py-4 border-t border-gray-800">
          <p className="text-sm text-white font-medium truncate">{user?.name}</p>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block
            ${user?.role === 'admin'   ? 'bg-red-900 text-red-300' :
              user?.role === 'analyst' ? 'bg-blue-900 text-blue-300' :
                                         'bg-gray-700 text-gray-300'}`}>
            {user?.role}
          </span>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;