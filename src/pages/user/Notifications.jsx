import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { HiOutlineBell, HiOutlineCheck, HiOutlineTrash } from 'react-icons/hi';
import toast from 'react-hot-toast';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.data);
      setUnreadCount(res.data.unreadCount);
    } catch (err) {
      // Fallback to legacy embedded notifications
      try {
        const res = await api.get('/auth/notifications');
        setNotifications(res.data.notifications || []);
        setUnreadCount((res.data.notifications || []).filter((n) => !n.read).length);
      } catch {
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      // Fallback
      try {
        await api.put('/auth/notifications/read');
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      } catch {
        toast.error('Failed to mark as read');
      }
    }
  };

  const markOneRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, read: true } : n));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      toast.success('Notification deleted');
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const handleClick = (n) => {
    if (!n.read) markOneRead(n._id);
    if (n.link) navigate(n.link);
  };

  const getTypeIcon = (type) => {
    const icons = {
      booking: '🎫',
      payment: '💳',
      reminder: '⏰',
      system: '🔔',
      review: '⭐',
      checkin: '📍',
    };
    return icons[type] || '🔔';
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-500 mt-1">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="btn-secondary text-sm flex items-center gap-2">
            <HiOutlineCheck size={16} />
            Mark all read
          </button>
        )}
      </div>

      {notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map((n, i) => (
            <motion.div
              key={n._id || i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`card flex items-start gap-4 cursor-pointer group ${!n.read ? 'border-l-4 border-l-primary-500' : ''}`}
              onClick={() => handleClick(n)}
            >
              <div className="text-2xl">{getTypeIcon(n.type)}</div>
              <div className="flex-1">
                {n.title && (
                  <p className={`text-sm font-semibold ${!n.read ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                    {n.title}
                  </p>
                )}
                <p className={`text-sm ${!n.read ? 'font-medium text-gray-800 dark:text-gray-200' : 'text-gray-600 dark:text-gray-400'}`}>
                  {n.message}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(n.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {!n.read && <div className="w-2 h-2 bg-primary-500 rounded-full" />}
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(n._id); }}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition"
                >
                  <HiOutlineTrash size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12 text-gray-500">
          <HiOutlineBell size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-lg font-semibold">No notifications</p>
          <p className="text-sm mt-1">You're all caught up!</p>
        </div>
      )}
    </div>
  );
};

export default Notifications;
