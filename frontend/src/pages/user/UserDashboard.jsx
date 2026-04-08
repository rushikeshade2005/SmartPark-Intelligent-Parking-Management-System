import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import StatCard from '../../components/ui/StatCard';
import { formatCurrency, formatDateTime, getStatusBadge } from '../../utils/helpers';
import { Link } from 'react-router-dom';
import {
  HiOutlineTicket, HiOutlineCreditCard, HiOutlineTruck, HiOutlineClock,
  HiOutlineLocationMarker, HiOutlineChatAlt2, HiOutlineUserCircle,
  HiOutlineCalendar, HiOutlineLightBulb, HiOutlineChevronRight,
  HiOutlineCheckCircle,
} from 'react-icons/hi';

const parkingTips = [
  { title: 'Book in Advance', desc: 'Reserve your spot at least 30 minutes early to guarantee availability during peak hours.', emoji: '⏰' },
  { title: 'Use Nearby Feature', desc: 'Find the closest parking lot to your destination and save time with GPS-based search.', emoji: '📍' },
  { title: 'Check-in On Time', desc: 'Arrive within your booked window. Late arrivals may lose their reservation.', emoji: '✅' },
  { title: 'Save Your QR Code', desc: 'Screenshot your booking QR code for quick entry — no internet needed at the gate.', emoji: '📱' },
  { title: 'Set Default Vehicle', desc: 'Save your vehicle in the dashboard to skip entering details every time you book.', emoji: '🚗' },
  { title: 'Review After Parking', desc: 'Leave a review to help other drivers find the best parking lots in the area.', emoji: '⭐' },
];

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return { text: 'Good Morning', emoji: '🌅' };
  if (hour < 17) return { text: 'Good Afternoon', emoji: '☀️' };
  if (hour < 21) return { text: 'Good Evening', emoji: '🌇' };
  return { text: 'Good Night', emoji: '🌙' };
};

