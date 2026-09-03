import { useEffect, useState } from 'react';
import { XMarkIcon, BellIcon } from '@heroicons/react/24/outline';
import api from '../services/api';

export default function NotificationPanel({ onClose, onRead }) {
  const [notifications, setNotifications] = useState([]);
  const [loading,       setLoading]       = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data);
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    await api.patch('/notifications/read-all');
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    onRead();
  };

  const typeColors = {
    NEW_LISTING:  { bg: '#e8f5e9', dot: '#43a047' },
    REQUEST:      { bg: '#e3f2fd', dot: '#1e88e5' },
    APPROVED:     { bg: '#e8f5e9', dot: '#2e7d32' },
    DELIVERY:     { bg: '#fff3e0', dot: '#fb8c00' },
    RATING:       { bg: '#fce4ec', dot: '#e91e63' },
    EXPIRY_ALERT: { bg: '#fff8e1', dot: '#fdd835' },
  };

  return (
    <div className="fixed top-16 right-4 z-50 w-80 rounded-2xl shadow-2xl overflow-hidden"
         style={{ background: '#fff', border: '1px solid #e8f5e9' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3"
           style={{ background: 'linear-gradient(135deg, #1b5e20, #2e7d32)' }}>
        <div className="flex items-center gap-2">
          <BellIcon className="w-5 h-5 text-white" />
          <span className="text-white font-bold text-sm">Bildirimler</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={markAllRead}
                  className="text-xs px-2 py-1 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}>
            Tümünü Okundu İşaretle
          </button>
          <button onClick={onClose}>
            <XMarkIcon className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="overflow-y-auto" style={{ maxHeight: '400px' }}>
        {loading ? (
          <div className="p-6 text-center text-sm" style={{ color: '#9e9e9e' }}>
            Yükleniyor...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-6 text-center text-sm" style={{ color: '#9e9e9e' }}>
            Bildirim yok
          </div>
        ) : (
          notifications.map(n => {
            const colors = typeColors[n.type] || { bg: '#f5f5f5', dot: '#9e9e9e' };
            return (
              <div key={n.notification_id}
                   className="flex items-start gap-3 px-4 py-3 border-b transition-all"
                   style={{
                     background: n.is_read ? '#fff' : colors.bg,
                     borderColor: '#f0f0f0'
                   }}>
                <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                     style={{ background: n.is_read ? '#bdbdbd' : colors.dot }} />
                <div className="flex-1">
                  <p className="text-sm" style={{ color: '#333', lineHeight: '1.4' }}>
                    {n.message}
                  </p>
                  <p className="text-xs mt-1" style={{ color: '#9e9e9e' }}>
                    {new Date(n.created_at).toLocaleString('tr-TR')}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}