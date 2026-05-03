import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';

import Login        from './pages/Login';
import Dashboard    from './pages/Dashboard';
import QueryBuilder from './pages/QueryBuilder';
import AIChat       from './pages/AIChat';
import DataSources  from './pages/DataSources';
import Scheduler    from './pages/Scheduler';
import AuditLogs    from './pages/AuditLogs';

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }/>

        <Route path="/query" element={
          <ProtectedRoute roles={['admin', 'analyst']}>
            <QueryBuilder />
          </ProtectedRoute>
        }/>

        <Route path="/ai" element={
          <ProtectedRoute roles={['admin', 'analyst']}>
            <AIChat />
          </ProtectedRoute>
        }/>

        <Route path="/sources" element={
          <ProtectedRoute roles={['admin', 'analyst']}>
            <DataSources />
          </ProtectedRoute>
        }/>

        <Route path="/scheduler" element={
          <ProtectedRoute roles={['admin', 'analyst']}>
            <Scheduler />
          </ProtectedRoute>
        }/>

        <Route path="/audit" element={
          <ProtectedRoute roles={['admin']}>
            <AuditLogs />
          </ProtectedRoute>
        }/>
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AnimatedRoutes />
      </BrowserRouter>
      <ToastContainer position="top-right" autoClose={3000} />
    </AuthProvider>
  );
}

export default App;