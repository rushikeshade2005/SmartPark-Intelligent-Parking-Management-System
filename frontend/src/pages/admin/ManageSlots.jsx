import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

const statusColors = {
  available: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  reserved: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  occupied: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const ManageSlots = () => {
  const [lots, setLots] = useState([]);
  const [selectedLot, setSelectedLot] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);

  useEffect(() => {
    fetchLots();
  }, []);

  const fetchLots = async () => {
    try {
      const res = await api.get('/admin/parking-lots');
      setLots(res.data.data);
    } catch {
      toast.error('Failed to load lots');
    } finally {
      setLoading(false);
    }
  };

  const selectLot = async (lot) => {
    setSelectedLot(lot);
    setSlotsLoading(true);
    try {
      const res = await api.get(`/admin/parking-lots/${lot._id}/slots`);
      setSlots(res.data.data);
    } catch {
      toast.error('Failed to load slots');
    } finally {
      setSlotsLoading(false);
    }
  };

  const updateSlotStatus = async (slotId, status) => {
    try {
      await api.put(`/parking-lots/slots/${slotId}/status`, { status });
      toast.success(`Slot marked as ${status}`);
      selectLot(selectedLot);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update slot');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Manage Slots</h1>

      {!selectedLot ? (
        <>
          <p className="text-gray-500 dark:text-gray-400 mb-4">Select a parking lot to manage its slots</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lots.map((lot) => (
              <motion.button
                key={lot._id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => selectLot(lot)}
                className="card text-left hover:ring-2 hover:ring-primary-500 transition-all"
              >
                <h3 className="font-bold text-gray-900 dark:text-white">{lot.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{lot.city}</p>
                <p className="text-sm text-primary-600 font-semibold mt-2">
                  {lot.availableSlots ?? lot.totalSlots}/{lot.totalSlots} available
                </p>
              </motion.button>
            ))}
          </div>
        </>
      ) : (
        <>
          <button
            onClick={() => setSelectedLot(null)}
            className="mb-4 text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            ← Back to lots
          </button>
          <div className="card mb-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{selectedLot.name}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{selectedLot.address}, {selectedLot.city}</p>
          </div>

          {slotsLoading ? (
            <LoadingSpinner />
          ) : slots.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {slots.map((slot) => (
                <motion.div
                  key={slot._id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="card p-3 text-center"
                >
                  <p className="font-bold text-sm text-gray-900 dark:text-white mb-1">
                    Slot {slot.slotNumber}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 capitalize">
                    {slot.vehicleType}
                  </p>
                  <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full mb-2 ${statusColors[slot.status]}`}>
                    {slot.status}
                  </span>
                  <div className="flex flex-col gap-1">
                    {slot.status !== 'available' && (
                      <button
                        onClick={() => updateSlotStatus(slot._id, 'available')}
                        className="text-xs bg-green-500 hover:bg-green-600 text-white py-1 px-2 rounded"
                      >
                        Set Available
                      </button>
                    )}
                    {slot.status !== 'occupied' && (
                      <button
                        onClick={() => updateSlotStatus(slot._id, 'occupied')}
                        className="text-xs bg-red-500 hover:bg-red-600 text-white py-1 px-2 rounded"
                      >
                        Set Occupied
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No slots found for this lot</p>
          )}
        </>
      )}
    </div>
  );
};

export default ManageSlots;
