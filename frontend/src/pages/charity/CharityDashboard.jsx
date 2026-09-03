import { useState, useEffect } from 'react';
import {
  MagnifyingGlassIcon, ClockIcon, TruckIcon,
  BellIcon, ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import NotificationPanel from '../../components/NotificationPanel';
import StatCard          from '../../components/shared/StatCard';
import AlertMessage      from '../../components/shared/AlertMessage';
import RatingModal       from '../../components/shared/RatingModal';
import BrowseTab         from './BrowseTab';
import MyRequestsTab     from './MyRequestsTab';
import DeliveriesTab     from './DeliveriesTab';
import api               from '../../services/api';
import { getSocket }     from '../../services/socket';
import { useAuth }       from '../../context/AuthContext';
import { useNavigate }   from 'react-router-dom';
import logo              from '../../assets/logo.png';
import ReportsTab from './ReportsTab';
import { ChartBarIcon } from '@heroicons/react/24/outline';
import TrackingMap from './TrackingMap';

const FONT = "'Plus Jakarta Sans', sans-serif";

const NAV_ITEMS = [
  { key: 'browse',     label: 'Gıda İlanları',  Icon: MagnifyingGlassIcon },
  { key: 'requests',   label: 'Taleplerim',      Icon: ClockIcon           },
  { key: 'deliveries', label: 'Teslimatlarım',   Icon: TruckIcon           },
  { key: 'reports',    label: 'Raporlarım',      Icon: ChartBarIcon        },
  { key: 'tracking',   label: 'Takip Et',        Icon: TruckIcon           }
];

export default function CharityDashboard() {
  const { user, logout }              = useAuth();
  const navigate                      = useNavigate();
  const [tab,          setTab]        = useState('browse');
  const [listings,     setListings]   = useState([]);
  const [requests,     setRequests]   = useState([]);
  const [deliveries,   setDeliveries] = useState([]);
  const [notifCount,   setNotifCount] = useState(0);
  const [showNotif,    setShowNotif]  = useState(false);
  const [msg,          setMsg]        = useState({ type: '', text: '' });
  const [ratingModal,  setRatingModal]= useState(null);
  const [loadingList,  setLoadingList]= useState(true);
  const [report, setReport] = useState(null);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [selectedDeliveryId, setSelectedDeliveryId] = useState(null);
  const [capacityStatus, setCapacityStatus] = useState('ACCEPTING');

 useEffect(() => {
  fetchAll();
  const socket = getSocket();
  if (socket) {
    socket.on('new_notification', () => {
      setNotifCount(p => p + 1);
      fetchAll(); // ← يحدّث الإعلانات فور وصول إشعار
    });
  }

  // تحديث تلقائي كل 30 ثانية
  const interval = setInterval(() => {
    fetchListings();
  }, 30000);

  return () => {
    if (socket) socket.off('new_notification');
    clearInterval(interval);
  };
}, []);

  useEffect(() => {
    if (tab === 'browse')     fetchListings();
    if (tab === 'requests')   fetchRequests();
    if (tab === 'deliveries') fetchDeliveries();
    if (tab === 'reports')    fetchReport();
  }, [tab]);

  const fetchAll = () => {
    fetchListings();
    fetchRequests();
    fetchDeliveries();
    fetchUnread();
    fetchReport();
    fetchCapacity();
  };

  const fetchListings = async () => {
    setLoadingList(true);
    try {
      const { data } = await api.get('/food');
      console.log('Listings from server:', data);
      setListings(data);
       
    } catch (err) {
      console.error('fetchListings error:', err);
    } finally {
      setLoadingList(false);
    }
  };

  const fetchRequests = async () => {
    try {
      const { data } = await api.get('/requests/my');
      setRequests(data);
    } catch (err) {
      console.error('fetchRequests error:', err);
    }
  };

  const fetchUnread = async () => {
    try {
      const { data } = await api.get('/notifications/unread-count');
      setNotifCount(data.unread_count);
    } catch {}
  };

  const fetchCapacity = async () => {
  try {
    const { data } = await api.get('/auth/profile');
    setCapacityStatus(data.capacity_status || 'ACCEPTING');
  } catch {}
 };

 const fetchDeliveries = async () => {
  try {
    const { data } = await api.get('/requests/my');

    // فقط الطلبات المعتمدة أو المنجزة
    const approved = data.filter(r => ['APPROVED', 'DELIVERED'].includes(r.status));

    const withDelivery = await Promise.all(
      approved.map(async (r) => {
        try {
          const res = await api.get(`/deliveries/by-request/${r.request_id}`);
          console.log('Delivery data:', res.data); // مؤقت
          return { ...r, delivery: res.data }; // ← ضع البيانات تحت مفتاح delivery
        } catch (err) {
          if (err.response?.status === 404) {
            console.log('No delivery for request:', r.request_id);
            return { ...r, delivery: null }; // ← نضيف مفتاح delivery فارغ
          }
          throw err; // أي خطأ آخر يُرفع
        }
      })
    );

    console.log('Deliveries with data:', withDelivery); // مؤقت
    setDeliveries(withDelivery);

  } catch (err) {
    console.error('fetchDeliveries error:', err);
  }
};

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: '', text: '' }), 3500);
  };

 const handleRequest = async (listingId, qty) => {
  try {
    

    if (!navigator.geolocation) {
      return showMsg('error', 'Konum desteklenmiyor');
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = parseFloat(position.coords.latitude);
        const lng = parseFloat(position.coords.longitude);

        await api.post('/requests', {
          listing_id: listingId,
          requested_quantity: parseInt(qty),
          charity_lat: lat,
          charity_lng: lng
        });

        showMsg('success', 'Talep + konum gönderildi!');
        fetchAll();
      },
      (error) => {
        console.error(error);
        showMsg('error', 'Konum alınamadı (izin ver)');
      }
    );

  } catch (err) {
    console.log('ERROR FULL:', err.response);
  console.log('ERROR DATA:', err.response?.data);
   
    showMsg('error', err.response?.data?.message || 'Hata oluştu');
  }
};

