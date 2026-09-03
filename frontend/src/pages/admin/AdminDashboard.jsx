import { useState, useEffect } from 'react';
import {
  ChartBarIcon, StarIcon, ExclamationTriangleIcon,
  UsersIcon, ClipboardDocumentListIcon,
  BellIcon, ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import NotificationPanel from '../../components/NotificationPanel';
import StatCard          from '../../components/shared/StatCard';
import AlertMessage      from '../../components/shared/AlertMessage';
import StatsTab          from './StatsTab';
import ReportsTab        from './ReportsTab';
import PendingTab        from './PendingTab';
import UsersTab          from './UsersTab';
import LogsTab           from './LogsTab';
import AlertsTab         from './AlertsTab';
import api               from '../../services/api';
import { useAuth }       from '../../context/AuthContext';
import { useNavigate }   from 'react-router-dom';
import logo              from '../../assets/logo.png';
import LiveTrackingTab from './LiveTrackingTab';
import { MapPinIcon } from '@heroicons/react/24/outline';

const FONT = "'Plus Jakarta Sans', sans-serif";

const NAV_ITEMS = [
  { key: 'stats',   label: 'İstatistikler',    Icon: ChartBarIcon              },
  { key: 'reports', label: 'Etki Raporu',      Icon: StarIcon                  },
  { key: 'pending', label: 'Bekleyen Onaylar', Icon: ExclamationTriangleIcon   },
  { key: 'users',   label: 'Kullanıcılar',     Icon: UsersIcon                 },
  { key: 'logs',    label: 'İşlem Kayıtları',  Icon: ClipboardDocumentListIcon },
  { key: 'alerts',  label: 'Uyarılar',         Icon: ExclamationTriangleIcon   },
  { key: 'tracking', label: 'Canlı Takip', Icon: MapPinIcon },
];

export default function AdminDashboard() {
  const { user, logout }            = useAuth();
  const navigate                    = useNavigate();
  const [tab,        setTab]        = useState('stats');
  const [stats,      setStats]      = useState(null);
  const [report,     setReport]     = useState(null);
  const [pending,    setPending]    = useState([]);
  const [users,      setUsers]      = useState([]);
  const [logs,       setLogs]       = useState([]);
  const [alerts,     setAlerts]     = useState([]);
  const [notifCount, setNotifCount] = useState(0);
  const [showNotif,  setShowNotif]  = useState(false);
  const [msg,        setMsg]        = useState({ type: '', text: '' });
  const [loading,    setLoading]    = useState(false);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll     = () => { fetchStats(); fetchReport(); fetchPending(); fetchUsers(); fetchLogs(); fetchAlerts(); fetchUnread(); };
  const fetchStats   = async () => { try { const { data } = await api.get('/admin/statistics');    setStats(data);   } catch (err) { console.error('fetchStats failed:', err); } };
  const fetchReport  = async () => { try { const { data } = await api.get('/admin/impact-report'); setReport(data);  } catch (err) { console.error('fetchReport failed:', err); } };
  const fetchPending = async () => { try { const { data } = await api.get('/admin/users/pending'); setPending(data); } catch (err) { console.error('fetchPending failed:', err); } };
  const fetchUsers   = async () => { try { const { data } = await api.get('/admin/users');         setUsers(data);   } catch (err) { console.error('fetchUsers failed:', err); } };
  const fetchLogs    = async () => { try { const { data } = await api.get('/admin/logs');          setLogs(data);    } catch (err) { console.error('fetchLogs failed:', err); } };
  const fetchAlerts  = async () => { try { const { data } = await api.get('/admin/alerts/pending');setAlerts(data);  } catch (err) { console.error('fetchAlerts failed:', err); } };
  const fetchUnread  = async () => { try { const { data } = await api.get('/notifications/unread-count'); setNotifCount(data.unread_count); } catch (err) { console.error('fetchUnread failed:', err); } };

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: '', text: '' }), 3500);
  };

  const handleApprove = async (id) => {
    setLoading(true);
    try {
      await api.patch(`/admin/users/${id}/approve`);
      showMsg('success', 'Kullanıcı onaylandı!');
      fetchPending(); fetchUsers(); fetchStats();
    } catch (err) { showMsg('error', err.response?.data?.message || 'Hata'); }
    finally { setLoading(false); }
  };
  const handleSuspend = async (id) => {
    if (!confirm('Askıya almak istiyor musunuz?')) return;
    await api.patch(`/admin/users/${id}/suspend`);
    showMsg('success', 'Kullanıcı askıya alındı');
    fetchUsers(); fetchStats();
  };
  const handleDelete = async (id) => {
    if (!confirm('Silmek istediğinizden emin misiniz?')) return;
    await api.delete(`/admin/users/${id}`);
    showMsg('success', 'Kullanıcı silindi');
    fetchUsers(); fetchStats();
  };
  const handleLogout = async () => { await logout(); navigate('/login'); };

  const navItems = NAV_ITEMS.map(n => {
    if (n.key === 'pending') return { ...n, badge: pending.length };
    if (n.key === 'alerts')  return { ...n, badge: alerts.length  };
    return n;
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: FONT, background: '#fafafa' }}>

      {/* ── SIDEBAR ── */}
      <div style={{
        width: '260px', flexShrink: 0,
        background: 'linear-gradient(180deg, #6a0000 0%, #b71c1c 50%, #d32f2f 100%)',
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
                          overflow: 'hidden', flexShrink: 0 }}>
              <img src={logo} alt="logo" style={{ width: '34px', height: '34px', objectFit: 'contain' }} />
            </div>
            <div>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: '1rem', lineHeight: 1 }}>
                SmartFoodAid
              </div>
              <div style={{ color: '#ef9a9a', fontSize: '0.62rem', fontWeight: 500, marginTop: '2px' }}>
                Yönetim Paneli
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
                          background: 'linear-gradient(135deg, #c62828, #e53935)',
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
                            background: 'rgba(239,154,154,0.2)',
                            border: '1px solid rgba(239,154,154,0.3)',
                            color: '#ef9a9a', fontSize: '0.65rem', fontWeight: 600 }}>
                👨‍💼 Sistem Yöneticisi
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <div style={{ padding: '0 0.8rem', flex: 1, overflowY: 'auto' }}>
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
                borderLeft: active ? '3px solid #ef9a9a' : '3px solid transparent',
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
            Sistem
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
        {stats && (
          <div style={{ margin: '0 0.8rem', padding: '0.8rem', borderRadius: '12px',
                        background: 'rgba(255,255,255,0.07)',
                        border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.4)',
                          fontWeight: 700, letterSpacing: '0.1em',
                          textTransform: 'uppercase', marginBottom: '8px' }}>
              Özet
            </div>
            {[
              { label: 'Aktif Kullanıcı', value: stats.users.active,           color: '#ef9a9a' },
              { label: 'Bekleyen Onay',   value: stats.users.pending,          color: '#ffcc80' },
              { label: 'Teslim Edildi',   value: stats.deliveries?.delivered,  color: '#a5d6a7' },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between',
                                    padding: '5px 0', fontSize: '0.78rem',
                                    borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>{s.label}</span>
                <span style={{ fontWeight: 700, color: s.color }}>{s.value || 0}</span>
              </div>
            ))}
          </div>
        )}

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

      {/* ── MAIN ── */}
      <div style={{ marginLeft: '260px', flex: 1, minWidth: 0 }}>
        <div style={{ background: '#fff', padding: '1rem 2rem',
                      borderBottom: '1px solid #ffebee',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      position: 'sticky', top: 0, zIndex: 50,
                      boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#b71c1c' }}>
              {navItems.find(n => n.key === tab)?.label}
            </h2>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#9e9e9e', marginTop: '2px' }}>
              {new Date().toLocaleDateString('tr-TR', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
            </p>
          </div>
          {pending.length > 0 && (
            <div style={{ padding: '6px 12px', borderRadius: '20px',
                          background: '#fff8e1', border: '1px solid #ffe082',
                          fontSize: '0.78rem', color: '#f57f17', fontWeight: 600 }}>
              ⚠️ {pending.length} bekleyen onay
            </div>
          )}
        </div>

        {showNotif && (
          <NotificationPanel onClose={() => setShowNotif(false)} onRead={() => setNotifCount(0)} />
        )}

        <div style={{ padding: '2rem' }}>
          {stats && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)',
                          gap: '1rem', marginBottom: '2rem' }}>
              <StatCard icon="👥" label="Toplam Kullanıcı"   value={stats.users.total}           color="#b71c1c" />
              <StatCard icon="⏳" label="Bekleyen Onay"      value={stats.users.pending}         color="#e65100" />
              <StatCard icon="📋" label="Toplam İlan"        value={stats.listings.total}        color="#1565c0" />
              <StatCard icon="✅" label="Teslim Edildi"      value={stats.deliveries?.delivered} color="#2e7d32" />
            </div>
          )}

          <AlertMessage type={msg.type} text={msg.text} />

          {tab === 'stats'   && <StatsTab   stats={stats} />}
          {tab === 'reports' && <ReportsTab report={report} />}
          {tab === 'pending' && <PendingTab pending={pending} onApprove={handleApprove} onDelete={handleDelete} loading={loading} />}
          {tab === 'users'   && <UsersTab   users={users}   onApprove={handleApprove} onSuspend={handleSuspend} onDelete={handleDelete} />}
          {tab === 'logs'    && <LogsTab    logs={logs} />}
          {tab === 'alerts'  && <AlertsTab  alerts={alerts} />}
          {tab === 'tracking' && <LiveTrackingTab />}
        </div>
      </div>
    </div>
  );
}