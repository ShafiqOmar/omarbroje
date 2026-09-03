import { CheckCircleIcon, MapPinIcon } from '@heroicons/react/24/outline';
import StatusBadge from '../../components/shared/StatusBadge';
import EmptyState  from '../../components/shared/EmptyState';

const FONT = "'Plus Jakarta Sans', sans-serif";
const DELIVERY_CFG = {
  ASSIGNED:  { bg: '#fff8e1', color: '#f57f17', dot: '#fdd835', label: 'Atandı'        },
  PICKED_UP: { bg: '#e3f2fd', color: '#1565c0', dot: '#1e88e5', label: 'Teslim Alındı' },
};

export default function MyDeliveriesTab({ deliveries, onUpdateStatus, onShareLocation, onViewAvailable }) {
  if (deliveries.length === 0)
    return (
      <EmptyState icon="🚗" message="Aktif teslimatınız yok"
                  actionLabel="Görevlere Bak" onAction={onViewAvailable} />
    );

  return (
    <div style={{ display: 'grid', gap: '12px' }}>
      {deliveries.map(d => {
        const s = DELIVERY_CFG[d.status] || DELIVERY_CFG.ASSIGNED;
        return (
          <div key={d.delivery_id} style={{
            background: '#fff', borderRadius: '16px', padding: '1.4rem',
            boxShadow: '0 4px 16px rgba(0,0,0,0.07)',
            border: '1px solid rgba(106,27,154,0.15)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between',
                          alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px',
                          marginBottom: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center',
                              gap: '8px', marginBottom: '6px' }}>
                  <h3 style={{ margin: 0, fontSize: '0.95rem',
                               fontWeight: 700, color: '#4a148c', fontFamily: FONT }}>
                    {d.title}
                  </h3>
                  <StatusBadge {...s} />
                </div>
                <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                  {[
                    { icon: '🏪', text: d.provider_name  },
                    { icon: '📞', text: d.provider_phone },
                    { icon: '🏢', text: d.charity_name   },
                    { icon: '📦', text: `${d.requested_quantity} birim` },
                  ].map((item, i) => (
                    <span key={i} style={{ fontSize: '0.75rem', color: '#757575',
                                           display: 'flex', alignItems: 'center',
                                           gap: '4px', fontFamily: FONT }}>
                      {item.icon} {item.text}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button onClick={() => onShareLocation(d.delivery_id)} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 14px', borderRadius: '10px', border: 'none',
                background: '#e8f5e9', color: '#2e7d32',
                fontFamily: FONT, fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer'
              }}>
                <MapPinIcon style={{ width: '15px' }} />
                GPS Paylaş
              </button>

              {d.status === 'ASSIGNED' && (
                <button onClick={() => onUpdateStatus(d.delivery_id, 'PICKED_UP')} style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '8px 14px', borderRadius: '10px', border: 'none',
                  background: 'linear-gradient(135deg, #1565c0, #1e88e5)',
                  color: '#fff', fontFamily: FONT, fontWeight: 600,
                  fontSize: '0.8rem', cursor: 'pointer',
                  boxShadow: '0 3px 10px rgba(21,101,192,0.3)'
                }}>
                  <CheckCircleIcon style={{ width: '15px' }} />
                  Teslim Aldım
                </button>
              )}

              {d.status === 'PICKED_UP' && (
                <button onClick={() => onUpdateStatus(d.delivery_id, 'DELIVERED')} style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '8px 14px', borderRadius: '10px', border: 'none',
                  background: 'linear-gradient(135deg, #2e7d32, #43a047)',
                  color: '#fff', fontFamily: FONT, fontWeight: 600,
                  fontSize: '0.8rem', cursor: 'pointer',
                  boxShadow: '0 3px 10px rgba(46,125,50,0.3)'
                }}>
                  <CheckCircleIcon style={{ width: '15px' }} />
                  Teslim Ettim ✅
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}