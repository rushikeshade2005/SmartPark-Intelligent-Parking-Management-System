import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { formatDate, formatCurrency, getStatusBadge } from '../../utils/helpers';

const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await api.get('/bookings/all');
      setBookings(res.data.data);
    } catch {
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const filtered =
    filter === 'all'
      ? bookings
      : bookings.filter((b) => b.bookingStatus === filter);

  const tabs = ['all', 'confirmed', 'active', 'completed', 'cancelled'];

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">All Bookings</h1>

      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
              filter === t
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-dark-card dark:text-gray-400 dark:hover:bg-dark-border'
            }`}
          >
            {t} {t !== 'all' ? `(${bookings.filter((b) => b.bookingStatus === t).length})` : `(${bookings.length})`}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-dark-border">
                <th className="py-3 px-4 font-medium">User</th>
                <th className="py-3 px-4 font-medium">Parking Lot</th>
                <th className="py-3 px-4 font-medium">Vehicle</th>
                <th className="py-3 px-4 font-medium">Date</th>
                <th className="py-3 px-4 font-medium">Duration</th>
                <th className="py-3 px-4 font-medium">Amount</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-dark-border">
              {filtered.map((booking) => (
                <motion.tr
                  key={booking._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-gray-50 dark:hover:bg-dark-border/30"
                >
                  <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">
                    {booking.userId?.name || 'Unknown'}
                  </td>
                  <td className="py-3 px-4 text-gray-500 dark:text-gray-400">
                    {booking.parkingLotId?.name || 'Unknown'}
                  </td>
                  <td className="py-3 px-4 text-gray-500 dark:text-gray-400">{booking.vehicleNumber}</td>
                  <td className="py-3 px-4 text-gray-500 dark:text-gray-400">{formatDate(booking.startTime)}</td>
                  <td className="py-3 px-4 text-gray-500 dark:text-gray-400">{booking.duration}h</td>
                  <td className="py-3 px-4 font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(booking.totalAmount)}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusBadge(booking.bookingStatus)}`}>
                      {booking.bookingStatus}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        booking.paymentStatus === 'paid'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}
                    >
                      {booking.paymentStatus}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="text-center py-8 text-gray-500">No bookings found</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminBookings;
