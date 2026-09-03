import { useState, useEffect } from 'react';
import {
  ClipboardDocumentListIcon, PlusCircleIcon,
  ClockIcon, ArrowRightOnRectangleIcon,
  BellIcon, ChartBarIcon
} from '@heroicons/react/24/outline';
import NotificationPanel from '../../components/NotificationPanel';
import StatCard          from '../../components/shared/StatCard';
import AlertMessage      from '../../components/shared/AlertMessage';
import ListingsTab       from './ListingsTab';
import CreateListingTab  from './CreateListingTab';
import RequestsTab       from './RequestsTab';
import api               from '../../services/api';
import { getSocket }     from '../../services/socket';
import { useAuth }       from '../../context/AuthContext';
import { useNavigate }   from 'react-router-dom';
import logo              from '../../assets/logo.png';

const FONT = "'Plus Jakarta Sans', sans-serif";

const NAV_ITEMS = [
  { key: 'listings', label: 'İlanlarım',      Icon: ClipboardDocumentListIcon, badge: 0 },
  { key: 'create',   label: 'Yeni İlan',      Icon: PlusCircleIcon,            badge: 0 },
  { key: 'requests', label: 'Gelen Talepler', Icon: ClockIcon,                 badge: 0 },
];

export default function ProviderDashboard() {
  const { user, logout }                  = useAuth();
  const navigate                          = useNavigate();
  const [tab,        setTab]              = useState('listings');
  const [listings,   setListings]         = useState([]);
  const [requests,   setRequests]         = useState([]);
  const [notifCount, setNotifCount]       = useState(0);
  const [showNotif,  setShowNotif]        = useState(false);
  const [msg,        setMsg]              = useState({ type: '', text: '' });

  useEffect(() => {
    fetchAll();
    const socket = getSocket();
    if (socket) socket.on('new_notification', () => setNotifCount(p => p + 1));
    return () => { if (socket) socket.off('new_notification'); };
  }, []);

  const fetchAll      = () => { fetchListings(); fetchRequests(); fetchUnread(); };
  const fetchListings = async () => { const { data } = await api.get('/food/my');           setListings(data); };
  const fetchRequests = async () => { const { data } = await api.get('/requests/provider'); setRequests(data); };
  const fetchUnread   = async () => { const { data } = await api.get('/notifications/unread-count'); setNotifCount(data.unread_count); };

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: '', text: '' }), 3500);
  };

  const handleDelete  = async (id) => {
    if (!confirm('Bu ilanı silmek istediğinizden emin misiniz?')) return;
    await api.delete(`/food/${id}`); fetchListings(); showMsg('success', 'İlan silindi');
  };
  const handleApprove = async (id) => {
    await api.patch(`/requests/${id}/approve`); fetchRequests(); fetchListings();
    showMsg('success', 'Talep onaylandı!');
  };
  const handleReject  = async (id) => {
    await api.patch(`/requests/${id}/reject`); fetchRequests();
    showMsg('success', 'Talep reddedildi');
  };
  const handleLogout  = async () => { await logout(); navigate('/login'); };

  const pendingCount = requests.filter(r => r.status === 'PENDING').length;
  const activeCount  = listings.filter(l => ['AVAILABLE','PARTIAL'].includes(l.status)).length;
  const totalDonated = listings.reduce((s, l) => s + (l.total_quantity - l.remaining_quantity), 0);

  const navItems = NAV_ITEMS.map(n =>
    n.key === 'requests' ? { ...n, badge: pendingCount } : n
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: FONT, background: '#f0f7f1' }}>

      {/* ════════════════════════════
          SIDEBAR
      ════════════════════════════ */}
      <div style={{
        width: '260px', flexShrink: 0,
        background: 'linear-gradient(180deg, #0a3d1f 0%, #1b5e20 50%, #2e7d32 100%)',
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: 0,
        height: '100vh', zIndex: 100,
        boxShadow: '4px 0 24px rgba(0,0,0,0.2)'
      }}>

        {/* Logo */}
        <div style={{
          padding: '1.5rem 1.2rem 1rem',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '12px',
              background: 'rgba(255,255,255,0.95)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)', overflow: 'hidden', flexShrink: 0
            }}>
              <img src={logo} alt="logo"
                   style={{ width: '34px', height: '34px', objectFit: 'contain' }} />
            </div>
            <div>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: '1rem',
                            letterSpacing: '-0.02em', lineHeight: 1 }}>
                SmartFoodAid
              </div>
              <div style={{ color: '#81c784', fontSize: '0.62rem',
                            fontWeight: 500, marginTop: '2px' }}>
                Gıda İsrafını Önle
              </div>
            </div>
          </div>
        </div>

        {/* User Card */}
        <div style={{ padding: '1rem 1.2rem' }}>
          <div style={{
            padding: '0.9rem', borderRadius: '12px',
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', gap: '10px'
          }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #43a047, #66bb6a)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.1rem', fontWeight: 800, color: '#fff', flexShrink: 0
            }}>
              {user?.fullName?.charAt(0).toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.85rem',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.fullName}
              </div>
              <div style={{
                display: 'inline-block', marginTop: '3px',
                padding: '1px 8px', borderRadius: '10px',
                background: 'rgba(165,214,167,0.2)',
                border: '1px solid rgba(165,214,167,0.3)',
                color: '#a5d6a7', fontSize: '0.65rem', fontWeight: 600
              }}>
                🍽️ Gıda Sağlayıcı
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div style={{ padding: '0 0.8rem', flex: 1 }}>
          <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.4)',
                        fontWeight: 700, letterSpacing: '0.1em',
                        textTransform: 'uppercase', padding: '0 0.4rem',
                        marginBottom: '6px' }}>
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
                borderLeft: active ? '3px solid #a5d6a7' : '3px solid transparent',
              }}>
                <Icon style={{ width: '18px', height: '18px', flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{label}</span>
                {badge > 0 && (
                  <span style={{
                    background: '#ef5350', color: '#fff',
                    borderRadius: '10px', padding: '1px 7px',
                    fontSize: '0.68rem', fontWeight: 700
                  }}>
                    {badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Notifications button */}
          <div style={{ marginTop: '8px', marginBottom: '4px',
                        fontSize: '0.62rem', color: 'rgba(255,255,255,0.4)',
                        fontWeight: 700, letterSpacing: '0.1em',
                        textTransform: 'uppercase', padding: '0 0.4rem' }}>
            Bildirimler
          </div>
          <button onClick={() => setShowNotif(!showNotif)} style={{
            width: '100%', display: 'flex', alignItems: 'center',
            gap: '10px', padding: '10px 12px', borderRadius: '10px',
            border: 'none', cursor: 'pointer', marginBottom: '4px',
            fontFamily: FONT, fontSize: '0.85rem', fontWeight: 600,
            background: showNotif ? 'rgba(255,255,255,0.15)' : 'transparent',
            color: 'rgba(255,255,255,0.65)',
            borderLeft: '3px solid transparent',
          }}>
            <BellIcon style={{ width: '18px', height: '18px', flexShrink: 0 }} />
            <span style={{ flex: 1 }}>Bildirimler</span>
            {notifCount > 0 && (
              <span style={{
                background: '#ef5350', color: '#fff',
                borderRadius: '10px', padding: '1px 7px',
                fontSize: '0.68rem', fontWeight: 700
              }}>
                {notifCount}
              </span>
            )}
          </button>
        </div>

        {/* Quick Stats */}
        <div style={{
          margin: '0 0.8rem',
          padding: '0.8rem', borderRadius: '12px',
          background: 'rgba(255,255,255,0.07)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.4)',
                        fontWeight: 700, letterSpacing: '0.1em',
                        textTransform: 'uppercase', marginBottom: '8px' }}>
            Özet
          </div>
          {[
            { label: 'Toplam İlan',   value: listings.length, color: '#a5d6a7' },
            { label: 'Aktif',         value: activeCount,     color: '#81c784' },
            { label: 'Bağış (birim)', value: totalDonated,    color: '#64b5f6' },
          ].map((s, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '5px 0', fontSize: '0.78rem',
              borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none'
            }}>
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
            transition: 'all 0.2s'
          }}>
            <ArrowRightOnRectangleIcon style={{ width: '18px' }} />
            Çıkış Yap
          </button>
        </div>
      </div>

      {/* ════════════════════════════
          MAIN CONTENT
      ════════════════════════════ */}
      <div style={{ marginLeft: '260px', flex: 1, minWidth: 0 }}>

        {/* Top bar */}
        <div style={{
          background: '#fff', padding: '1rem 2rem',
          borderBottom: '1px solid #e8f5e9',
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 50,
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#1b5e20' }}>
              {navItems.find(n => n.key === tab)?.label || 'Dashboard'}
            </h2>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#9e9e9e', marginTop: '2px' }}>
              {new Date().toLocaleDateString('tr-TR', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {pendingCount > 0 && (
              <div style={{
                padding: '6px 12px', borderRadius: '20px',
                background: '#fff8e1', border: '1px solid #ffe082',
                fontSize: '0.78rem', color: '#f57f17', fontWeight: 600
              }}>
                ⚠️ {pendingCount} bekleyen talep
              </div>
            )}
          </div>
        </div>

        {/* Notification Panel */}
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
            <StatCard icon="📋" label="Toplam İlan"      value={listings.length} color="#1b5e20" />
            <StatCard icon="✅" label="Aktif İlan"        value={activeCount}     color="#2e7d32" />
            <StatCard icon="⏳" label="Bekleyen Talep"   value={pendingCount}    color="#e65100" />
            <StatCard icon="🎁" label="Bağışlanan Birim" value={totalDonated}    color="#1565c0" />
          </div>

          <AlertMessage type={msg.type} text={msg.text} />

          {tab === 'listings' && (
            <ListingsTab
              listings={listings}
              onDelete={handleDelete}
              onCreateClick={() => setTab('create')}
            />
          )}
          {tab === 'create' && (
            <CreateListingTab
              onSuccess={(m) => { showMsg('success', m); fetchListings(); setTab('listings'); }}
            />
          )}
          {tab === 'requests' && (
            <RequestsTab
              requests={requests}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          )}
        </div>
      </div>
    </div>
  );
}