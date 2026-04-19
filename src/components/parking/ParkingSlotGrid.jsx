import { motion } from 'framer-motion';
import { getStatusColor } from '../../utils/helpers';

const ParkingSlotGrid = ({ slots, onSlotClick, selectedSlot }) => {
  const getSlotStyle = (status) => {
    const styles = {
      available: 'bg-green-100 dark:bg-green-900/30 border-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 cursor-pointer',
      reserved: 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-400 cursor-not-allowed',
      occupied: 'bg-red-100 dark:bg-red-900/30 border-red-400 cursor-not-allowed',
    };
    return styles[status] || styles.available;
  };

  const getStatusIcon = (status) => {
    const icons = { available: '🅿️', reserved: '🔒', occupied: '🚗' };
    return icons[status] || '🅿️';
  };

  return (
    <div>
      {/* Legend */}
      <div className="flex items-center gap-6 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-400" />
          <span className="text-sm text-gray-600 dark:text-gray-400">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-yellow-400" />
          <span className="text-sm text-gray-600 dark:text-gray-400">Reserved</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-400" />
          <span className="text-sm text-gray-600 dark:text-gray-400">Occupied</span>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
        {slots.map((slot) => (
          <motion.button
            key={slot._id}
            whileHover={slot.status === 'available' ? { scale: 1.05 } : {}}
            whileTap={slot.status === 'available' ? { scale: 0.95 } : {}}
            onClick={() => slot.status === 'available' && onSlotClick?.(slot)}
            disabled={slot.status !== 'available'}
            className={`relative p-3 rounded-lg border-2 text-center transition-all duration-200 ${getSlotStyle(
              slot.status
            )} ${selectedSlot?._id === slot._id ? 'ring-2 ring-primary-500 ring-offset-2' : ''}`}
          >
            <div className="text-lg">{getStatusIcon(slot.status)}</div>
            <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mt-1">
              {slot.slotNumber}
            </div>
          </motion.button>
        ))}
      </div>

      {slots.length === 0 && (
        <div className="text-center py-8 text-gray-500">No slots found</div>
      )}
    </div>
  );
};

export default ParkingSlotGrid;