const handleToggleCapacity = async () => {
  const newStatus = capacityStatus === 'ACCEPTING' ? 'FULL' : 'ACCEPTING';
  try {
    await api.patch('/auth/capacity', { capacity_status: newStatus });
    setCapacityStatus(newStatus);
    showMsg('success', newStatus === 'ACCEPTING' 
      ? 'Durum: Kabul Ediyor ✅' 
      : 'Durum: Dolu 🔴');
  } catch (err) {
    showMsg('error', 'Durum güncellenemedi');
  }
 };

  /* const handleRequest = async (listingId, qty) => {
    try {
      await api.post('/requests', {
        listing_id: listingId,
        requested_quantity: parseInt(qty)
      });
      showMsg('success', 'Talebiniz gönderildi!');
      fetchAll();
    } catch (err) {
      showMsg('error', err.response?.data?.message || 'Hata oluştu');
    }
  }; */

  const handleCancel = async (id) => {
    try {
      await api.patch(`/requests/${id}/cancel`);
      fetchRequests();
      showMsg('success', 'Talep iptal edildi');
    } catch (err) {
      showMsg('error', err.response?.data?.message || 'Hata oluştu');
    }
  };

  const fetchReport = async () => {
  try {
    const { data } = await api.get('/requests/charity/report');
    setReport(data);
  } catch (err) {
    console.error('Report error:', err);
  }
};

  const handleLogout = async () => { await logout(); navigate('/login'); };

  const pendingCount  = requests.filter(r => r.status === 'PENDING').length;
  const approvedCount = requests.filter(r => r.status === 'APPROVED').length;

  const navItems = NAV_ITEMS.map(n =>
    n.key === 'requests' ? { ...n, badge: pendingCount } : n
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: FONT, background: '#f0f4ff' }}>

      {/* ── SIDEBAR ── */}
      <div style={{
        width: '260px', flexShrink: 0,
        background: 'linear-gradient(180deg, #0d1b6e 0%, #1a237e 50%, #283593 100%)',
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
              <div style={{ color: '#9fa8da', fontSize: '0.62rem', fontWeight: 500, marginTop: '2px' }}>
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
                          background: 'linear-gradient(135deg, #3949ab, #5c6bc0)',
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
                            background: 'rgba(159,168,218,0.2)',
                            border: '1px solid rgba(159,168,218,0.3)',
                            color: '#9fa8da', fontSize: '0.65rem', fontWeight: 600 }}>
                🏢 Yardım Kuruluşu
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <div style={{ padding: '0 0.8rem', flex: 1 ,overflowY: 'auto' }}>
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
                borderLeft: active ? '3px solid #9fa8da' : '3px solid transparent',
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
                {/* Capacity Status */}

          {[
            { label: 'Mevcut İlan',    value: listings.length, color: '#a5d6a7' },
            { label: 'Bekleyen Talep', value: pendingCount,    color: '#ffcc80' },
            { label: 'Onaylanan',      value: approvedCount,   color: '#90caf9' },
          ].map((s, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between',
                                  padding: '5px 0', fontSize: '0.78rem',
                                  borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>{s.label}</span>
              <span style={{ fontWeight: 700, color: s.color }}>{s.value}</span>
            </div>
          ))}
        </div>
        <div style={{ margin: '0 0.8rem', marginBottom: '8px' }}>
  <button onClick={handleToggleCapacity} style={{
    width: '100%', padding: '10px 12px', borderRadius: '10px',
    border: 'none', cursor: 'pointer', fontFamily: FONT,
    fontSize: '0.82rem', fontWeight: 700,
    background: capacityStatus === 'ACCEPTING'
      ? 'rgba(76,175,80,0.2)' : 'rgba(239,83,80,0.2)',
    color: capacityStatus === 'ACCEPTING' ? '#a5d6a7' : '#ef9a9a',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    border: `1px solid ${capacityStatus === 'ACCEPTING' 
      ? 'rgba(76,175,80,0.3)' : 'rgba(239,83,80,0.3)'}`,
  }}>
    <div style={{
      width: '8px', height: '8px', borderRadius: '50%',
      background: capacityStatus === 'ACCEPTING' ? '#4caf50' : '#ef5350',
      boxShadow: `0 0 6px ${capacityStatus === 'ACCEPTING' ? '#4caf50' : '#ef5350'}`
    }} />
    {capacityStatus === 'ACCEPTING' ? 'Kabul Ediyor ✅' : 'Dolu 🔴'}
  </button>
  <p style={{ textAlign: 'center', fontSize: '0.62rem',
              color: 'rgba(255,255,255,0.3)', margin: '4px 0 0' }}>
    {capacityStatus === 'ACCEPTING' 
      ? 'Yeni ilanlardan haberdar oluyorsunuz'
      : 'Yeni ilan bildirimleri duraklatıldı'}
  </p>
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

        {/* Top bar */}
       <div style={{ background: '#fff', padding: '1rem 2rem',
              borderBottom: '1px solid #e8eaf6',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              position: 'sticky', top: 0, zIndex: 50,
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
  <div>
    <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#1a237e' }}>
      {navItems.find(n => n.key === tab)?.label || 'Dashboard'}
    </h2>
    <p style={{ margin: 0, fontSize: '0.75rem', color: '#9e9e9e', marginTop: '2px' }}>
      {new Date().toLocaleDateString('tr-TR', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      })}
    </p>
  </div>

  <button
    onClick={ fetchAll }
    style={{
      display: 'flex', alignItems: 'center', gap: '6px',
      padding: '8px 16px', borderRadius: '10px', border: 'none',
      background: '#e8eaf6', color: '#1a237e',
      fontFamily: FONT, fontWeight: 600, fontSize: '0.82rem',
      cursor: 'pointer'
    }}>
    🔄 Yenile
  </button>
</div>

        {showNotif && (
          <NotificationPanel
            onClose={() => setShowNotif(false)}
            onRead={() => setNotifCount(0)}
          />
        )}

        <div style={{ padding: '2rem' }}>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)',
                        gap: '1rem', marginBottom: '2rem' }}>
            <StatCard icon="🍽️" label="Mevcut İlan"     value={listings.length} color="#1b5e20" />
            <StatCard icon="⏳" label="Bekleyen Talep"  value={pendingCount}    color="#e65100" />
            <StatCard icon="✅" label="Onaylanan Talep" value={approvedCount}   color="#1565c0" />
            <StatCard icon="📋" label="Toplam Talep"    value={requests.length} color="#6a1b9a" />
          </div>

          <AlertMessage type={msg.type} text={msg.text} />
        

          {tab === 'browse' && (
            <BrowseTab
              listings={listings}
              onRequest={handleRequest}
              isLoading={loadingList}
            />
          )}
          {tab === 'requests' && (
            <MyRequestsTab
              requests={requests}
              onCancel={handleCancel}
              onBrowseClick={() => setTab('browse')}
            />
          )}
          {tab === 'deliveries' && (
            <DeliveriesTab
              deliveries={deliveries}
              onRate={(deliveryId, volunteerName) =>
                setRatingModal({ deliveryId, volunteerName })
              }
           onTrack={(deliveryId) => {
  setSelectedDeliveryId(deliveryId);
  const del = deliveries.find(d => d.delivery?.delivery_id === deliveryId);
  console.log('Selected delivery:', del); // ← أضف هذا
  setSelectedDelivery({
    ...del,
    delivery_id:     del?.delivery?.delivery_id,
    volunteer_name:  del?.delivery?.volunteer_name,
    volunteer_phone: del?.delivery?.volunteer_phone,
  });
  setTab('tracking');
}}
            />
          )}
          {tab === 'reports' && (
             <ReportsTab report={report} />
          )}
          {tab === 'tracking' && (

          <TrackingMap delivery={selectedDelivery} accentColor="#1a237e" accentLight="#9fa8da" />

          )}

           
        </div>
      </div>

      {ratingModal && (
        <RatingModal
          deliveryId={ratingModal.deliveryId}
          volunteerName={ratingModal.volunteerName}
          onClose={() => setRatingModal(null)}
          onSuccess={(m) => { showMsg('success', m); fetchDeliveries(); }}
          
        />
      )}
       

      
 
      
     </div>
  );
}