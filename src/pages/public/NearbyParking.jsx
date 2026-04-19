import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { connectSocket, joinLot, leaveLot } from '../../services/socket';
import MapView from '../../components/map/MapView';
import NearbySearchBar from '../../components/map/NearbySearchBar';
import ParkingListPanel from '../../components/map/ParkingListPanel';
import DirectionMap from '../../components/map/DirectionMap';
import ParkingSlotGrid from '../../components/parking/ParkingSlotGrid';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { formatCurrency, calculateDuration } from '../../utils/helpers';
import { HiOutlineX, HiOutlineArrowLeft, HiOutlineLocationMarker } from 'react-icons/hi';

const NearbyParking = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [lots, setLots] = useState([]);
  const [filteredLots, setFilteredLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [selectedLot, setSelectedLot] = useState(null);
  const [showPanel, setShowPanel] = useState(true);

  // Slot selection & booking state
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'slots' | 'booking' | 'directions'
  const [bookedLot, setBookedLot] = useState(null);
  const [lotDetail, setLotDetail] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    vehicleNumber: '',
    startTime: '',
    endTime: '',
  });

  // Fetch all parking lots
  useEffect(() => {
    const fetchLots = async () => {
      try {
        const res = await api.get('/parking-lots');
        setLots(res.data.data);
        setFilteredLots(res.data.data);
      } catch {
        toast.error('Failed to load parking locations');
      } finally {
        setLoading(false);
      }
    };
    fetchLots();
  }, []);

  // Get user location on mount
  useEffect(() => {
    getUserLocation();
  }, []);

  // Set vehicle number when user loads
  useEffect(() => {
    if (user?.vehicleNumber) {
      setBookingForm((prev) => ({ ...prev, vehicleNumber: user.vehicleNumber }));
    }
  }, [user]);

  // Socket for real-time slot updates
  useEffect(() => {
    if (lotDetail?._id) {
      const socket = connectSocket();
      joinLot(lotDetail._id);

      socket.on('slotUpdate', (data) => {
        if (data.parkingLotId === lotDetail._id) {
          setSlots((prev) =>
            prev.map((s) => (s._id === data.slotId ? { ...s, status: data.status } : s))
          );
        }
      });

      return () => {
        leaveLot(lotDetail._id);
        socket.off('slotUpdate');
      };
    }
  }, [lotDetail?._id]);

  const getUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation([latitude, longitude]);
        setLocating(false);
        toast.success('Location found!');
      },
      (error) => {
        setLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          toast.error('Location access denied. Please allow location access.');
        } else {
          toast.error('Unable to get your location.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }, []);

  // Search/filter
  const handleSearch = useCallback(
    (query) => {
      const q = query.toLowerCase();
      const filtered = lots.filter(
        (lot) =>
          lot.name.toLowerCase().includes(q) ||
          lot.city.toLowerCase().includes(q) ||
          lot.address.toLowerCase().includes(q)
      );
      setFilteredLots(filtered);
      if (filtered.length === 0) toast('No parking found for that search', { icon: '🔍' });
    },
    [lots]
  );

  // When a parking lot is clicked (marker or list)
  const handleSelectLot = useCallback((lot) => {
    setSelectedLot(lot);
    setShowPanel(true);
  }, []);

  // View slots for a selected lot
  const handleViewSlots = useCallback(async (lot) => {
    if (!isAuthenticated) {
      toast.error('Please login to view slots and book');
      navigate('/login');
      return;
    }

    setSlotsLoading(true);
    setViewMode('slots');
    setSelectedSlot(null);
    try {
      const res = await api.get(`/parking-lots/${lot._id}`);
      setLotDetail(res.data.data);
      setSlots(res.data.data.slots || []);
    } catch {
      toast.error('Failed to load slots');
      setViewMode('list');
    } finally {
      setSlotsLoading(false);
    }
  }, [isAuthenticated, navigate]);

  // Go back to list from slots
  const handleBackToList = useCallback(() => {
    setViewMode('list');
    setLotDetail(null);
    setSlots([]);
    setSelectedSlot(null);
  }, []);

  // Select slot and proceed to booking form
  const handleSlotSelect = useCallback((slot) => {
    setSelectedSlot(slot);
    setViewMode('booking');
  }, []);

  // Calculate pricing
  const duration =
    bookingForm.startTime && bookingForm.endTime
      ? calculateDuration(bookingForm.startTime, bookingForm.endTime)
      : 0;
  const totalCost = duration * (lotDetail?.pricePerHour || 0);

  // Confirm booking
  const handleConfirmBooking = useCallback(async () => {
    if (!selectedSlot) return toast.error('Please select a slot');
    if (!bookingForm.startTime || !bookingForm.endTime) return toast.error('Select start and end time');
    if (!bookingForm.vehicleNumber) return toast.error('Enter vehicle number');
    if (new Date(bookingForm.endTime) <= new Date(bookingForm.startTime))
      return toast.error('End time must be after start time');

    setBookingInProgress(true);
    try {
      await api.post('/bookings/create', {
        slotId: selectedSlot._id,
        parkingLotId: lotDetail._id,
        startTime: bookingForm.startTime,
        endTime: bookingForm.endTime,
        vehicleNumber: bookingForm.vehicleNumber,
      });
      toast.success('🎉 Booking confirmed! Check My Bookings for QR code.');
      // Show directions view
      setBookedLot({ ...lotDetail });
      setViewMode('directions');
      setSelectedSlot(null);
      setBookingForm({ vehicleNumber: user?.vehicleNumber || '', startTime: '', endTime: '' });
      // Refresh lots
      const res = await api.get('/parking-lots');
      setLots(res.data.data);
      setFilteredLots(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed');
    } finally {
      setBookingInProgress(false);
    }
  }, [selectedSlot, bookingForm, lotDetail, user]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="bg-white dark:bg-dark-card border-b border-gray-200 dark:border-dark-border px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                🗺️ Nearby Parking
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Find, view slots, and book parking — all in one place
              </p>
            </div>
            <button
              onClick={() => setShowPanel(!showPanel)}
              className="md:hidden btn-secondary text-xs py-2 px-3"
            >
              {showPanel ? 'Show Map' : 'Show Panel'}
            </button>
          </div>
          <NearbySearchBar onSearch={handleSearch} onLocateMe={getUserLocation} locating={locating} />
        </div>
      </div>

      {/* Map + Panel */}
      <div className="flex flex-col md:flex-row h-[calc(100vh-12rem)]">
        {/* Side Panel */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className={`${
            showPanel ? 'block' : 'hidden'
          } md:block w-full md:w-[420px] bg-gray-50 dark:bg-dark-bg border-r border-gray-200 dark:border-dark-border overflow-hidden flex flex-col`}
        >
          <AnimatePresence mode="wait">
            {/* VIEW: Parking List */}
            {viewMode === 'list' && (
              <motion.div
                key="list"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-4 h-full overflow-y-auto"
              >
                <ParkingListPanel
                  lots={filteredLots}
                  selectedLot={selectedLot}
                  onSelect={handleSelectLot}
                  onViewSlots={handleViewSlots}
                  userLocation={userLocation}
                />
              </motion.div>
            )}

            {/* VIEW: Slots Grid */}
            {viewMode === 'slots' && (
              <motion.div
                key="slots"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="p-4 h-full overflow-y-auto"
              >
                <button
                  onClick={handleBackToList}
                  className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium mb-4"
                >
                  <HiOutlineArrowLeft size={16} />
                  Back to parking list
                </button>

                {slotsLoading ? (
                  <LoadingSpinner />
                ) : lotDetail ? (
                  <>
                    <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border p-4 mb-4">
                      <h3 className="font-bold text-gray-900 dark:text-white text-lg">{lotDetail.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                        <HiOutlineLocationMarker size={14} />
                        {lotDetail.address}, {lotDetail.city}
                      </p>
                      <div className="flex items-center gap-4 mt-3">
                        <span className="text-sm font-semibold text-green-600">
                          {slots.filter((s) => s.status === 'available').length} available
                        </span>
                        <span className="text-sm font-semibold text-primary-600">
                          {formatCurrency(lotDetail.pricePerHour)}/hr
                        </span>
                      </div>
                    </div>

                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">
                      Select a slot to book
                    </h4>
                    <ParkingSlotGrid
                      slots={slots}
                      onSlotClick={handleSlotSelect}
                      selectedSlot={selectedSlot}
                    />
                  </>
                ) : null}
              </motion.div>
            )}

            {/* VIEW: Booking Form */}
            {viewMode === 'booking' && (
              <motion.div
                key="booking"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="p-4 h-full overflow-y-auto"
              >
                <button
                  onClick={() => setViewMode('slots')}
                  className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium mb-4"
                >
                  <HiOutlineArrowLeft size={16} />
                  Back to slots
                </button>

                <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border p-4 mb-4">
                  <h3 className="font-bold text-gray-900 dark:text-white">{lotDetail?.name}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {lotDetail?.address}, {lotDetail?.city}
                  </p>
                </div>

                {/* Selected Slot Info */}
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 mb-4 border border-green-200 dark:border-green-800">
                  <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                    ✅ Slot Selected: {selectedSlot?.slotNumber}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-500 mt-0.5 capitalize">
                    Type: {selectedSlot?.vehicleType || 'car'}
                  </p>
                </div>

                {/* Booking Form */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Vehicle Number
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="MH 01 AB 1234"
                      value={bookingForm.vehicleNumber}
                      onChange={(e) => setBookingForm({ ...bookingForm, vehicleNumber: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Start Time
                    </label>
                    <input
                      type="datetime-local"
                      className="input-field"
                      value={bookingForm.startTime}
                      onChange={(e) => setBookingForm({ ...bookingForm, startTime: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      End Time
                    </label>
                    <input
                      type="datetime-local"
                      className="input-field"
                      value={bookingForm.endTime}
                      onChange={(e) => setBookingForm({ ...bookingForm, endTime: e.target.value })}
                    />
                  </div>

                  {/* Dynamic Price */}
                  {duration > 0 && (
                    <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-4 space-y-2 border border-primary-200 dark:border-primary-800">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Duration</span>
                        <span className="font-medium text-gray-900 dark:text-white">{duration} hour(s)</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Rate</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {formatCurrency(lotDetail?.pricePerHour)}/hr
                        </span>
                      </div>
                      <div className="flex justify-between text-lg font-bold border-t border-primary-200 dark:border-primary-700 pt-2">
                        <span className="text-gray-900 dark:text-white">Total</span>
                        <span className="text-primary-600">{formatCurrency(totalCost)}</span>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleConfirmBooking}
                    disabled={bookingInProgress || !selectedSlot || duration <= 0}
                    className="btn-primary w-full disabled:opacity-50 text-base py-3"
                  >
                    {bookingInProgress ? '⏳ Booking...' : `🅿️ Confirm Booking — ${formatCurrency(totalCost)}`}
                  </button>

                  <p className="text-xs text-center text-gray-400">
                    QR code will be generated after booking
                  </p>
                </div>
              </motion.div>
            )}

            {/* VIEW: Directions after booking */}
            {viewMode === 'directions' && bookedLot && (
              <motion.div
                key="directions"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="p-4 h-full overflow-y-auto"
              >
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 mb-4 border border-green-200 dark:border-green-800 text-center">
                  <p className="text-3xl mb-2">🎉</p>
                  <p className="text-lg font-bold text-green-700 dark:text-green-400">
                    Booking Confirmed!
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-500 mt-1">
                    Navigate to your parking below
                  </p>
                </div>

                <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border p-3 mb-4">
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm">{bookedLot.name}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {bookedLot.address}, {bookedLot.city}
                  </p>
                </div>

                <DirectionMap
                  parkingLot={bookedLot}
                  userLocation={userLocation}
                  height="280px"
                />

                <button
                  onClick={() => {
                    setViewMode('list');
                    setBookedLot(null);
                    setLotDetail(null);
                  }}
                  className="btn-secondary w-full mt-4"
                >
                  ← Back to Nearby Parking
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Map */}
        <div className="flex-1 relative">
          <MapView
            lots={filteredLots}
            userLocation={userLocation}
            onMarkerClick={handleSelectLot}
            onViewSlots={handleViewSlots}
            selectedLot={selectedLot}
            isAuthenticated={isAuthenticated}
            onLoginRequired={(lot) => {
              toast.error('Please login to view slots and book');
              navigate('/login', { state: { from: `/dashboard/book/${lot._id}` } });
            }}
          />

          {/* Floating stats */}
          <div className="absolute top-4 right-4 z-[1000]">
            <div className="bg-white dark:bg-dark-card rounded-xl shadow-lg border border-gray-100 dark:border-dark-border px-4 py-2.5 flex items-center gap-4">
              <div className="text-center">
                <p className="text-lg font-bold text-primary-600">{filteredLots.length}</p>
                <p className="text-[10px] text-gray-500 leading-tight">Locations</p>
              </div>
              <div className="w-px h-8 bg-gray-200 dark:bg-dark-border" />
              <div className="text-center">
                <p className="text-lg font-bold text-green-600">
                  {filteredLots.reduce((sum, l) => sum + (l.availableSlots ?? l.totalSlots), 0)}
                </p>
                <p className="text-[10px] text-gray-500 leading-tight">Available</p>
              </div>
            </div>
          </div>

          {/* Location indicator */}
          {userLocation && (
            <div className="absolute bottom-4 left-4 z-[1000] bg-white dark:bg-dark-card rounded-lg shadow-md border border-gray-100 dark:border-dark-border px-3 py-2 text-xs text-gray-600 dark:text-gray-400">
              📍 {userLocation[0].toFixed(4)}, {userLocation[1].toFixed(4)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NearbyParking;