const UserDashboard = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState('');
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/bookings/user');
        setBookings(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const activeBookings = bookings.filter((b) => ['confirmed', 'active'].includes(b.bookingStatus));
  const completedBookings = bookings.filter((b) => b.bookingStatus === 'completed');
  const totalSpent = bookings
    .filter((b) => b.paymentStatus === 'completed')
    .reduce((sum, b) => sum + b.totalAmount, 0);

  // Next upcoming booking
  const upcomingBooking = useMemo(() => {
    const now = new Date();
    return bookings
      .filter((b) => ['confirmed', 'active'].includes(b.bookingStatus) && new Date(b.startTime) > now)
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))[0] || null;
  }, [bookings]);

  // Active (ongoing) booking
  const ongoingBooking = useMemo(() => {
    const now = new Date();
    return bookings.find(
      (b) => b.bookingStatus === 'active' && new Date(b.startTime) <= now && new Date(b.endTime) >= now
    ) || null;
  }, [bookings]);

  // Live countdown timer
  useEffect(() => {
    const target = upcomingBooking || ongoingBooking;
    if (!target) { setCountdown(''); return; }

    const tick = () => {
      const now = new Date();
      const targetTime = upcomingBooking
        ? new Date(upcomingBooking.startTime)
        : new Date(ongoingBooking.endTime);
      const diff = targetTime - now;

      if (diff <= 0) { setCountdown('Now!'); return; }

      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / (1000 * 60)) % 60);
      const s = Math.floor((diff / 1000) % 60);

      if (d > 0) setCountdown(`${d}d ${h}h ${m}m`);
      else setCountdown(`${h}h ${m}m ${s}s`);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [upcomingBooking, ongoingBooking]);

  // Booking activity — last 6 months
  const monthlyActivity = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString('en', { month: 'short' });
      const count = bookings.filter((b) => {
        const bd = new Date(b.startTime);
        return bd.getMonth() === d.getMonth() && bd.getFullYear() === d.getFullYear();
      }).length;
      months.push({ label, count });
    }
    const max = Math.max(...months.map((m) => m.count), 1);
    return { months, max };
  }, [bookings]);

  // Frequently visited lots
  const frequentLots = useMemo(() => {
    const lotMap = {};
    bookings.forEach((b) => {
      const name = b.parkingLotId?.name;
      const id = b.parkingLotId?._id;
      if (name && id) {
        if (!lotMap[id]) lotMap[id] = { name, id, count: 0 };
        lotMap[id].count++;
      }
    });
    return Object.values(lotMap).sort((a, b) => b.count - a.count).slice(0, 3);
  }, [bookings]);

  // Rotate tips
  useEffect(() => {
    const interval = setInterval(() => setTipIndex((i) => (i + 1) % parkingTips.length), 8000);
    return () => clearInterval(interval);
  }, []);

  const greeting = getGreeting();

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {greeting.emoji} {greeting.text}, {user?.name}!
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Here's your parking overview for today
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-sm text-gray-400">
          <HiOutlineCalendar size={16} />
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
      </motion.div>

      {/* Upcoming / Active Booking Banner */}
      <AnimatePresence>
        {(upcomingBooking || ongoingBooking) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`relative overflow-hidden rounded-2xl p-5 sm:p-6 ${
              ongoingBooking
                ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                : 'bg-gradient-to-r from-primary-600 to-primary-800'
            }`}
          >
            <div className="absolute inset-0 opacity-10">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white rounded-full blur-2xl" />
            </div>
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-white">
                <div className="flex items-center gap-2 mb-1">
                  {ongoingBooking ? (
                    <span className="flex items-center gap-1.5 text-xs font-semibold bg-white/20 px-2.5 py-1 rounded-full">
                      <span className="w-2 h-2 bg-white rounded-full animate-pulse" /> ACTIVE NOW
                    </span>
                  ) : (
                    <span className="text-xs font-semibold bg-white/20 px-2.5 py-1 rounded-full">UPCOMING</span>
                  )}
                </div>
                <h3 className="text-lg font-bold">
                  {(ongoingBooking || upcomingBooking)?.parkingLotId?.name || 'Parking'}
                </h3>
                <p className="text-white/80 text-sm mt-0.5">
                  Slot {(ongoingBooking || upcomingBooking)?.slotId?.slotNumber || 'N/A'} ·{' '}
                  {formatDateTime((ongoingBooking || upcomingBooking)?.startTime)}
                </p>
              </div>
              <div className="text-white text-right">
                <p className="text-xs text-white/70 uppercase tracking-wide mb-1">
                  {ongoingBooking ? 'Time Remaining' : 'Starts In'}
                </p>
                <p className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight">{countdown || '—'}</p>
              </div>
            </div>
            <Link
              to="/dashboard/bookings"
              className="mt-3 inline-flex items-center gap-1 text-sm text-white/90 hover:text-white transition-colors"
            >
              View Details <HiOutlineChevronRight size={14} />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Bookings" value={bookings.length} icon={HiOutlineTicket} color="primary" />
        <StatCard title="Active Bookings" value={activeBookings.length} icon={HiOutlineClock} color="green" />
        <StatCard title="Total Spent" value={formatCurrency(totalSpent)} icon={HiOutlineCreditCard} color="purple" />
        <StatCard title="Completed" value={completedBookings.length} icon={HiOutlineCheckCircle} color="blue" subtitle={`${bookings.length > 0 ? Math.round((completedBookings.length / bookings.length) * 100) : 0}% completion rate`} />
      </div>

      {/* Booking Activity Chart + Frequent Lots */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mini Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card lg:col-span-2"
        >
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Booking Activity</h2>
          <div className="flex items-end gap-3 h-40">
            {monthlyActivity.months.map((m, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{m.count}</span>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max((m.count / monthlyActivity.max) * 100, 6)}%` }}
                  transition={{ delay: i * 0.08, duration: 0.5 }}
                  className={`w-full rounded-t-lg ${
                    m.count > 0
                      ? 'bg-gradient-to-t from-primary-500 to-primary-400'
                      : 'bg-gray-200 dark:bg-dark-border'
                  }`}
                />
                <span className="text-xs text-gray-500 dark:text-gray-400">{m.label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Frequent Lots */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Frequent Lots</h2>
          {frequentLots.length > 0 ? (
            <div className="space-y-3">
              {frequentLots.map((lot, i) => (
                <Link
                  key={lot.id}
                  to={`/dashboard/book/${lot.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-border/50 transition-colors group"
                >
                  <div className="w-9 h-9 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center font-bold text-primary-600 text-sm">
                    #{i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-primary-600 transition-colors">{lot.name}</p>
                    <p className="text-xs text-gray-500">{lot.count} visit{lot.count !== 1 ? 's' : ''}</p>
                  </div>
                  <HiOutlineChevronRight size={16} className="text-gray-400 group-hover:text-primary-500" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-400">
              <HiOutlineLocationMarker size={28} className="mx-auto mb-2" />
              <p className="text-sm">No visits yet</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { to: '/dashboard/book', emoji: '🅿️', label: 'Book Parking', desc: 'Find a spot' },
            { to: '/dashboard/bookings', emoji: '📋', label: 'My Bookings', desc: 'View history' },
            { to: '/dashboard/payments', emoji: '💳', label: 'Payments', desc: 'Transactions' },
            { to: '/dashboard/vehicles', emoji: '🚗', label: 'My Vehicles', desc: 'Manage cars' },
            { to: '/dashboard/messages', emoji: '💬', label: 'Messages', desc: 'Support chat' },
            { to: '/dashboard/profile', emoji: '👤', label: 'Profile', desc: 'Account info' },
          ].map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className="card hover:shadow-lg text-center group py-4 px-2"
            >
              <div className="text-2xl mb-1.5">{action.emoji}</div>
              <h3 className="font-semibold text-sm text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors">
                {action.label}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">{action.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Parking Tip */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="card bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-yellow-900/10 dark:to-amber-900/10 border-yellow-200 dark:border-yellow-800/30"
      >
        <div className="flex items-start gap-4">
          <div className="text-3xl shrink-0">{parkingTips[tipIndex].emoji}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <HiOutlineLightBulb size={16} className="text-yellow-600" />
              <span className="text-xs font-semibold text-yellow-700 dark:text-yellow-400 uppercase tracking-wide">Parking Tip</span>
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={tipIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="font-bold text-gray-900 dark:text-white text-sm">{parkingTips[tipIndex].title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{parkingTips[tipIndex].desc}</p>
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="flex gap-1 shrink-0">
            {parkingTips.map((_, i) => (
              <button
                key={i}
                onClick={() => setTipIndex(i)}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${i === tipIndex ? 'bg-yellow-500' : 'bg-yellow-300 dark:bg-yellow-700'}`}
              />
            ))}
          </div>
        </div>
      </motion.div>

      {/* Recent Bookings */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Recent Bookings</h2>
          {bookings.length > 5 && (
            <Link to="/dashboard/bookings" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
              View All <HiOutlineChevronRight size={14} />
            </Link>
          )}
        </div>
        {bookings.length > 0 ? (
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-dark-border">
                  <th className="pb-3 font-medium">Parking Lot</th>
                  <th className="pb-3 font-medium">Slot</th>
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Amount</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.slice(0, 5).map((b) => (
                  <tr key={b._id} className="border-b border-gray-50 dark:border-dark-border/50">
                    <td className="py-3 font-medium text-gray-900 dark:text-white">
                      {b.parkingLotId?.name || 'N/A'}
                    </td>
                    <td className="py-3 text-gray-600 dark:text-gray-400">{b.slotId?.slotNumber || 'N/A'}</td>
                    <td className="py-3 text-gray-600 dark:text-gray-400">{formatDateTime(b.startTime)}</td>
                    <td className="py-3 font-medium">{formatCurrency(b.totalAmount)}</td>
                    <td className="py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(b.bookingStatus)}`}>
                        {b.bookingStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="card text-center py-8 text-gray-500">
            <p className="text-4xl mb-3">📭</p>
            <p>No bookings yet. Start by booking a parking slot!</p>
            <Link to="/dashboard/book" className="btn-primary mt-4 inline-block">
              Book Now
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;
