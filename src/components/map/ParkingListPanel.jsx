import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { formatCurrency } from '../../utils/helpers';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { HiOutlineLocationMarker, HiOutlineExternalLink, HiOutlineClock, HiOutlinePhotograph } from 'react-icons/hi';

const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const ParkingListPanel = ({ lots, selectedLot, onSelect, onViewSlots, userLocation }) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [routeData, setRouteData] = useState({}); // { [lotId]: { distance, duration } }
  const [loadingRoutes, setLoadingRoutes] = useState(false);
  const [expandedImage, setExpandedImage] = useState(null); // lotId for image preview

  // Calculate distance between two coordinates (Haversine)
  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const formatDistance = (km) => (km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)} km`);
  const formatDuration = (seconds) => {
    if (seconds < 60) return `${Math.round(seconds)} sec`;
    const mins = Math.round(seconds / 60);
    if (mins < 60) return `${mins} min`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ${mins % 60}m`;
  };

  // Sort by distance if user location is available
  const sortedLots = userLocation
    ? [...lots]
        .filter((l) => l.locationCoordinates?.lat && l.locationCoordinates?.lng)
        .map((l) => ({
          ...l,
          distance: getDistance(
            userLocation[0], userLocation[1],
            l.locationCoordinates.lat, l.locationCoordinates.lng
          ),
        }))
        .sort((a, b) => a.distance - b.distance)
    : lots;

  // Fetch driving routes for all lots when user location changes
  useEffect(() => {
    if (!userLocation || sortedLots.length === 0) return;

    const fetchRoutes = async () => {
      setLoadingRoutes(true);
      const results = {};
      // Batch fetch (max 5 at a time to be polite to OSRM)
      const batches = [];
      for (let i = 0; i < sortedLots.length; i += 5) {
        batches.push(sortedLots.slice(i, i + 5));
      }

      for (const batch of batches) {
        await Promise.all(
          batch.map(async (lot) => {
            if (!lot.locationCoordinates?.lat || !lot.locationCoordinates?.lng) return;
            try {
              const url = `https://router.project-osrm.org/route/v1/driving/${userLocation[1]},${userLocation[0]};${lot.locationCoordinates.lng},${lot.locationCoordinates.lat}?overview=false`;
              const res = await fetch(url);
              const data = await res.json();
              if (data.routes?.[0]) {
                results[lot._id] = {
                  distance: data.routes[0].distance / 1000,
                  duration: data.routes[0].duration,
                };
              }
            } catch {
              // Fallback to straight-line
            }
          })
        );
      }
      setRouteData(results);
      setLoadingRoutes(false);
    };

    fetchRoutes();
  }, [userLocation, lots.length]);

  const openDirections = (lot) => {
    if (!lot.locationCoordinates?.lat || !lot.locationCoordinates?.lng) return;
    const dest = `${lot.locationCoordinates.lat},${lot.locationCoordinates.lng}`;
    const url = userLocation
      ? `https://www.google.com/maps/dir/${userLocation[0]},${userLocation[1]}/${dest}`
      : `https://www.google.com/maps/search/?api=1&query=${dest}`;
    window.open(url, '_blank');
  };

  const getLotImages = (lot) => {
    const imgs = [];
    if (lot.image) imgs.push(lot.image);
    if (lot.images?.length) imgs.push(...lot.images);
    return [...new Set(imgs)]; // deduplicate
  };

  const getImageUrl = (img) => {
    if (!img) return null;
    if (img.startsWith('http')) return img;
    return `${BACKEND_URL}${img.startsWith('/') ? '' : '/'}${img}`;
  };

  return (
    <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-16rem)] pr-1 custom-scrollbar">
      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
        {sortedLots.length} parking location{sortedLots.length !== 1 ? 's' : ''} found
        {loadingRoutes && <span className="ml-2 text-xs text-primary-500 animate-pulse">• Calculating routes...</span>}
      </p>

      {sortedLots.map((lot, i) => {
        const route = routeData[lot._id];
        const images = getLotImages(lot);

        return (
          <motion.div
            key={lot._id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => onSelect?.(lot)}
            className={`rounded-xl border-2 cursor-pointer transition-all duration-200 overflow-hidden ${
              selectedLot?._id === lot._id
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-100 dark:border-dark-border bg-white dark:bg-dark-card hover:border-primary-300'
            }`}
          >
            {/* Images carousel */}
            {images.length > 0 && (
              <div className="relative h-32 overflow-hidden bg-gray-100 dark:bg-dark-border">
                <div className="flex overflow-x-auto snap-x snap-mandatory h-full scrollbar-hide">
                  {images.map((img, idx) => (
                    <img
                      key={idx}
                      src={getImageUrl(img)}
                      alt={`${lot.name} - ${idx + 1}`}
                      className="h-full w-full object-cover snap-center flex-shrink-0"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ))}
                </div>
                {images.length > 1 && (
                  <div className="absolute bottom-1.5 right-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                    <HiOutlinePhotograph size={10} className="inline mr-0.5" />
                    {images.length}
                  </div>
                )}
              </div>
            )}

            <div className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white">{lot.name}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">
                    <HiOutlineLocationMarker size={12} />
                    {lot.address}, {lot.city}
                  </p>
                </div>
                {lot.distance !== undefined && (
                  <span className="text-xs font-semibold text-primary-600 bg-primary-50 dark:bg-primary-900/30 px-2 py-0.5 rounded-full whitespace-nowrap ml-2">
                    {lot.distance < 1
                      ? `${Math.round(lot.distance * 1000)}m`
                      : `${lot.distance.toFixed(1)}km`}
                  </span>
                )}
              </div>

              {/* Route info (driving distance + time) */}
              {(route || lot.distance !== undefined) && (
                <div className="flex items-center gap-3 mt-2 text-xs">
                  {route ? (
                    <>
                      <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                        🚗 {formatDistance(route.distance)}
                      </span>
                      <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                        <HiOutlineClock size={12} /> {formatDuration(route.duration)}
                      </span>
                    </>
                  ) : lot.distance !== undefined ? (
                    <span className="text-gray-500 dark:text-gray-400 italic">
                      ~{formatDistance(lot.distance)} straight-line
                    </span>
                  ) : null}
                </div>
              )}

              <div className="flex items-center gap-3 mt-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 text-xs">
                    <span className="font-semibold text-green-600">
                      {lot.availableSlots ?? lot.totalSlots}/{lot.totalSlots} slots
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="font-semibold text-blue-600">
                      {formatCurrency(lot.pricePerHour)}/hr
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/parking/${lot._id}`);
                  }}
                  className="flex-1 text-xs bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-3 rounded-lg transition-colors text-center"
                >
                  View Details
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isAuthenticated) {
                      toast.error('Please login to view slots and book');
                      navigate('/login', { state: { from: `/dashboard/book/${lot._id}` } });
                      return;
                    }
                    if (onViewSlots) {
                      onViewSlots(lot);
                    } else {
                      navigate(`/dashboard/book/${lot._id}`);
                    }
                  }}
                  className="flex-1 text-xs bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-3 rounded-lg transition-colors text-center"
                >
                  Book Now
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openDirections(lot);
                  }}
                  className="text-xs bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-semibold py-2 px-3 rounded-lg transition-colors flex items-center gap-1"
                >
                  <HiOutlineExternalLink size={14} />
                  Directions
                </button>
              </div>
            </div>
          </motion.div>
        );
      })}

      {sortedLots.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p className="text-4xl mb-2">🗺️</p>
          <p className="text-sm">No parking locations found</p>
        </div>
      )}
    </div>
  );
};

export default ParkingListPanel;
