import { TruckIcon } from '@heroicons/react/24/outline';
import EmptyState from '../../components/shared/EmptyState';

const FONT = "'Plus Jakarta Sans', sans-serif";

export default function AvailableTab({ available, onAccept }) {
  if (available.length === 0)
    return <EmptyState icon="📭" message="Şu an mevcut teslimat görevi yok" />;

  return (
    <div style={{ display: 'grid', gap: '12px' }}>
      {available.map(d => (
        <div key={d.request_id} style={{
          background: '#fff', borderRadius: '16px', padding: '1.2rem 1.4rem',
          boxShadow: '0 4px 16px rgba(0,0,0,0.07)',
          border: '1px solid rgba(106,27,154,0.1)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between',
                        alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <h3 style={{ margin: '0 0 8px', fontSize: '0.95rem',
                           fontWeight: 700, color: '#4a148c', fontFamily: FONT }}>
                {d.title}
              </h3>
              {d.description && (
                <p style={{ margin: '0 0 8px', fontSize: '0.8rem',
                            color: '#757575', fontFamily: FONT }}>
                  {d.description}
                </p>
              )}
              <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                {[
                  { icon: '🏪', text: d.provider_name   },
                  { icon: '📞', text: d.provider_phone  },
                  { icon: '🏢', text: d.charity_name    },
                  { icon: '📦', text: `${d.requested_quantity} birim` },
                  { icon: '📍', text: `${parseFloat(d.pickup_lat).toFixed(3)}, ${parseFloat(d.pickup_lng).toFixed(3)}` },
                ].map((item, i) => (
                  <span key={i} style={{ fontSize: '0.75rem', color: '#757575',
                                         display: 'flex', alignItems: 'center',
                                         gap: '4px', fontFamily: FONT }}>
                    {item.icon} {item.text}
                  </span>
                ))}
              </div>
            </div>
            <button onClick={() => onAccept(d.request_id)} style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 20px', borderRadius: '12px', border: 'none',
              background: 'linear-gradient(135deg, #4a148c, #7b1fa2)',
              color: '#fff', fontFamily: FONT, fontWeight: 600,
              fontSize: '0.85rem', cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(106,27,154,0.35)'
            }}>
              <TruckIcon style={{ width: '16px' }} />
              Görevi Kabul Et
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}