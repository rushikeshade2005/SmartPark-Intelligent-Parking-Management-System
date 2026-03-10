import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';

// Pin icon for selected location
const pinIcon = new L.DivIcon({
  html: `<div style="background:#EF4444;color:white;width:40px;height:40px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 10px rgba(0,0,0,0.4);"><span style="transform:rotate(45deg);font-size:18px;font-weight:bold;">📍</span></div>`,
  className: 'custom-pin-marker',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

// Click handler component
const ClickHandler = ({ onLocationSelect }) => {
  useMapEvents({
    click(e) {
      onLocationSelect?.([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
};

// Fly to selected position
const FlyTo = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, 16, { duration: 1 });
    }
  }, [position, map]);
  return null;
};

const LocationPickerMap = ({ position, onLocationSelect }) => {
  const center = position || [19.076, 72.8777];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          📍 Pick Location on Map
        </label>
        {position && (
          <span className="text-xs text-primary-600 font-mono">
            {position[0].toFixed(5)}, {position[1].toFixed(5)}
          </span>
        )}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Click anywhere on the map to set the parking location
      </p>
      <div className="rounded-xl overflow-hidden border-2 border-gray-200 dark:border-dark-border" style={{ height: '250px' }}>
        <MapContainer
          center={center}
          zoom={position ? 16 : 12}
          className="w-full h-full z-0"
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onLocationSelect={onLocationSelect} />
          {position && (
            <>
              <FlyTo position={position} />
              <Marker position={position} icon={pinIcon} />
            </>
          )}
        </MapContainer>
      </div>
    </div>
  );
};

export default LocationPickerMap;
