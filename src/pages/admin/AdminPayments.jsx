import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { formatDate, formatCurrency } from '../../utils/helpers';

const methodIcons = {
  card: '💳',
  upi: '📱',
  wallet: '👛',
  cash: '💵',
};

const AdminPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const res = await api.get('/payments/all');
        setPayments(res.data.data);
      } catch {
        toast.error('Failed to load payments');
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">All Payments</h1>
        <div className="card px-4 py-2">
          <p className="text-xs text-gray-500 dark:text-gray-400">Total Revenue</p>
          <p className="text-lg font-bold text-green-600">{formatCurrency(totalRevenue)}</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-dark-border">
                <th className="py-3 px-4 font-medium">Transaction ID</th>
                <th className="py-3 px-4 font-medium">User</th>
                <th className="py-3 px-4 font-medium">Parking Lot</th>
                <th className="py-3 px-4 font-medium">Method</th>
                <th className="py-3 px-4 font-medium">Amount</th>
                <th className="py-3 px-4 font-medium">Date</th>
                <th className="py-3 px-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-dark-border">
              {payments.map((payment) => (
                <motion.tr
                  key={payment._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-gray-50 dark:hover:bg-dark-border/30"
                >
                  <td className="py-3 px-4 font-mono text-xs text-gray-500 dark:text-gray-400">
                    {payment.transactionId?.slice(0, 13)}...
                  </td>
                  <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">
                    {payment.userId?.name || 'Unknown'}
                  </td>
                  <td className="py-3 px-4 text-gray-500 dark:text-gray-400">
                    {payment.bookingId?.parkingLotId?.name || '—'}
                  </td>
                  <td className="py-3 px-4">
                    <span className="flex items-center gap-1">
                      {methodIcons[payment.paymentMethod] || '💰'}
                      <span className="capitalize text-gray-700 dark:text-gray-300">{payment.paymentMethod}</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(payment.amount)}
                  </td>
                  <td className="py-3 px-4 text-gray-500 dark:text-gray-400">{formatDate(payment.paymentDate)}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      {payment.status}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {payments.length === 0 && (
            <p className="text-center py-8 text-gray-500">No payments found</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPayments;
