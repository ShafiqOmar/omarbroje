import { TruckIcon } from '@heroicons/react/24/outline';
import EmptyState from '../../components/shared/EmptyState';

const FONT = "'Plus Jakarta Sans', sans-serif";
const GRADIENT_BLUE = 'linear-gradient(135deg, #1976d2, #42a5f5)';

export default function DeliveriesTab({ deliveries, onRate, onTrack }) {
  if (deliveries.length === 0)
    return <EmptyState icon="🚚" message="Henüz aktif teslimat yok" />;

  return (
    <div style={{ display: 'grid', gap: '12px' }}>
      {deliveries.map(r => (
        <div key={r.request_id} style={{
          background: '#fff', borderRadius: '16px', padding: '1.2rem 1.4rem',
          boxShadow: '0 4px 16px rgba(0,0,0,0.07)', border: '1px solid #e3f2fd'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between',
                        alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center',
                            gap: '8px', marginBottom: '8px' }}>
                <TruckIcon style={{ width: '20px', color: '#1565c0' }} />
                <span style={{ fontWeight: 700, fontSize: '0.95rem',
                               color: '#1a237e', fontFamily: FONT }}>
                  {r.listing_title}
                </span>
                <span style={{ padding: '2px 10px', borderRadius: '20px',
                               background: '#e3f2fd', color: '#1565c0',
                               fontSize: '0.72rem', fontWeight: 600 }}>
                  Teslimat Sürecinde
                </span>

   
              </div>
              <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                {[
                  { icon: '📦', text: `${r.requested_quantity} birim` },
                  { icon: '🏪', text: r.provider_name   },
                  { icon: '🤝', text: r.volunteer_name || 'Gönüllü atandı' },
                ].map((item, i) => (
                  <span key={i} style={{ fontSize: '0.75rem', color: '#757575',
                                         display: 'flex', alignItems: 'center',
                                         gap: '4px', fontFamily: FONT }}>
                    {item.icon} {item.text}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
  {r.delivery?.delivery_id && (
    <button onClick={() => onTrack(r.delivery.delivery_id)} style={{
      display: 'flex', alignItems: 'center', gap: '6px',
      padding: '9px 16px', borderRadius: '10px', border: 'none',
      background: 'linear-gradient(135deg, #1565c0, #1e88e5)',
      color: '#fff', fontFamily: FONT, fontWeight: 600,
      fontSize: '0.82rem', cursor: 'pointer',
      boxShadow: '0 3px 10px rgba(21,101,192,0.3)'
    }}>
      📍 Takip Et
    </button>
  )}

  {r.delivery?.delivery_id && (
    <button onClick={() => onRate(r.delivery.delivery_id, r.delivery.volunteer_name || 'Gönüllü')} style={{
      display: 'flex', alignItems: 'center', gap: '6px',
      padding: '9px 16px', borderRadius: '10px', border: 'none',
      background: 'linear-gradient(135deg, #f57f17, #ffa000)',
      color: '#fff', fontFamily: FONT, fontWeight: 600,
      fontSize: '0.82rem', cursor: 'pointer',
      boxShadow: '0 3px 10px rgba(245,127,23,0.3)'
    }}>
      ⭐ Değerlendir
    </button>
  )}
</div>
          </div>
        </div>
      ))}
    </div>
  );
}