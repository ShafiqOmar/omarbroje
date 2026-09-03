import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import EmptyState from '../../components/shared/EmptyState';

const FONT = "'Plus Jakarta Sans', sans-serif";

// ── Haversine ──
const haversine = (lat1, lng1, lat2, lng2) => {
  const R = 6371000;
  const toRad = x => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};

// ── Icons ──
const volunteerIcon = (rotation = 0) => L.divIcon({
  html: `<div style="transform:rotate(${rotation}deg);font-size:26px;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.5));transition:transform 0.3s ease;">🚚</div>`,
  className: '', iconSize: [30, 30], iconAnchor: [15, 15],
});

const providerIcon = L.divIcon({
  html: `<div style="background:linear-gradient(135deg,#1b5e20,#43a047);color:white;border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-size:17px;box-shadow:0 3px 10px rgba(46,125,50,0.5);border:2px solid white">🏪</div>`,
  className: '', iconSize: [34, 34], iconAnchor: [17, 17],
});

const charityIcon = L.divIcon({
  html: `<div style="background:linear-gradient(135deg,#1a237e,#3949ab);color:white;border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-size:17px;box-shadow:0 3px 10px rgba(57,73,171,0.5);border:2px solid white">🏢</div>`,
  className: '', iconSize: [34, 34], iconAnchor: [17, 17],
});

// ── Status config ──
const STATUS_CFG = {
  ASSIGNED:  { bg: '#fff8e1', color: '#f57f17', label: 'Atandı'        },
  PICKED_UP: { bg: '#e3f2fd', color: '#1565c0', label: 'Teslim Alındı' },
};

// ── Recenter map ──
function RecenterMap({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView(position, map.getZoom(), { animate: true });
  }, [position, map]);
  return null;
}

