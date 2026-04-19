import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import { HiOutlineMenu, HiOutlineX } from 'react-icons/hi';

const DashboardLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <Sidebar />

      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed bottom-4 right-4 z-40 w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition"
      >
        <HiOutlineMenu size={24} />
      </button>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white dark:bg-gray-800 shadow-xl overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
              <span className="font-bold text-gray-900 dark:text-white">Menu</span>
              <button onClick={() => setMobileOpen(false)} className="text-gray-500 hover:text-gray-700">
                <HiOutlineX size={24} />
              </button>
            </div>
            <Sidebar mobile onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
