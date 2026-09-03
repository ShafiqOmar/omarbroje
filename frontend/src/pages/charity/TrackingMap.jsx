import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import { getSocket } from '../../services/socket';

const FONT = "'Plus Jakarta Sans', sans-serif";

const createVolunteerIcon = (rotation = 0) =>
  L.divIcon({
    html: `<div style="transform:rotate(${rotation}deg);font-size:26px;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.5));transition:transform 0.3s ease;">🚚</div>`,
    className: '', iconSize: [32, 32], iconAnchor: [16, 16],
  });

const providerIcon = L.divIcon({
  html: `<div style="background:linear-gradient(135deg,#1b5e20,#43a047);color:white;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 3px 10px rgba(46,125,50,0.5);border:2px solid white">🏪</div>`,
  className: '', iconSize: [36, 36], iconAnchor: [18, 18],
});

const charityIcon = L.divIcon({
  html: `<div style="background:linear-gradient(135deg,#1a237e,#3949ab);color:white;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 3px 10px rgba(57,73,171,0.5);border:2px solid white">🏢</div>`,
  className: '', iconSize: [36, 36], iconAnchor: [18, 18],
});

const haversine = (lat1, lng1, lat2, lng2) => {
  const R = 6371000;
  const toRad = x => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};

function RecenterMap({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView(position, map.getZoom(), { animate: true });
  }, [position, map]);
  return null;
}

function FitBounds({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 1) map.fitBounds(positions, { padding: [50, 50] });
  }, []);
  return null;
}