export default function LiveTrackingTab() {
  const [deliveries,    setDeliveries]   = useState([]);
  const [selected,      setSelected]     = useState(null);
  const [positions,     setPositions]    = useState({});
  const [rotations,     setRotations]    = useState({});
  const [distToPickup,  setDistToPickup] = useState(null);
  const [distToCharity, setDistToCharity]= useState(null);
  const [lastUpdate,    setLastUpdate]   = useState(null);
  const [alerts,        setAlerts]       = useState([]);
  const [loading,       setLoading]      = useState(true);

  const prevPositions   = useRef({});
  const notifiedPickup  = useRef({});
  const notifiedCharity = useRef({});

  // ── Fetch deliveries ──
  useEffect(() => {
    fetchDeliveries();
    const interval = setInterval(fetchDeliveries, 15000);
    return () => clearInterval(interval);
  }, []);

  // ── Socket ──
  useEffect(() => {
    const socket = getSocket();
    if (!socket || deliveries.length === 0) return;

    deliveries.forEach(d => {
      socket.emit('watch_delivery', { deliveryId: d.delivery_id });
    });

    const handleLocation = (data) => {
      const { deliveryId, lat, lng } = data;

      // حساب الاتجاه
      const prev = prevPositions.current[deliveryId];
      if (prev) {
        const dx = lng - prev.lng;
        const dy = lat - prev.lat;
        const angle = (Math.atan2(dx, dy) * 180) / Math.PI;
        setRotations(r => ({ ...r, [deliveryId]: angle }));
      }
      prevPositions.current[deliveryId] = { lat, lng };
      setPositions(p => ({ ...p, [deliveryId]: { lat, lng } }));

      // تحديث المعلومات إذا كان هذا الـ delivery محدد
      if (selected?.delivery_id === deliveryId) {
        setLastUpdate(new Date().toLocaleTimeString('tr-TR'));
        checkProximity(deliveryId, lat, lng);
      }
    };

    const handleProximity = (data) => {
      const color = data.type === 'pickup' ? '#2e7d32' : '#b71c1c';
      addAlert(data.type, data.message, color);
    };

    socket.on('location_update', handleLocation);
    socket.on('proximity_alert', handleProximity);

    return () => {
      socket.off('location_update', handleLocation);
      socket.off('proximity_alert', handleProximity);
    };
  }, [deliveries, selected]);

  // إعادة ضبط عند تغيير الـ selected
  useEffect(() => {
    if (selected) {
      setDistToPickup(null);
      setDistToCharity(null);
      setLastUpdate(null);
      notifiedPickup.current[selected.delivery_id]  = false;
      notifiedCharity.current[selected.delivery_id] = false;
    }
  }, [selected?.delivery_id]);

  const fetchDeliveries = async () => {
    try {
      const { data } = await api.get('/admin/active-deliveries');
      setDeliveries(data);
      if (data.length > 0 && !selected) setSelected(data[0]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addAlert = (type, message, color) => {
    const id = Date.now();
    setAlerts(prev => [...prev.slice(-2), { id, type, message, color }]);
    setTimeout(() => setAlerts(prev => prev.filter(a => a.id !== id)), 6000);
  };

  const checkProximity = (deliveryId, lat, lng) => {
    const del = deliveries.find(d => d.delivery_id === deliveryId);
    if (!del) return;

    const pickupPos  = del.pickup_lat  && del.pickup_lng
      ? [parseFloat(del.pickup_lat),  parseFloat(del.pickup_lng)]  : null;
    const charityPos = del.charity_lat && del.charity_lng
      ? [parseFloat(del.charity_lat), parseFloat(del.charity_lng)] : null;

    if (pickupPos) {
      const dist = haversine(lat, lng, pickupPos[0], pickupPos[1]);
      setDistToPickup(Math.round(dist));
      if (dist < 300 && !notifiedPickup.current[deliveryId]) {
        notifiedPickup.current[deliveryId] = true;
        addAlert('pickup', `🏪 Gönüllü sağlayıcıya yaklaşıyor! (~300m)`, '#2e7d32');
      }
    }
    if (charityPos) {
      const dist = haversine(lat, lng, charityPos[0], charityPos[1]);
      setDistToCharity(Math.round(dist));
      if (dist < 300 && !notifiedCharity.current[deliveryId]) {
        notifiedCharity.current[deliveryId] = true;
        addAlert('delivery', `🏢 Gönüllü kuruluşa yaklaşıyor! (~300m)`, '#b71c1c');
      }
    }
  };

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '4rem', background: '#fff', borderRadius: '20px' }}>
      <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>⏳</div>
      <p style={{ color: '#9e9e9e', fontFamily: FONT }}>Yükleniyor...</p>
    </div>
  );

  if (deliveries.length === 0)
    return <EmptyState icon="🚚" message="Şu an aktif teslimat yok" />;

  // ── Map positions ──
  const selPos     = selected ? positions[selected.delivery_id] : null;
  const volPos     = selPos ? [selPos.lat, selPos.lng] : null;
  const pickupPos  = selected?.pickup_lat  && selected?.pickup_lng
    ? [parseFloat(selected.pickup_lat),  parseFloat(selected.pickup_lng)]  : null;
  const charityPos = selected?.charity_lat && selected?.charity_lng
    ? [parseFloat(selected.charity_lat), parseFloat(selected.charity_lng)] : null;

  const mapCenter  = volPos
    || (pickupPos && charityPos
      ? [(pickupPos[0]+charityPos[0])/2, (pickupPos[1]+charityPos[1])/2]
      : pickupPos || charityPos || [41.0082, 28.9784]);

  const pathPositions = volPos
    ? [pickupPos, volPos, charityPos].filter(Boolean)
    : [pickupPos, charityPos].filter(Boolean);

  const isGpsActive = !!selPos;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '16px', fontFamily: FONT }}>

      {/* ── Deliveries List ── */}
      <div style={{ display: 'grid', gap: '10px', alignContent: 'start',
                    maxHeight: '640px', overflowY: 'auto' }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#9e9e9e',
                      textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 4px' }}>
          Aktif Teslimatlar ({deliveries.length})
        </div>

        {deliveries.map(d => {
          const s        = STATUS_CFG[d.status] || STATUS_CFG.ASSIGNED;
          const isActive = selected?.delivery_id === d.delivery_id;
          const hasGPS   = !!positions[d.delivery_id];

          return (
            <div key={d.delivery_id} onClick={() => setSelected(d)} style={{
              background: '#fff', borderRadius: '12px', padding: '1rem',
              boxShadow: '0 2px 10px rgba(0,0,0,0.07)',
              border: isActive ? '2px solid #b71c1c' : '1px solid rgba(0,0,0,0.05)',
              cursor: 'pointer', transition: 'all 0.2s',
              transform: isActive ? 'scale(1.01)' : 'scale(1)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between',
                            alignItems: 'flex-start', marginBottom: '6px' }}>
                <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#333' }}>
                  {d.listing_title}
                </span>
                <span style={{ padding: '2px 8px', borderRadius: '20px',
                               background: s.bg, color: s.color,
                               fontSize: '0.68rem', fontWeight: 600, flexShrink: 0 }}>
                  {s.label}
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#757575', display: 'grid', gap: '2px' }}>
                <span>🚚 {d.volunteer_name}</span>
                <span>🏪 {d.provider_name}</span>
                <span>🏢 {d.charity_name}</span>
                <span>📦 {d.requested_quantity} birim</span>
              </div>
              <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{
                  width: '7px', height: '7px', borderRadius: '50%',
                  background: hasGPS ? '#4caf50' : '#ffb74d',
                  boxShadow: hasGPS ? '0 0 5px #4caf50' : '0 0 5px #ffb74d',
                  animation: hasGPS ? 'admin_pulse 1.5s infinite' : 'none'
                }} />
                <span style={{ fontSize: '0.68rem', fontWeight: 600,
                               color: hasGPS ? '#4caf50' : '#f57f17' }}>
                  {hasGPS ? 'GPS Aktif ✓' : 'GPS Bekleniyor'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Map ── */}
      <div style={{ borderRadius: '16px', overflow: 'hidden',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>

        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #6a0000, #b71c1c)',
          padding: '0.9rem 1.2rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.3rem' }}>🗺️</span>
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>
                {selected?.listing_title || 'Teslimat Seçin'}
              </div>
              <div style={{ color: '#ef9a9a', fontSize: '0.7rem' }}>
                {selected?.volunteer_name} · {selected?.provider_name} → {selected?.charity_name}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Live indicator */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '4px 10px', borderRadius: '20px',
              background: isGpsActive ? 'rgba(76,175,80,0.2)' : 'rgba(255,255,255,0.1)',
              border: `1px solid ${isGpsActive ? '#4caf50' : 'rgba(255,255,255,0.2)'}`
            }}>
              <div style={{
                width: '7px', height: '7px', borderRadius: '50%',
                background: isGpsActive ? '#4caf50' : '#ffb74d',
                boxShadow: `0 0 6px ${isGpsActive ? '#4caf50' : '#ffb74d'}`,
                animation: isGpsActive ? 'admin_pulse 1.5s infinite' : 'none'
              }} />
              <span style={{ color: isGpsActive ? '#a5d6a7' : '#ffcc80',
                             fontSize: '0.72rem', fontWeight: 600 }}>
                {isGpsActive ? 'Canlı Takip ✓' : 'GPS Bekleniyor'}
              </span>
            </div>

            <button onClick={fetchDeliveries} style={{
              background: 'rgba(255,255,255,0.15)', border: 'none',
              color: '#fff', borderRadius: '8px', padding: '6px 12px',
              cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600
            }}>
              🔄 Yenile
            </button>
          </div>
        </div>

        {/* GPS waiting message */}
        {!isGpsActive && (
          <div style={{
            padding: '10px 16px', background: '#fff8e1',
            borderBottom: '1px solid #ffe082',
            color: '#f57f17', fontSize: '0.82rem', fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            ⏳ Gönüllünün GPS konumu bekleniyor...
            <span style={{ fontSize: '0.72rem', color: '#9e9e9e', fontWeight: 400 }}>
              Sağlayıcı ve kuruluş konumları gösterilmektedir.
            </span>
          </div>
        )}

        {/* Proximity alerts */}
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
        <div style={{ height: '440px' }}>
          <MapContainer center={mapCenter} zoom={14} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                       attribution='&copy; OpenStreetMap' />

            {pickupPos && (
              <Circle center={pickupPos} radius={300}
                pathOptions={{ color: '#2e7d32', fillColor: '#2e7d32',
                               fillOpacity: 0.07, weight: 1, dashArray: '5 5' }} />
            )}
            {charityPos && (
              <Circle center={charityPos} radius={300}
                pathOptions={{ color: '#b71c1c', fillColor: '#b71c1c',
                               fillOpacity: 0.07, weight: 1, dashArray: '5 5' }} />
            )}

            {pathPositions.length > 1 && (
              <Polyline positions={pathPositions}
                pathOptions={{ color: '#b71c1c', weight: 3, dashArray: '8 6', opacity: 0.6 }} />
            )}

            {pickupPos && (
              <Marker position={pickupPos} icon={providerIcon}>
                <Popup>
                  <div style={{ fontFamily: FONT }}>
                    <strong>🏪 {selected?.provider_name}</strong>
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
                    <strong>🏢 {selected?.charity_name}</strong>
                    {distToCharity !== null && (
                      <div style={{ color: '#b71c1c', fontSize: '0.8rem', marginTop: '4px' }}>
                        📍 {distToCharity}m uzakta
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            )}

            {volPos && (
              <Marker position={volPos}
                      icon={volunteerIcon(rotations[selected?.delivery_id] || 0)}>
                <Popup>
                  <div style={{ fontFamily: FONT }}>
                    <strong>🚚 {selected?.volunteer_name}</strong>
                    {lastUpdate && (
                      <div style={{ color: '#9e9e9e', fontSize: '0.75rem', marginTop: '4px' }}>
                        🕐 {lastUpdate}
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            )}

            {volPos && <RecenterMap position={volPos} />}
          </MapContainer>
        </div>

        {/* Info bar */}
        <div style={{
          background: '#fff', padding: '0.8rem 1.2rem',
          display: 'flex', gap: '16px', flexWrap: 'wrap',
          alignItems: 'center', justifyContent: 'space-between',
          borderTop: '1px solid #ffebee'
        }}>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {[
              { icon: '🟢', label: 'Sağlayıcı', color: '#2e7d32',
                sub: distToPickup !== null ? `${distToPickup}m` : selected?.provider_name || '—' },
              { icon: '🔵', label: 'Kuruluş',   color: '#b71c1c',
                sub: distToCharity !== null ? `${distToCharity}m` : selected?.charity_name || '—' },
              { icon: '🚚', label: 'Gönüllü',   color: '#4a148c',
                sub: lastUpdate || (isGpsActive ? '—' : 'GPS bekleniyor') },
              { icon: '📦', label: 'Miktar',    color: '#333',
                sub: `${selected?.requested_quantity || 0} birim` },
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

      <style>{`
        @keyframes admin_pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}