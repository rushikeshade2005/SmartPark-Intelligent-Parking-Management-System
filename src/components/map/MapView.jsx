import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { formatCurrency } from '../../utils/helpers';
import { useEffect, useRef } from 'react';

// Fix default marker icon issue with bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom parking icon
const parkingIcon = new L.DivIcon({
  html: `<div style="background:#3B82F6;color:white;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:16px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);">P</div>`,
  className: 'custom-parking-marker',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -20],
});

// Custom user location icon
const userIcon = new L.DivIcon({
  html: `<div style="background:#EF4444;color:white;width:20px;height:20px;border-radius:50%;border:3px solid white;box-shadow:0 0 0 3px rgba(239,68,68,0.3), 0 2px 8px rgba(0,0,0,0.3);"></div>`,
  className: 'custom-user-marker',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// Auto-fit bounds when lots change + invalidateSize for dynamic containers
const FitBounds = ({ lots, userLocation }) => {
  const map = useMap();
  useEffect(() => {
    // Fix for Leaflet inside flex/overflow containers (e.g., DashboardLayout)
    setTimeout(() => map.invalidateSize(), 100);
    setTimeout(() => map.invalidateSize(), 500);

    const handleResize = () => map.invalidateSize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [map]);

  useEffect(() => {
    const points = lots
      .filter((l) => l.locationCoordinates?.lat && l.locationCoordinates?.lng)
      .map((l) => [l.locationCoordinates.lat, l.locationCoordinates.lng]);

    if (userLocation) points.push(userLocation);

    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [lots, userLocation, map]);
  return null;
};

const MapView = ({ lots, userLocation, onMarkerClick, onViewSlots, selectedLot, isAuthenticated, onLoginRequired }) => {
  const center = userLocation || [19.076, 72.8777]; // Default: Mumbai

  return (
    <MapContainer
      center={center}
      zoom={13}
      className="w-full h-full rounded-xl z-0"
      style={{ minHeight: '500px' }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <FitBounds lots={lots} userLocation={userLocation} />

      {/* User location marker */}
      {userLocation && (
        <Marker position={userLocation} icon={userIcon}>
          <Popup>
            <div className="text-center">
              <p className="font-bold text-sm">📍 Your Location</p>
            </div>
          </Popup>
        </Marker>
      )}

      {/* Parking markers with clustering */}
      <MarkerClusterGroup
        chunkedLoading
        maxClusterRadius={60}
        spiderfyOnMaxZoom={true}
        showCoverageOnHover={false}
      >
        {lots
          .filter((lot) => lot.locationCoordinates?.lat && lot.locationCoordinates?.lng)
          .map((lot) => (
            <Marker
              key={lot._id}
              position={[lot.locationCoordinates.lat, lot.locationCoordinates.lng]}
              icon={parkingIcon}
              eventHandlers={{
                click: () => onMarkerClick?.(lot),
              }}
            >
              <Popup>
                <div className="min-w-[200px]">
                  <h3 className="font-bold text-base text-gray-900 mb-1">{lot.name}</h3>
                  <p className="text-xs text-gray-500 mb-2">{lot.address}, {lot.city}</p>

                  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div className="bg-green-50 rounded-lg p-1.5 text-center">
                      <p className="text-green-700 font-bold text-sm">
                        {lot.availableSlots ?? lot.totalSlots}
                      </p>
                      <p className="text-green-600">Available</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-1.5 text-center">
                      <p className="text-blue-700 font-bold text-sm">
                        {formatCurrency(lot.pricePerHour)}
                      </p>
                      <p className="text-blue-600">Per Hour</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <a
                      href={`/parking/${lot._id}`}
                      style={{ flex: 1, display: 'block', background: '#3B82F6', color: 'white', textAlign: 'center', fontSize: '11px', fontWeight: 600, padding: '6px 0', borderRadius: '6px', textDecoration: 'none' }}
                    >
                      Details
                    </a>
                    <button
                      onClick={() => {
                        if (isAuthenticated === false && onLoginRequired) {
                          onLoginRequired(lot);
                        } else {
                          onViewSlots?.(lot);
                        }
                      }}
                      style={{ flex: 1, background: '#16A34A', color: 'white', textAlign: 'center', fontSize: '11px', fontWeight: 600, padding: '6px 0', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
      </MarkerClusterGroup>
    </MapContainer>
  );
};

export default MapView;
