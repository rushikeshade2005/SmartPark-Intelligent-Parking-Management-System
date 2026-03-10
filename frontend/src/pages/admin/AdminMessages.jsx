import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { formatDateTime } from '../../utils/helpers';
import {
  HiOutlineMail, HiOutlineMailOpen, HiOutlineReply, HiOutlineTrash,
  HiOutlineCheckCircle, HiOutlineEye, HiOutlineX, HiOutlineRefresh,
  HiOutlineFilter,
} from 'react-icons/hi';

const STATUS_CONFIG = {
  unread: { label: 'Unread', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: HiOutlineMail },
  read: { label: 'Read', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: HiOutlineMailOpen },
  replied: { label: 'Replied', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: HiOutlineReply },
  resolved: { label: 'Resolved', color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400', icon: HiOutlineCheckCircle },
};

const AdminMessages = () => {
  const [messages, setMessages] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedMsg, setSelectedMsg] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  const fetchMessages = async () => {
    try {
      const [msgRes, statsRes] = await Promise.all([
        api.get(`/contact?status=${filter}`),
        api.get('/contact/stats'),
      ]);
      setMessages(msgRes.data.data);
      setStats(statsRes.data.data);
    } catch {
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [filter]);

  const handleView = async (msg) => {
    try {
      const res = await api.get(`/contact/${msg._id}`);
      setSelectedMsg(res.data.data);
      setReplyText(res.data.data.adminReply || '');
      setShowDetail(true);
      // Refresh list to update unread count
      if (msg.status === 'unread') {
        fetchMessages();
      }
    } catch {
      toast.error('Failed to load message');
    }
  };

  const handleReply = async () => {
    if (!replyText.trim()) return toast.error('Please write a reply');
    setReplying(true);
    try {
      await api.put(`/contact/${selectedMsg._id}/reply`, { reply: replyText });
      toast.success('Reply sent!');
      setShowDetail(false);
      fetchMessages();
    } catch {
      toast.error('Failed to send reply');
    } finally {
      setReplying(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.put(`/contact/${id}/status`, { status });
      toast.success(`Marked as ${status}`);
      fetchMessages();
      if (showDetail) setShowDetail(false);
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this message permanently?')) return;
    try {
      await api.delete(`/contact/${id}`);
      toast.success('Message deleted');
      fetchMessages();
      if (showDetail) setShowDetail(false);
    } catch {
      toast.error('Failed to delete');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">📬 Contact Messages</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage messages from users and visitors
          </p>
        </div>
        <button
          onClick={fetchMessages}
          className="btn-secondary text-sm py-2 px-3 flex items-center gap-1.5"
        >
          <HiOutlineRefresh size={16} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {[
            { label: 'Total', value: stats.total, color: 'text-gray-700 dark:text-gray-200' },
            { label: 'Unread', value: stats.unread, color: 'text-red-600' },
            { label: 'Read', value: stats.read, color: 'text-blue-600' },
            { label: 'Replied', value: stats.replied, color: 'text-green-600' },
            { label: 'Resolved', value: stats.resolved, color: 'text-gray-500' },
          ].map((s) => (
            <div key={s.label} className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border p-3 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
              <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto">
        <HiOutlineFilter size={16} className="text-gray-400 shrink-0" />
        {['all', 'unread', 'read', 'replied', 'resolved'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              filter === f
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-dark-card text-gray-600 dark:text-gray-400 hover:bg-gray-200'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === 'unread' && stats?.unread > 0 && (
              <span className="ml-1.5 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {stats.unread}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Messages List */}
      <div className="space-y-2">
        {messages.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <HiOutlineMail size={48} className="mx-auto mb-4 opacity-50" />
            <p>No messages found</p>
          </div>
        ) : (
          messages.map((msg) => (
            <motion.div
              key={msg._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-white dark:bg-dark-card rounded-xl border p-4 cursor-pointer hover:shadow-md transition-all ${
                msg.status === 'unread'
                  ? 'border-red-200 dark:border-red-800/40 bg-red-50/30 dark:bg-red-900/5'
                  : 'border-gray-100 dark:border-dark-border'
              }`}
              onClick={() => handleView(msg)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {msg.status === 'unread' && (
                      <div className="w-2.5 h-2.5 bg-red-500 rounded-full shrink-0" />
                    )}
                    <h3 className={`text-sm font-semibold truncate ${
                      msg.status === 'unread' ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {msg.subject}
                    </h3>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    <span className="font-medium">{msg.name}</span> &lt;{msg.email}&gt;
                    {msg.userId && <span className="ml-1 text-primary-600">(registered user)</span>}
                  </p>
                  <p className="text-xs text-gray-400 line-clamp-1">{msg.message}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_CONFIG[msg.status]?.color}`}>
                    {STATUS_CONFIG[msg.status]?.label}
                  </span>
                  <span className="text-[10px] text-gray-400 whitespace-nowrap">
                    {formatDateTime(msg.createdAt)}
                  </span>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetail && selectedMsg && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowDetail(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-dark-card rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-dark-border">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">{selectedMsg.subject}</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    From: <span className="font-medium">{selectedMsg.name}</span> &lt;{selectedMsg.email}&gt;
                  </p>
                </div>
                <button onClick={() => setShowDetail(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-dark-border rounded-lg">
                  <HiOutlineX size={20} className="text-gray-500" />
                </button>
              </div>

              {/* Meta */}
              <div className="px-5 py-3 flex items-center gap-3 text-xs border-b border-gray-100 dark:border-dark-border">
                <span className={`px-2 py-0.5 rounded-full font-semibold ${STATUS_CONFIG[selectedMsg.status]?.color}`}>
                  {STATUS_CONFIG[selectedMsg.status]?.label}
                </span>
                <span className="text-gray-400">Received {formatDateTime(selectedMsg.createdAt)}</span>
                {selectedMsg.userId && (
                  <span className="text-primary-600 font-medium">Registered User</span>
                )}
              </div>

              {/* Message Body */}
              <div className="p-5">
                <div className="bg-gray-50 dark:bg-dark-bg rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                    {selectedMsg.message}
                  </p>
                </div>

                {/* Existing reply */}
                {selectedMsg.adminReply && (
                  <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/30 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <HiOutlineReply size={14} className="text-green-600" />
                      <span className="text-xs font-semibold text-green-700 dark:text-green-400">Admin Reply</span>
                      {selectedMsg.repliedAt && (
                        <span className="text-[10px] text-gray-400 ml-auto">{formatDateTime(selectedMsg.repliedAt)}</span>
                      )}
                    </div>
                    <p className="text-sm text-green-800 dark:text-green-300 whitespace-pre-wrap">
                      {selectedMsg.adminReply}
                    </p>
                  </div>
                )}

                {/* Reply Form */}
                <div className="mt-4">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                    {selectedMsg.adminReply ? 'Update Reply' : 'Write Reply'}
                  </label>
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows="4"
                    placeholder="Type your reply to the user..."
                    className="input-field resize-none text-sm"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between p-5 border-t border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg rounded-b-2xl">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleStatusChange(selectedMsg._id, 'resolved')}
                    className="text-xs px-3 py-1.5 bg-gray-200 dark:bg-dark-border text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 flex items-center gap-1"
                  >
                    <HiOutlineCheckCircle size={14} />
                    Resolve
                  </button>
                  <button
                    onClick={() => handleDelete(selectedMsg._id)}
                    className="text-xs px-3 py-1.5 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 flex items-center gap-1"
                  >
                    <HiOutlineTrash size={14} />
                    Delete
                  </button>
                </div>
                <button
                  onClick={handleReply}
                  disabled={replying || !replyText.trim()}
                  className="btn-primary text-sm py-2 px-4 flex items-center gap-1.5"
                >
                  <HiOutlineReply size={16} />
                  {replying ? 'Sending...' : 'Send Reply'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminMessages;
