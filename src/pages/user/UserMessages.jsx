import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { formatDateTime } from '../../utils/helpers';
import {
  HiOutlineMail, HiOutlineMailOpen, HiOutlineReply,
  HiOutlineCheckCircle, HiOutlineX, HiOutlineRefresh,
  HiOutlineChatAlt2, HiOutlineInboxIn,
} from 'react-icons/hi';

const STATUS_CONFIG = {
  unread: { label: 'Sent', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', icon: HiOutlineMail },
  read: { label: 'Seen by Admin', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: HiOutlineMailOpen },
  replied: { label: 'Replied', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: HiOutlineReply },
  resolved: { label: 'Resolved', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-400', icon: HiOutlineCheckCircle },
};

const UserMessages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMsg, setSelectedMsg] = useState(null);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/contact/my-messages');
      setMessages(data.data);
    } catch (err) {
      console.error('Failed to fetch messages', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Messages</h1>
          <p className="text-sm text-gray-500 mt-1">Messages you've sent to support and their replies</p>
        </div>
        <button
          onClick={fetchMessages}
          className="p-2 rounded-lg bg-gray-100 dark:bg-dark-card hover:bg-gray-200 dark:hover:bg-dark-border transition"
          title="Refresh"
        >
          <HiOutlineRefresh size={20} className="text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Empty state */}
      {messages.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16 bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-dark-border"
        >
          <HiOutlineInboxIn size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">No messages yet</h3>
          <p className="text-gray-500 text-sm mb-4">You haven't sent any messages to support.</p>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium"
          >
            <HiOutlineChatAlt2 size={18} />
            Contact Support
          </a>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {messages.map((msg, idx) => {
            const sc = STATUS_CONFIG[msg.status] || STATUS_CONFIG.unread;
            const StatusIcon = sc.icon;
            const hasReply = msg.adminReply;

            return (
              <motion.div
                key={msg._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => setSelectedMsg(msg)}
                className={`bg-white dark:bg-dark-card rounded-xl border cursor-pointer hover:shadow-md transition-all duration-200 ${
                  hasReply
                    ? 'border-green-200 dark:border-green-800/40'
                    : 'border-gray-200 dark:border-dark-border'
                }`}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                          {msg.subject}
                        </h3>
                        {hasReply && (
                          <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                            <HiOutlineReply size={12} />
                            New Reply
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                        {msg.message}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${sc.color}`}>
                        <StatusIcon size={12} />
                        {sc.label}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatDateTime(msg.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedMsg && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedMsg(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-dark-card rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-y-auto"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-dark-border">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white truncate pr-4">
                  {selectedMsg.subject}
                </h2>
                <button
                  onClick={() => setSelectedMsg(null)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-border transition"
                >
                  <HiOutlineX size={20} className="text-gray-500" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {/* Status + date */}
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_CONFIG[selectedMsg.status]?.color}`}>
                    {STATUS_CONFIG[selectedMsg.status]?.label}
                  </span>
                  <span className="text-xs text-gray-400">
                    Sent {formatDateTime(selectedMsg.createdAt)}
                  </span>
                </div>

                {/* Your message */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Your Message
                  </p>
                  <div className="bg-gray-50 dark:bg-dark-bg rounded-lg p-4">
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {selectedMsg.message}
                    </p>
                  </div>
                </div>

                {/* Admin reply */}
                {selectedMsg.adminReply ? (
                  <div>
                    <p className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wider mb-2">
                      Admin Reply
                    </p>
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/40 rounded-lg p-4">
                      <p className="text-sm text-green-800 dark:text-green-300 whitespace-pre-wrap">
                        {selectedMsg.adminReply}
                      </p>
                      {selectedMsg.repliedAt && (
                        <p className="text-xs text-green-500 dark:text-green-500 mt-3">
                          Replied {formatDateTime(selectedMsg.repliedAt)}
                          {selectedMsg.repliedBy?.name && ` by ${selectedMsg.repliedBy.name}`}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800/30 rounded-lg p-4 text-center">
                    <HiOutlineMail size={24} className="mx-auto text-yellow-500 mb-2" />
                    <p className="text-sm text-yellow-700 dark:text-yellow-400 font-medium">
                      Awaiting admin response
                    </p>
                    <p className="text-xs text-yellow-500 mt-1">
                      We'll get back to you as soon as possible.
                    </p>
                  </div>
                )}

                {/* Resolved note */}
                {selectedMsg.status === 'resolved' && (
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-dark-bg rounded-lg p-3">
                    <HiOutlineCheckCircle size={18} className="text-green-500 shrink-0" />
                    This conversation has been marked as resolved.
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserMessages;
