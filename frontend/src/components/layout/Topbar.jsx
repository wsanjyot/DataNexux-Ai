import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const Topbar = ({ title }) => {
  const { logout } = useAuth();
  const navigate   = useNavigate();

  const handleLogout = () => {
    logout();
    toast.info('Logged out');
    navigate('/login');
  };

  return (
    <header className="h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6">
      <h2 className="text-white font-semibold text-base pl-8 lg:pl-0">{title}</h2>
      <button
        onClick={handleLogout}
        className="text-sm text-gray-400 hover:text-white transition"
      >
        Logout
      </button>
    </header>
  );
};

export default Topbar;