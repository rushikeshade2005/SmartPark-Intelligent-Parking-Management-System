import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  HiOutlineHome, HiOutlineOfficeBuilding, HiOutlineViewGrid,
  HiOutlineUsers, HiOutlineClipboardList, HiOutlineCreditCard,
  HiOutlineLogout, HiOutlineMail,
  HiOutlineChartPie, HiOutlineStatusOnline,
} from 'react-icons/hi';

const sections = [
  {
    label: 'Main',
    items: [
      { name: 'Overview', path: '/admin', icon: HiOutlineHome },
    ],
  },
  {
    label: 'Parking',
    items: [
      { name: 'Parking Lots', path: '/admin/parking-lots', icon: HiOutlineOfficeBuilding },
      { name: 'Manage Slots', path: '/admin/slots', icon: HiOutlineViewGrid },
    ],
  },
  {
    label: 'Operations',
    items: [
      { name: 'Users', path: '/admin/users', icon: HiOutlineUsers },
      { name: 'Bookings', path: '/admin/bookings', icon: HiOutlineClipboardList },
      { name: 'Payments', path: '/admin/payments', icon: HiOutlineCreditCard },
      { name: 'Analytics', path: '/admin/analytics', icon: HiOutlineChartPie },
      { name: 'Live Monitor', path: '/admin/monitoring', icon: HiOutlineStatusOnline },
    ],
  },
  {
    label: 'Communication',
    items: [
      { name: 'Messages', path: '/admin/messages', icon: HiOutlineMail },
    ],
  },
];

const AdminSidebar = ({ mobile, onClose }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleClick = () => {
    if (mobile && onClose) onClose();
  };

  return (
    <aside className={mobile ? 'w-full' : 'w-64 sticky top-16 h-[calc(100vh-4rem)] bg-white dark:bg-dark-card border-r border-gray-200 dark:border-dark-border hidden lg:block overflow-y-auto'}>
      <div className="p-5">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Admin Panel</h2>
          <p className="text-xs text-gray-400 mt-0.5">Manage your parking system</p>
        </div>

        {/* Navigation */}
        <nav className="space-y-5">
          {sections.map((section) => (
            <div key={section.label}>
              <p className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map((link) => (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    end={link.path === '/admin'}
                    onClick={handleClick}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-border hover:text-gray-900 dark:hover:text-white'
                      }`
                    }
                  >
                    <link.icon size={18} />
                    {link.name}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-dark-border">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 w-full transition-colors"
          >
            <HiOutlineLogout size={18} />
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;
