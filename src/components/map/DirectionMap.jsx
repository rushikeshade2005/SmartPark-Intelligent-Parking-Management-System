import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Parking destination icon (blue P)
const parkingIcon = new L.DivIcon({
  html: `<div style="background:#3B82F6;color:white;width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:18px;border:3px solid white;box-shadow:0 2px 10px rgba(0,0,0,0.3);">P</div>`,
  className: 'custom-parking-marker',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -22],
});

// User location icon (green pulse)
const userIcon = new L.DivIcon({
  html: `<div style="background:#10B981;color:white;width:24px;height:24px;border-radius:50%;border:3px solid white;box-shadow:0 0 0 4px rgba(16,185,129,0.3), 0 2px 10px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:12px;">📍</div>`,
  className: 'custom-user-marker',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -14],
});

// Fit map to show both points + route
const FitRoute = ({ userPos, destPos }) => {
  const map = useMap();
  useEffect(() => {
    if (userPos && destPos) {
      const bounds = L.latLngBounds([userPos, destPos]);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
    }
  }, [userPos, destPos, map]);
  return null;
};

// Calculate straight-line distance (Haversine)
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

// Format distance for display
const formatDistance = (km) => {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
};

// Format duration for display
const formatDuration = (seconds) => {
  if (seconds < 60) return `${Math.round(seconds)} sec`;
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const remainMins = mins % 60;
  return `${hrs}h ${remainMins}m`;
};

const DirectionMap = ({ parkingLot, userLocation, height = '300px' }) => {
  const [routeCoords, setRouteCoords] = useState([]);
  const [routeInfo, setRouteInfo] = useState(null);
  const [loadingRoute, setLoadingRoute] = useState(false);

  const destLat = parkingLot?.locationCoordinates?.lat;
  const destLng = parkingLot?.locationCoordinates?.lng;

  const userPos = userLocation ? [userLocation[0], userLocation[1]] : null;
  const destPos = destLat && destLng ? [destLat, destLng] : null;

  // Straight-line distance fallback
  const straightDist =
    userPos && destPos ? getDistance(userPos[0], userPos[1], destPos[0], destPos[1]) : null;

  // Fetch route from OSRM (free, no API key needed)
  useEffect(() => {
    if (!userPos || !destPos) return;

    const fetchRoute = async () => {
      setLoadingRoute(true);
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${userPos[1]},${userPos[0]};${destPos[1]},${destPos[0]}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          // OSRM returns [lng, lat], convert to [lat, lng] for Leaflet
          const coords = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
          setRouteCoords(coords);
          setRouteInfo({
            distance: route.distance / 1000, // meters → km
            duration: route.duration, // seconds
          });
        }
      } catch {
        // Fallback to straight line
        setRouteCoords([userPos, destPos]);
      } finally {
        setLoadingRoute(false);
      }
    };

    fetchRoute();
  }, [userPos?.[0], userPos?.[1], destPos?.[0], destPos?.[1]]);

  // Open directions in Google Maps / OpenStreetMap
  const openGoogleMaps = () => {
    if (!destPos) return;
    const url = userPos
      ? `https://www.google.com/maps/dir/${userPos[0]},${userPos[1]}/${destPos[0]},${destPos[1]}`
      : `https://www.google.com/maps/search/?api=1&query=${destPos[0]},${destPos[1]}`;
    window.open(url, '_blank');
  };

  const openOSMDirections = () => {
    if (!destPos) return;
    const url = userPos
      ? `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${userPos[0]}%2C${userPos[1]}%3B${destPos[0]}%2C${destPos[1]}`
      : `https://www.openstreetmap.org/?mlat=${destPos[0]}&mlon=${destPos[1]}#map=16/${destPos[0]}/${destPos[1]}`;
    window.open(url, '_blank');
  };

  if (!destPos) {
    return (
      <div className="bg-gray-50 dark:bg-dark-bg rounded-xl p-4 text-sm text-gray-500 text-center">
        📍 Location not available for this parking lot
      </div>
    );
  }

  const center = userPos
    ? [(userPos[0] + destPos[0]) / 2, (userPos[1] + destPos[1]) / 2]
    : destPos;

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-dark-border">
      {/* Route Info Bar */}
      <div className="bg-white dark:bg-dark-card px-4 py-3 flex items-center justify-between border-b border-gray-100 dark:border-dark-border">
        <div className="flex items-center gap-4">
          {routeInfo ? (
            <>
              <div className="flex items-center gap-1.5">
                <span className="text-lg">🚗</span>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {formatDistance(routeInfo.distance)}
                  </p>
                  <p className="text-[10px] text-gray-500">driving distance</p>
                </div>
              </div>
              <div className="w-px h-8 bg-gray-200 dark:bg-dark-border" />
              <div className="flex items-center gap-1.5">
                <span className="text-lg">⏱️</span>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {formatDuration(routeInfo.duration)}
                  </p>
                  <p className="text-[10px] text-gray-500">estimated time</p>
                </div>
              </div>
            </>
          ) : straightDist ? (
            <div className="flex items-center gap-1.5">
              <span className="text-lg">📏</span>
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {formatDistance(straightDist)}
                </p>
                <p className="text-[10px] text-gray-500">straight-line distance</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Enable location for distance</p>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={openGoogleMaps}
            className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-3 rounded-lg transition-colors flex items-center gap-1"
          >
            🗺️ Google Maps
          </button>
          <button
            onClick={openOSMDirections}
            className="text-xs bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-3 rounded-lg transition-colors flex items-center gap-1"
          >
            🌍 OSM
          </button>
        </div>
      </div>

      {/* Map */}
      <MapContainer
        center={center}
        zoom={13}
        className="w-full z-0"
        style={{ height }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitRoute userPos={userPos} destPos={destPos} />

        {/* Route line */}
        {routeCoords.length > 0 && (
          <Polyline
            positions={routeCoords}
            pathOptions={{
              color: '#3B82F6',
              weight: 5,
              opacity: 0.8,
              dashArray: routeInfo ? null : '10, 10',
            }}
          />
        )}

        {/* User location marker */}
        {userPos && (
          <Marker position={userPos} icon={userIcon}>
            <Popup>
              <p className="font-bold text-sm">📍 Your Location</p>
            </Popup>
          </Marker>
        )}

        {/* Parking destination marker */}
        <Marker position={destPos} icon={parkingIcon}>
          <Popup>
            <div className="text-center">
              <p className="font-bold text-sm">{parkingLot?.name || 'Parking Lot'}</p>
              <p className="text-xs text-gray-500">{parkingLot?.address}, {parkingLot?.city}</p>
            </div>
          </Popup>
        </Marker>
      </MapContainer>

      {loadingRoute && (
        <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-2 text-center text-xs text-blue-600">
          Loading route directions...
        </div>
      )}
    </div>
  );
};

export default DirectionMap;