export default function TrackingMap({
  delivery,
  onClose,
  accentColor = '#1a237e',
  accentLight = '#9fa8da'
}) {
  const [volunteerPos,  setVolunteerPos]  = useState(null);
  const [rotation,      setRotation]      = useState(0);
  const [alerts,        setAlerts]        = useState([]);
  const [distToPickup,  setDistToPickup]  = useState(null);
  const [distToCharity, setDistToCharity] = useState(null);
  const [lastUpdate,    setLastUpdate]    = useState(null);
  const [isLive,        setIsLive]        = useState(false);
  const [gpsWaiting,    setGpsWaiting]    = useState(true);

  const volunteerMarkerRef = useRef(null);
  const animationRef       = useRef(null);
  const notifiedPickup     = useRef(false);
  const notifiedCharity    = useRef(false);

  const pickupPos  = delivery?.pickup_lat  && delivery?.pickup_lng
    ? [parseFloat(delivery.pickup_lat),  parseFloat(delivery.pickup_lng)]  : null;
  const charityPos = delivery?.charity_lat && delivery?.charity_lng
    ? [parseFloat(delivery.charity_lat), parseFloat(delivery.charity_lng)] : null;

  const getRotation = (from, to) => {
    const dx = to[1] - from[1];
    const dy = to[0] - from[0];
    return (Math.atan2(dx, dy) * 180) / Math.PI;
  };

  const animateMarker = (from, to, duration = 1200) => {
    if (!volunteerMarkerRef.current) return;
    const start = performance.now();
    setRotation(getRotation(from, to));
    const step = (timestamp) => {
      const t     = Math.min((timestamp - start) / duration, 1);
      const eased = t < 0.5 ? 2*t*t : -1+(4-2*t)*t;
      const lat   = from[0] + (to[0] - from[0]) * eased;
      const lng   = from[1] + (to[1] - from[1]) * eased;
      volunteerMarkerRef.current?.setLatLng([lat, lng]);
      if (t < 1) animationRef.current = requestAnimationFrame(step);
      else setVolunteerPos(to);
    };
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    animationRef.current = requestAnimationFrame(step);
  };

  const addAlert = (type, message, color) => {
    const id = Date.now();
    setAlerts(prev => [...prev.slice(-2), { id, type, message, color }]);
    setTimeout(() => setAlerts(prev => prev.filter(a => a.id !== id)), 6000);
  };

  const checkProximity = (lat, lng) => {
    if (pickupPos && !notifiedPickup.current) {
      const dist = haversine(lat, lng, pickupPos[0], pickupPos[1]);
      setDistToPickup(Math.round(dist));
      if (dist < 300) {
        notifiedPickup.current = true;
        addAlert('pickup', '🏪 Gönüllü sağlayıcıya yaklaşıyor! (~300m)', '#2e7d32');
      }
    }
    if (charityPos && !notifiedCharity.current) {
      const dist = haversine(lat, lng, charityPos[0], charityPos[1]);
      setDistToCharity(Math.round(dist));
      if (dist < 300) {
        notifiedCharity.current = true;
        addAlert('charity', '🏢 Gönüllü kuruluşa yaklaşıyor! (~300m)', accentColor);
      }
    }
  };

 useEffect(() => {
    const socket = getSocket();
    const deliveryId = delivery?.delivery_id || delivery?.delivery?.delivery_id;
    if (!socket || !deliveryId) return;

    socket.emit('watch_delivery', { deliveryId });
    setIsLive(true);

    const handleLocation = (data) => {
      if (data.deliveryId !== deliveryId || !data.lat || !data.lng) return;
      const newPos = [data.lat, data.lng];
      setLastUpdate(new Date().toLocaleTimeString('tr-TR'));
      setGpsWaiting(false);
      if (volunteerPos) animateMarker(volunteerPos, newPos, 1200);
      else setVolunteerPos(newPos);
      checkProximity(data.lat, data.lng);
    };

    const handleProximity = (data) => {
      if (data.deliveryId !== deliveryId) return;
      const color = data.type === 'pickup' ? '#2e7d32' : accentColor;
      addAlert(data.type, data.message, color);
    };

    // ← كلاهما داخل useEffect
    socket.on('location_update', handleLocation);
    socket.on('proximity_alert',  handleProximity);

    return () => {
      socket.off('location_update', handleLocation);
      socket.off('proximity_alert', handleProximity);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      setIsLive(false);
    };
  }, [delivery]);

  const mapCenter = volunteerPos
    || (pickupPos && charityPos
      ? [(pickupPos[0]+charityPos[0])/2, (pickupPos[1]+charityPos[1])/2]
      : pickupPos || charityPos || [41.0082, 28.9784]);

  const allPositions  = [pickupPos, volunteerPos, charityPos].filter(Boolean);
  const pathPositions = volunteerPos
    ? [pickupPos, volunteerPos, charityPos].filter(Boolean)
    : [pickupPos, charityPos].filter(Boolean);

  const volunteerName = delivery?.volunteer_name
    || delivery?.delivery?.volunteer_name
    || 'Gönüllü';

  return (
    <div style={{ fontFamily: FONT, borderRadius: '16px', overflow: 'hidden',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>

      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${accentColor}ee, ${accentColor})`,
        padding: '1rem 1.4rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.4rem' }}>🗺️</span>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem' }}>
              Canlı Teslimat Takibi
            </div>
            <div style={{ color: accentLight, fontSize: '0.72rem' }}>
              {delivery?.listing_title || 'Teslimat'} · {volunteerName}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            padding: '4px 10px', borderRadius: '20px',
            background: gpsWaiting ? 'rgba(255,255,255,0.1)' : 'rgba(76,175,80,0.2)',
            border: `1px solid ${gpsWaiting ? 'rgba(255,255,255,0.2)' : '#4caf50'}`
          }}>
            <div style={{
              width: '7px', height: '7px', borderRadius: '50%',
              background: gpsWaiting ? '#ffb74d' : '#4caf50',
              boxShadow: `0 0 6px ${gpsWaiting ? '#ffb74d' : '#4caf50'}`,
            }} />
            <span style={{ color: gpsWaiting ? '#ffcc80' : '#a5d6a7',
                           fontSize: '0.72rem', fontWeight: 600 }}>
              {gpsWaiting ? 'GPS Bekleniyor' : 'Canlı Takip ✓'}
            </span>
          </div>
          {onClose && (
            <button onClick={onClose} style={{
              background: 'rgba(255,255,255,0.15)', border: 'none',
              color: '#fff', borderRadius: '8px', padding: '6px 10px',
              cursor: 'pointer', fontSize: '0.8rem', fontFamily: FONT
            }}>✕</button>
          )}
        </div>
      </div>

      {/* GPS waiting */}
      {gpsWaiting && (
        <div style={{
          padding: '10px 16px', background: '#fff8e1',
          borderBottom: '1px solid #ffe082',
          color: '#f57f17', fontSize: '0.82rem', fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          ⏳ Gönüllünün GPS konumu bekleniyor...
          <span style={{ fontSize: '0.72rem', color: '#9e9e9e', fontWeight: 400 }}>
            Sağlayıcı ve kuruluş konumları haritada gösterilmektedir.
          </span>
        </div>
      )}

      {/* Alerts */}
      {alerts.map(alert => (
        <div key={alert.id} style={{
          padding: '10px 16px',
          background: `${alert.color}15`,
          borderBottom: `1px solid ${alert.color}30`,
          color: alert.color, fontSize: '0.85rem', fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          {alert.message}
        </div>
      ))}

      {/* Map */}
      <div style={{ height: '380px', width: '100%' }}>
        <MapContainer center={mapCenter} zoom={14}
                      style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                     attribution='&copy; OpenStreetMap' />

          {pickupPos && (
            <Circle center={pickupPos} radius={300}
              pathOptions={{ color: '#2e7d32', fillColor: '#2e7d32',
                             fillOpacity: 0.07, weight: 1, dashArray: '5 5' }} />
          )}
          {charityPos && (
            <Circle center={charityPos} radius={300}
              pathOptions={{ color: accentColor, fillColor: accentColor,
                             fillOpacity: 0.07, weight: 1, dashArray: '5 5' }} />
          )}

          {pathPositions.length > 1 && (
            <Polyline positions={pathPositions}
              pathOptions={{ color: accentColor, weight: 3, dashArray: '8 6', opacity: 0.6 }} />
          )}

          {pickupPos && (
            <Marker position={pickupPos} icon={providerIcon}>
              <Popup>
                <div style={{ fontFamily: FONT }}>
                  <strong>🏪 Sağlayıcı</strong>
                  {distToPickup !== null && (
                    <div style={{ color: '#2e7d32', fontSize: '0.8rem', marginTop: '4px' }}>
                      📍 {distToPickup}m uzakta
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          )}

          {charityPos && (
            <Marker position={charityPos} icon={charityIcon}>
              <Popup>
                <div style={{ fontFamily: FONT }}>
                  <strong>🏢 Yardım Kuruluşu</strong>
                  {distToCharity !== null && (
                    <div style={{ color: accentColor, fontSize: '0.8rem', marginTop: '4px' }}>
                      📍 {distToCharity}m uzakta
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          )}

          {/* Volunteer فقط بعد وصول GPS */}
          {volunteerPos && (
            <Marker ref={volunteerMarkerRef} position={volunteerPos}
                    icon={createVolunteerIcon(rotation)}>
              <Popup>
                <div style={{ fontFamily: FONT }}>
                  <strong>🚚 {volunteerName}</strong>
                  {lastUpdate && (
                    <div style={{ color: '#9e9e9e', fontSize: '0.75rem', marginTop: '4px' }}>
                      🕐 {lastUpdate}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          )}

          {allPositions.length > 1 && !volunteerPos && <FitBounds positions={allPositions} />}
          {volunteerPos && <RecenterMap position={volunteerPos} />}
        </MapContainer>
      </div>

      {/* Info bar */}
      <div style={{
        background: '#fff', padding: '0.9rem 1.2rem',
        borderTop: `1px solid ${accentColor}15`,
        display: 'flex', gap: '16px', flexWrap: 'wrap',
        alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {[
            { icon: '🟢', label: 'Sağlayıcı', color: '#2e7d32',
              sub: distToPickup !== null ? `${distToPickup}m` : '—' },
            { icon: '🔵', label: 'Kuruluş', color: accentColor,
              sub: distToCharity !== null ? `${distToCharity}m` : '—' },
            { icon: '🚚', label: 'Gönüllü', color: '#4a148c',
              sub: lastUpdate || (gpsWaiting ? 'GPS bekleniyor' : '—') },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>{item.icon}</span>
              <div>
                <div style={{ fontSize: '0.65rem', color: '#9e9e9e', fontWeight: 600 }}>
                  {item.label}
                </div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: item.color }}>
                  {item.sub}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: '0.7rem', color: '#bdbdbd' }}>
          ⭕ 300m · - - Rota
        </div>
      </div>
    </div>
  );
}