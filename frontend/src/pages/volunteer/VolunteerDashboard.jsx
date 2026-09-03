import { useState, useEffect } from 'react';
import {
  TruckIcon, ClockIcon, CheckCircleIcon,
  BellIcon, ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import NotificationPanel from '../../components/NotificationPanel';
import StatCard          from '../../components/shared/StatCard';
import AlertMessage      from '../../components/shared/AlertMessage';
import AvailableTab      from './AvailableTab';
import MyDeliveriesTab   from './MyDeliveriesTab';
import HistoryTab        from './HistoryTab';
import api               from '../../services/api';
import { getSocket }     from '../../services/socket';
import { useAuth }       from '../../context/AuthContext';
import { useNavigate }   from 'react-router-dom';
import logo              from '../../assets/logo.png';

const FONT = "'Plus Jakarta Sans', sans-serif";

const NAV_ITEMS = [
  { key: 'available', label: 'Mevcut Görevler',  Icon: TruckIcon        },
  { key: 'my',        label: 'Aktif Görevlerim', Icon: ClockIcon        },
  { key: 'history',   label: 'Geçmişim',         Icon: CheckCircleIcon  },
];

export default function VolunteerDashboard() {
  const { user, logout }                = useAuth();
  const navigate                        = useNavigate();
  const [tab,          setTab]          = useState('available');
  const [available,    setAvailable]    = useState([]);
  const [myDeliveries, setMyDeliveries] = useState([]);
  const [notifCount,   setNotifCount]   = useState(0);
  const [showNotif,    setShowNotif]    = useState(false);
  const [msg,          setMsg]          = useState({ type: '', text: '' });
  const [trackingId,   setTrackingId]   = useState(null);

  // ── Fetch on mount ──
  useEffect(() => {
    fetchAll();
    const socket = getSocket();
    if (socket) socket.on('new_notification', () => setNotifCount(p => p + 1));
    return () => { if (socket) socket.off('new_notification'); };
  }, []);

  // ── Auto GPS when trackingId changes ──
  useEffect(() => {
    if (!trackingId) return;

    const socket = getSocket();
    if (!socket) return;

    // انضم لغرفة التوصيل
    socket.emit('join_delivery', { deliveryId: trackingId });
    console.log(`📍 GPS started for delivery: ${trackingId}`);

    if (!navigator.geolocation) {
      showMsg('error', 'Konum servisi desteklenmiyor');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        socket.emit('update_location', {
          deliveryId: trackingId,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
      },
      (err) => console.error('GPS error:', err),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
      console.log(`📍 GPS stopped for delivery: ${trackingId}`);
    };
  }, [trackingId]);

  // ── Fetch functions ──
  const fetchAll = () => {
    fetchAvailable();
    fetchMyDeliveries();
    fetchUnread();
  };

  const fetchAvailable = async () => {
    try {
      const { data } = await api.get('/deliveries/available');
      setAvailable(data);
    } catch (err) { console.error(err); }
  };

  const fetchMyDeliveries = async () => {
    try {
      const { data } = await api.get('/deliveries/my');
      setMyDeliveries(data);

      // استأنف GPS إذا يوجد delivery نشط بعد إعادة التحميل
      const active = data.find(d => ['ASSIGNED', 'PICKED_UP'].includes(d.status));
      if (active && !trackingId) {
        setTrackingId(active.delivery_id);
        console.log(`📍 Resuming GPS for active delivery: ${active.delivery_id}`);
      }
    } catch (err) { console.error(err); }
  };

  const fetchUnread = async () => {
    try {
      const { data } = await api.get('/notifications/unread-count');
      setNotifCount(data.unread_count);
    } catch {}
  };

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: '', text: '' }), 3500);
  };

  // ── Accept delivery → start GPS automatically ──
  const handleAccept = async (requestId) => {
    try {
      const { data } = await api.post('/deliveries/accept', { request_id: requestId });
      setTrackingId(data.deliveryId); // ← يُشغّل useEffect GPS تلقائياً
      showMsg('success', 'Teslimat kabul edildi! GPS başladı 📍');
      fetchAll();
      setTab('my');
    } catch (err) {
      showMsg('error', err.response?.data?.message || 'Hata oluştu');
    }
  };

  // ── Update delivery status ──
  const handleUpdateStatus = async (deliveryId, status) => {
    try {
      await api.patch(`/deliveries/${deliveryId}/status`, { status });
      if (status === 'DELIVERED') {
        setTrackingId(null); // ← أوقف GPS عند الانتهاء
        showMsg('success', 'Teslimat tamamlandı! ✅');
      } else {
        showMsg('success', 'Durum güncellendi');
      }
      fetchMyDeliveries();
    } catch (err) {
      showMsg('error', err.response?.data?.message || 'Hata oluştu');
    }
  };

  // ── Manual GPS share (fallback) ──
  const handleShareLocation = (deliveryId) => {
    setTrackingId(deliveryId);
    showMsg('success', 'GPS konumunuz paylaşılıyor 📍');
  };

  const handleLogout = async () => { await logout(); navigate('/login'); };

  const activeCount    = myDeliveries.filter(d => ['ASSIGNED','PICKED_UP'].includes(d.status)).length;
  const completedCount = myDeliveries.filter(d => d.status === 'DELIVERED').length;

  const navItems = NAV_ITEMS.map(n =>
    n.key === 'available' ? { ...n, badge: available.length } : n
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: FONT, background: '#f5f0ff' }}>

      {/* ── SIDEBAR ── */}
      <div style={{
        width: '260px', flexShrink: 0,
        background: 'linear-gradient(180deg, #2d0a6e 0%, #4a148c 50%, #6a1b9a 100%)',
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: 0,
        height: '100vh', zIndex: 100,
        boxShadow: '4px 0 24px rgba(0,0,0,0.2)'
      }}>

        {/* Logo */}
        <div style={{ padding: '1.5rem 1.2rem 1rem',
                      borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px',
                          background: 'rgba(255,255,255,0.95)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.2)', overflow: 'hidden', flexShrink: 0 }}>
              <img src={logo} alt="logo" style={{ width: '34px', height: '34px', objectFit: 'contain' }} />
            </div>
            <div>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: '1rem',
                            letterSpacing: '-0.02em', lineHeight: 1 }}>SmartFoodAid</div>
              <div style={{ color: '#ce93d8', fontSize: '0.62rem', fontWeight: 500, marginTop: '2px' }}>
                Gıda İsrafını Önle
              </div>
            </div>
          </div>
        </div>

        {/* User */}
        <div style={{ padding: '1rem 1.2rem' }}>
          <div style={{ padding: '0.9rem', borderRadius: '12px',
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px',
                          background: 'linear-gradient(135deg, #7b1fa2, #9c27b0)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '1.1rem', fontWeight: 800, color: '#fff', flexShrink: 0 }}>
              {user?.fullName?.charAt(0).toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.85rem',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.fullName}
              </div>
              <div style={{ display: 'inline-block', marginTop: '3px',
                            padding: '1px 8px', borderRadius: '10px',
                            background: 'rgba(206,147,216,0.2)',
                            border: '1px solid rgba(206,147,216,0.3)',
                            color: '#ce93d8', fontSize: '0.65rem', fontWeight: 600 }}>
                🤝 Gönüllü
              </div>
            </div>
          </div>
        </div>

        {/* GPS Status Indicator */}
        {trackingId && (
          <div style={{
            margin: '0 0.8rem', padding: '0.7rem 1rem', borderRadius: '10px',
            background: 'rgba(76,175,80,0.15)',
            border: '1px solid rgba(76,175,80,0.3)',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <div style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: '#4caf50', boxShadow: '0 0 6px #4caf50',
              animation: 'gps_pulse 1.5s infinite'
            }} />
            <span style={{ color: '#a5d6a7', fontSize: '0.72rem', fontWeight: 600 }}>
              GPS Aktif — Konum Paylaşılıyor
            </span>
          </div>
        )}

        {/* Nav */}
        <div style={{ padding: '0 0.8rem', flex: 1, marginTop: trackingId ? '8px' : '0' }}>
          <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.4)',
                        fontWeight: 700, letterSpacing: '0.1em',
                        textTransform: 'uppercase', padding: '0 0.4rem', marginBottom: '6px' }}>
            Menü
          </div>
          {navItems.map(({ key, label, Icon, badge }) => {
            const active = tab === key;
            return (
              <button key={key} onClick={() => setTab(key)} style={{
                width: '100%', display: 'flex', alignItems: 'center',
                gap: '10px', padding: '10px 12px', borderRadius: '10px',
                border: 'none', cursor: 'pointer', marginBottom: '4px',
                fontFamily: FONT, fontSize: '0.85rem', fontWeight: 600,
                transition: 'all 0.2s', textAlign: 'left',
                background: active ? 'rgba(255,255,255,0.15)' : 'transparent',
                color: active ? '#fff' : 'rgba(255,255,255,0.65)',
                borderLeft: active ? '3px solid #ce93d8' : '3px solid transparent',
              }}>
                <Icon style={{ width: '18px', height: '18px', flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{label}</span>
                {badge > 0 && (
                  <span style={{ background: '#ef5350', color: '#fff',
                                 borderRadius: '10px', padding: '1px 7px',
                                 fontSize: '0.68rem', fontWeight: 700 }}>
                    {badge}
                  </span>
                )}
              </button>
            );
          })}

          <div style={{ marginTop: '8px', marginBottom: '4px',
                        fontSize: '0.62rem', color: 'rgba(255,255,255,0.4)',
                        fontWeight: 700, letterSpacing: '0.1em',
                        textTransform: 'uppercase', padding: '0 0.4rem' }}>
            Bildirimler
          </div>
          <button onClick={() => setShowNotif(!showNotif)} style={{
            width: '100%', display: 'flex', alignItems: 'center',
            gap: '10px', padding: '10px 12px', borderRadius: '10px',
            border: 'none', cursor: 'pointer',
            fontFamily: FONT, fontSize: '0.85rem', fontWeight: 600,
            background: showNotif ? 'rgba(255,255,255,0.15)' : 'transparent',
            color: 'rgba(255,255,255,0.65)', borderLeft: '3px solid transparent',
          }}>
            <BellIcon style={{ width: '18px', flexShrink: 0 }} />
            <span style={{ flex: 1 }}>Bildirimler</span>
            {notifCount > 0 && (
              <span style={{ background: '#ef5350', color: '#fff',
                             borderRadius: '10px', padding: '1px 7px',
                             fontSize: '0.68rem', fontWeight: 700 }}>
                {notifCount}
              </span>
            )}
          </button>
        </div>

        {/* Stats */}
        <div style={{ margin: '0 0.8rem', padding: '0.8rem', borderRadius: '12px',
                      background: 'rgba(255,255,255,0.07)',
                      border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.4)',
                        fontWeight: 700, letterSpacing: '0.1em',
                        textTransform: 'uppercase', marginBottom: '8px' }}>
            Özet
          </div>
          {[
            { label: 'Mevcut Görev', value: available.length,  color: '#ce93d8' },
            { label: 'Aktif',        value: activeCount,       color: '#90caf9' },
            { label: 'Tamamlanan',   value: completedCount,    color: '#a5d6a7' },
          ].map((s, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between',
                                  padding: '5px 0', fontSize: '0.78rem',
                                  borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>{s.label}</span>
              <span style={{ fontWeight: 700, color: s.color }}>{s.value}</span>
            </div>
          ))}
        </div>

        {/* Logout */}
        <div style={{ padding: '1rem 0.8rem' }}>
          <button onClick={handleLogout} style={{
            width: '100%', display: 'flex', alignItems: 'center',
            gap: '10px', padding: '10px 12px', borderRadius: '10px',
            border: '1px solid rgba(239,83,80,0.3)', cursor: 'pointer',
            fontFamily: FONT, fontSize: '0.85rem', fontWeight: 600,
            background: 'rgba(239,83,80,0.1)', color: '#ef9a9a',
          }}>
            <ArrowRightOnRectangleIcon style={{ width: '18px' }} />
            Çıkış Yap
          </button>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{ marginLeft: '260px', flex: 1, minWidth: 0 }}>
        <div style={{ background: '#fff', padding: '1rem 2rem',
                      borderBottom: '1px solid #ede7f6',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      position: 'sticky', top: 0, zIndex: 50,
                      boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#4a148c' }}>
              {navItems.find(n => n.key === tab)?.label}
            </h2>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#9e9e9e', marginTop: '2px' }}>
              {new Date().toLocaleDateString('tr-TR', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
              })}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {trackingId && (
              <div style={{ padding: '6px 12px', borderRadius: '20px',
                            background: '#e8f5e9', border: '1px solid #c8e6c9',
                            fontSize: '0.78rem', color: '#2e7d32', fontWeight: 600,
                            display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%',
                              background: '#4caf50' }} />
                GPS Aktif
              </div>
            )}
            {activeCount > 0 && (
              <div style={{ padding: '6px 12px', borderRadius: '20px',
                            background: '#f3e5f5', border: '1px solid #ce93d8',
                            fontSize: '0.78rem', color: '#7b1fa2', fontWeight: 600 }}>
                🚗 {activeCount} aktif teslimat
              </div>
            )}
          </div>
        </div>

        {showNotif && (
          <NotificationPanel onClose={() => setShowNotif(false)} onRead={() => setNotifCount(0)} />
        )}

        <div style={{ padding: '2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)',
                        gap: '1rem', marginBottom: '2rem' }}>
            <StatCard icon="📦" label="Mevcut Görev"   value={available.length}   color="#4a148c" />
            <StatCard icon="🚗" label="Aktif Teslimat" value={activeCount}         color="#1565c0" />
            <StatCard icon="✅" label="Tamamlanan"     value={completedCount}      color="#2e7d32" />
            <StatCard icon="🏆" label="Toplam"         value={myDeliveries.length} color="#e65100" />
          </div>

          <AlertMessage type={msg.type} text={msg.text} />

          {tab === 'available' && (
            <AvailableTab available={available} onAccept={handleAccept} />
          )}
          {tab === 'my' && (
            <MyDeliveriesTab
              deliveries={myDeliveries.filter(d => ['ASSIGNED','PICKED_UP'].includes(d.status))}
              onUpdateStatus={handleUpdateStatus}
              onShareLocation={handleShareLocation}
              onViewAvailable={() => setTab('available')}
            />
          )}
          {tab === 'history' && (
            <HistoryTab deliveries={myDeliveries.filter(d => d.status === 'DELIVERED')} />
          )}
        </div>
      </div>

      <style>{`
        @keyframes gps_pulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 6px #4caf50; }
          50% { opacity: 0.5; box-shadow: 0 0 12px #4caf50; }
        }
      `}</style>
    </div>
  );
}