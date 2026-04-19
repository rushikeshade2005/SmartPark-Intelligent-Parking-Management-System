import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { HiOutlineLocationMarker, HiOutlineClock, HiStar } from 'react-icons/hi';
import { formatCurrency } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ParkingLotCard = ({ lot }) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [reviewStats, setReviewStats] = useState({ avgRating: 0, total: 0 });
  const occupancyPercent = lot.totalSlots > 0
    ? Math.round(((lot.totalSlots - (lot.availableSlots || 0)) / lot.totalSlots) * 100)
    : 0;

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await api.get(`/reviews/lot/${lot._id}`);
        setReviewStats(res.data.data.stats);
      } catch {}
    };
    if (lot._id) fetchReviews();
  }, [lot._id]);

  // Determine cover image
  const coverImage = lot.images?.length > 0
    ? `${API_URL}${lot.images[0].startsWith('/') ? '' : '/'}${lot.images[0]}`
    : lot.image || null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="card hover:shadow-xl transition-all duration-300 overflow-hidden"
    >
      {/* Image / fallback gradient */}
      <div className="h-40 -mx-6 -mt-6 mb-4 bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center overflow-hidden">
        {coverImage ? (
          <img src={coverImage} alt={lot.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-5xl">🏢</span>
        )}
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{lot.name}</h3>
        {reviewStats.total > 0 && (
          <div className="flex items-center gap-1 text-sm">
            <HiStar className="text-yellow-400" size={16} />
            <span className="font-semibold text-gray-700 dark:text-gray-300">{reviewStats.avgRating}</span>
            <span className="text-gray-400 text-xs">({reviewStats.total})</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 mt-2 text-gray-500 dark:text-gray-400 text-sm">
        <HiOutlineLocationMarker size={16} />
        <span>{lot.address}, {lot.city}</span>
      </div>

      {/* Occupancy bar */}
      <div className="mt-4">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-500 dark:text-gray-400">Occupancy</span>
          <span className="font-medium text-gray-700 dark:text-gray-300">{occupancyPercent}%</span>
        </div>
        <div className="w-full h-2 bg-gray-200 dark:bg-dark-border rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              occupancyPercent > 80 ? 'bg-red-500' : occupancyPercent > 50 ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ width: `${occupancyPercent}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-dark-border">
        <div>
          <p className="text-xs text-gray-500">Available Slots</p>
          <p className="font-bold text-green-600">
            {lot.availableSlots || 0}/{lot.totalSlots}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Per Hour</p>
          <p className="font-bold text-primary-600">{formatCurrency(lot.pricePerHour)}</p>
        </div>
      </div>

      <div className="flex items-center gap-1 mt-3 text-xs text-gray-500 dark:text-gray-400">
        <HiOutlineClock size={14} />
        <span>{lot.operatingHours?.open || '06:00'} - {lot.operatingHours?.close || '22:00'}</span>
      </div>

      <button
        onClick={() => {
          if (!isAuthenticated) {
            toast.error('Please login to book a parking slot');
            navigate('/login', { state: { from: `/dashboard/book/${lot._id}` } });
            return;
          }
          navigate(`/dashboard/book/${lot._id}`);
        }}
        className="btn-primary w-full text-center text-sm mt-4 block"
      >
        Book Now
      </button>
    </motion.div>
  );
};

export default ParkingLotCard;
