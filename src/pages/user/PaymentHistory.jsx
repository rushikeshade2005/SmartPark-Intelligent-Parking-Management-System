import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { formatCurrency, formatDateTime, getStatusBadge } from '../../utils/helpers';

const PaymentHistory = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const res = await api.get('/payments/history');
        setPayments(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Payment History</h1>

      {payments.length > 0 ? (
        <div className="space-y-4">
          {payments.map((p) => (
            <motion.div
              key={p._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-gray-900 dark:text-white">
                      {formatCurrency(p.amount)}
                    </h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(p.status)}`}>
                      {p.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                    <div>
                      <span className="text-xs text-gray-400">Transaction ID</span>
                      <p className="font-mono text-gray-700 dark:text-gray-300 text-xs">{p.transactionId}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400">Method</span>
                      <p className="text-gray-700 dark:text-gray-300 capitalize">{p.paymentMethod}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400">Parking</span>
                      <p className="text-gray-700 dark:text-gray-300">
                        {p.bookingId?.parkingLotId?.name || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-400">Date</span>
                      <p className="text-gray-700 dark:text-gray-300">{formatDateTime(p.paymentDate)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12 text-gray-500">
          <p className="text-5xl mb-4">💳</p>
          <p className="text-lg font-semibold">No payments yet</p>
        </div>
      )}
    </div>
  );
};

export default PaymentHistory;
