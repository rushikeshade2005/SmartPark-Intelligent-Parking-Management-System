import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  HiOutlineViewGrid, HiOutlineTicket, HiOutlineCreditCard,
  HiOutlineUser, HiOutlineTruck, HiOutlineLogout, HiOutlineMail,
} from 'react-icons/hi';
import { FiTruck } from 'react-icons/fi';

const Sidebar = ({ mobile, onClose }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const links = [
    { name: 'Dashboard', path: '/dashboard', icon: HiOutlineViewGrid },
    { name: 'Book Parking', path: '/dashboard/book', icon: HiOutlineTruck },
    { name: 'My Bookings', path: '/dashboard/bookings', icon: HiOutlineTicket },
    { name: 'Payments', path: '/dashboard/payments', icon: HiOutlineCreditCard },
    { name: 'My Vehicles', path: '/dashboard/vehicles', icon: FiTruck },
    { name: 'Messages', path: '/dashboard/messages', icon: HiOutlineMail },
    { name: 'Profile', path: '/dashboard/profile', icon: HiOutlineUser },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleClick = () => {
    if (mobile && onClose) onClose();
  };

  return (
    <aside className={mobile ? 'w-full' : 'w-64 sticky top-16 h-[calc(100vh-4rem)] bg-white dark:bg-dark-card border-r border-gray-200 dark:border-dark-border hidden lg:block overflow-y-auto'}>
      <div className="p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">User Panel</h2>
        <nav className="space-y-1">
          {links.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.path === '/dashboard'}
              onClick={handleClick}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-border'
                }`
              }
            >
              <link.icon size={20} />
              {link.name}
            </NavLink>
          ))}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 w-full transition-all duration-200 mt-4"
          >
            <HiOutlineLogout size={20} />
            Logout
          </button>
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
