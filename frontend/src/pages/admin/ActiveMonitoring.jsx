import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StatCard from '../../components/ui/StatCard';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../utils/helpers';
import {
  HiOutlineClock,
  HiOutlineExclamation,
  HiOutlineExclamationCircle,
  HiOutlineBan,
  HiOutlineRefresh,
} from 'react-icons/hi';

const URGENCY_CONFIG = {
  overdue: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', badge: 'bg-red-600', label: 'Overdue', pulse: true },
  critical: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400', badge: 'bg-orange-500', label: 'Critical', pulse: true },
  warning: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', badge: 'bg-yellow-500', label: 'Warning', pulse: false },
  normal: { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-400', badge: 'bg-green-500', label: 'Normal', pulse: false },
};

const formatCountdown = (minutesLeft) => {
  if (minutesLeft <= 0) {
    const over = Math.abs(minutesLeft);
    const h = Math.floor(over / 60);
    const m = over % 60;
    return h > 0 ? `+${h}h ${m}m overdue` : `+${m}m overdue`;
  }
  const h = Math.floor(minutesLeft / 60);
  const m = minutesLeft % 60;
  return h > 0 ? `${h}h ${m}m left` : `${m}m left`;
};

const formatTime = (date) =>
  new Date(date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

const formatDateTime = (date) =>
  new Date(date).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

const ActiveMonitoring = () => {
  const [bookings, setBookings] = useState([]);
  const [summary, setSummary] = useState({ total: 0, active: 0, confirmed: 0, overdue: 0, critical: 0, warning: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const intervalRef = useRef(null);

  const fetchData = async () => {
    try {
      const res = await api.get('/admin/active-bookings');
      setBookings(res.data.data);
      setSummary(res.data.summary);
    } catch {
      toast.error('Failed to load monitoring data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto-refresh every 30 seconds
    intervalRef.current = setInterval(fetchData, 30000);

    const socket = getSocket();
    if (socket) {
      socket.on('bookingUpdate', fetchData);
      socket.on('bookingExpired', fetchData);
    }

    return () => {
      clearInterval(intervalRef.current);
      if (socket) {
        socket.off('bookingUpdate', fetchData);
        socket.off('bookingExpired', fetchData);
      }
    };
  }, []);

  // Live countdown ticker — decrements minutesLeft locally every 60s
  useEffect(() => {
    const ticker = setInterval(() => {
      setBookings((prev) =>
        prev.map((b) => {
          const newMin = b.minutesLeft - 1;
          let urgency = 'normal';
          if (newMin < 0) urgency = 'overdue';
          else if (newMin <= 15) urgency = 'critical';
          else if (newMin <= 60) urgency = 'warning';
          return { ...b, minutesLeft: newMin, isOverdue: newMin < 0, urgency };
        })
      );
    }, 60000);
    return () => clearInterval(ticker);
  }, []);

  const handleForceCheckout = async (id) => {
    if (!window.confirm('Force checkout this booking? Any overdue charges will be applied.')) return;
    try {
      await api.put(`/bookings/check-out/${id}`);
      toast.success('Booking checked out');
      fetchData();
    } catch {
      toast.error('Checkout failed');
    }
  };

  const filtered =
    filter === 'all' ? bookings : bookings.filter((b) => b.urgency === filter);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Live Monitor</h1>
        <button
          onClick={() => { setLoading(true); fetchData(); }}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-dark-card dark:text-gray-400 dark:hover:bg-dark-border transition-colors"
        >
          <HiOutlineRefresh className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Active" value={summary.total} icon={HiOutlineClock} color="blue" />
        <StatCard title="Overdue" value={summary.overdue} icon={HiOutlineBan} color="red" />
        <StatCard title="Critical (<15m)" value={summary.critical} icon={HiOutlineExclamationCircle} color="orange" />
        <StatCard title="Warning (<1h)" value={summary.warning} icon={HiOutlineExclamation} color="yellow" />
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['all', 'overdue', 'critical', 'warning', 'normal'].map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
              filter === t
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-dark-card dark:text-gray-400 dark:hover:bg-dark-border'
            }`}
          >
            {t} ({t === 'all' ? bookings.length : bookings.filter((b) => b.urgency === t).length})
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <HiOutlineClock className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No active bookings to monitor</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => {
            const cfg = URGENCY_CONFIG[b.urgency];
            return (
              <motion.div
                key={b._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`card p-4 border-l-4 ${
                  b.urgency === 'overdue' ? 'border-l-red-500' :
                  b.urgency === 'critical' ? 'border-l-orange-500' :
                  b.urgency === 'warning' ? 'border-l-yellow-500' : 'border-l-green-500'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left: User & Vehicle */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold text-white ${cfg.badge} ${cfg.pulse ? 'animate-pulse' : ''}`}>
                        {cfg.label}
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-white truncate">
                        {b.user?.name || 'Unknown User'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 space-y-0.5">
                      <p>Vehicle: <span className="font-medium text-gray-700 dark:text-gray-300">{b.vehicleNumber}</span></p>
                      <p>{b.parkingLot?.name} &middot; Slot {b.slot?.slotNumber}</p>
                    </div>
                  </div>

                  {/* Center: Time Info */}
                  <div className="text-sm text-center">
                    <p className="text-gray-500 dark:text-gray-400">
                      {formatTime(b.startTime)} — {formatTime(b.endTime)}
                    </p>
                    <p className={`text-lg font-bold ${cfg.text}`}>
                      {formatCountdown(b.minutesLeft)}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 capitalize">{b.bookingStatus} &middot; {formatCurrency(b.totalAmount)}</p>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2">
                    {b.isOverdue && (
                      <button
                        onClick={() => handleForceCheckout(b._id)}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Force Checkout
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ActiveMonitoring;
