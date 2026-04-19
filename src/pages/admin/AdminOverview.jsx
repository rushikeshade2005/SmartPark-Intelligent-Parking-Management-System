import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../../services/api';
import StatCard from '../../components/ui/StatCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDateTime, getStatusBadge } from '../../utils/helpers';
import {
  HiOutlineUsers, HiOutlineOfficeBuilding, HiOutlineViewGrid,
  HiOutlineCash, HiOutlineTicket,
} from 'react-icons/hi';

const AdminOverview = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [myDashboard, setMyDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [analyticsRes, myDashboardRes] = await Promise.all([
          api.get('/admin/my-analytics'),
          api.get('/admin/my-dashboard'),
        ]);
        setAnalytics(analyticsRes.data.data);
        setMyDashboard(myDashboardRes.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome, {myDashboard?.profile?.name || user?.name || 'Admin'}</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Your admin dashboard with account details and system overview</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Admin Profile</h2>
          <div className="space-y-2 text-sm">
            <p className="text-gray-600 dark:text-gray-300"><span className="font-semibold">Name:</span> {myDashboard?.profile?.name || '-'}</p>
            <p className="text-gray-600 dark:text-gray-300"><span className="font-semibold">Email:</span> {myDashboard?.profile?.email || '-'}</p>
            <p className="text-gray-600 dark:text-gray-300"><span className="font-semibold">Phone:</span> {myDashboard?.profile?.phoneNumber || '-'}</p>
            <p className="text-gray-600 dark:text-gray-300"><span className="font-semibold">Joined:</span> {myDashboard?.profile?.joinedAt ? formatDateTime(myDashboard.profile.joinedAt) : '-'}</p>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Your Admin Stats</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-gray-50 dark:bg-dark-bg p-3">
              <p className="text-xs text-gray-500">Total Admins</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{myDashboard?.myStats?.totalAdmins || 0}</p>
            </div>
            <div className="rounded-lg bg-gray-50 dark:bg-dark-bg p-3">
              <p className="text-xs text-gray-500">Managed Lots</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{myDashboard?.myStats?.managedLots || 0}</p>
            </div>
            <div className="rounded-lg bg-gray-50 dark:bg-dark-bg p-3">
              <p className="text-xs text-gray-500">Managed Slots</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{myDashboard?.myStats?.managedSlots || 0}</p>
            </div>
            <div className="rounded-lg bg-gray-50 dark:bg-dark-bg p-3">
              <p className="text-xs text-gray-500">Managed Bookings</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{myDashboard?.myStats?.managedBookings || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mt-6">
        <StatCard title="Total Users" value={analytics?.totalUsers || 0} icon={HiOutlineUsers} color="primary" />
        <StatCard title="Parking Lots" value={analytics?.totalLots || 0} icon={HiOutlineOfficeBuilding} color="blue" />
        <StatCard title="Total Slots" value={analytics?.totalSlots || 0} icon={HiOutlineViewGrid} color="purple" />
        <StatCard title="Available" value={analytics?.availableSlots || 0} icon={HiOutlineViewGrid} color="green" />
        <StatCard title="Bookings" value={analytics?.totalBookings || 0} icon={HiOutlineTicket} color="yellow" />
        <StatCard title="Revenue" value={formatCurrency(analytics?.totalRevenue || 0)} icon={HiOutlineCash} color="green" />
      </div>

      {/* Slot Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Slot Distribution</h2>
          <div className="space-y-4">
            {[
              { label: 'Available', value: analytics?.availableSlots || 0, color: 'bg-green-500', total: analytics?.totalSlots },
              { label: 'Reserved', value: analytics?.reservedSlots || 0, color: 'bg-yellow-500', total: analytics?.totalSlots },
              { label: 'Occupied', value: analytics?.occupiedSlots || 0, color: 'bg-red-500', total: analytics?.totalSlots },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-400">{item.label}</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {item.value} ({item.total > 0 ? Math.round((item.value / item.total) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full h-3 bg-gray-200 dark:bg-dark-border rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full transition-all duration-500`}
                    style={{ width: `${item.total > 0 ? (item.value / item.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Popular Lots */}
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Popular Parking Lots</h2>
          {analytics?.popularLots?.length > 0 ? (
            <div className="space-y-3">
              {analytics.popularLots.map((lot, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-bg rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center text-primary-600 font-bold text-sm">
                      #{i + 1}
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">{lot.name}</span>
                  </div>
                  <span className="text-sm text-gray-500">{lot.bookings} bookings</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No data available yet</p>
          )}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Parking Lots Managed By You</h2>
        <div className="card">
          {myDashboard?.managedLots?.length > 0 ? (
            <div className="space-y-3">
              {myDashboard.managedLots.map((lot) => (
                <div key={lot._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-bg rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{lot.name}</p>
                    <p className="text-xs text-gray-500">{lot.city} • Created {formatDateTime(lot.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{lot.availableSlots}/{lot.totalSlots}</p>
                    <p className="text-xs text-gray-500">Available Slots</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No parking lots assigned to your admin account yet.</p>
          )}
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="mt-8">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Recent Bookings</h2>
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-dark-border">
                <th className="pb-3 font-medium">User</th>
                <th className="pb-3 font-medium">Parking Lot</th>
                <th className="pb-3 font-medium">Slot</th>
                <th className="pb-3 font-medium">Amount</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {analytics?.recentBookings?.map((b) => (
                <tr key={b._id} className="border-b border-gray-50 dark:border-dark-border/50">
                  <td className="py-3 font-medium text-gray-900 dark:text-white">
                    {b.userId?.name || 'N/A'}
                  </td>
                  <td className="py-3 text-gray-600 dark:text-gray-400">{b.parkingLotId?.name || 'N/A'}</td>
                  <td className="py-3 text-gray-600 dark:text-gray-400">{b.slotId?.slotNumber || 'N/A'}</td>
                  <td className="py-3 font-medium">{formatCurrency(b.totalAmount)}</td>
                  <td className="py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(b.bookingStatus)}`}>
                      {b.bookingStatus}
                    </span>
                  </td>
                  <td className="py-3 text-gray-500">{formatDateTime(b.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!analytics?.recentBookings || analytics.recentBookings.length === 0) && (
            <p className="text-center py-8 text-gray-500">No bookings yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
