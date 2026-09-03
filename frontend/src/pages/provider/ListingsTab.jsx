import { TrashIcon } from '@heroicons/react/24/outline';
import StatusBadge from '../../components/shared/StatusBadge';
import EmptyState  from '../../components/shared/EmptyState';

const FONT = "'Plus Jakarta Sans', sans-serif";

const STATUS_CFG = {
  AVAILABLE: { bg: '#e8f5e9', color: '#2e7d32', dot: '#43a047', label: 'Mevcut'       },
  PARTIAL:   { bg: '#fff3e0', color: '#e65100', dot: '#fb8c00', label: 'Kısmi'        },
  COMPLETED: { bg: '#e3f2fd', color: '#1565c0', dot: '#1e88e5', label: 'Tamamlandı'  },
  EXPIRED:   { bg: '#ffebee', color: '#c62828', dot: '#ef5350', label: 'Süresi Doldu' },
};

export default function ListingsTab({ listings, onDelete, onCreateClick }) {
  if (listings.length === 0)
    return (
      <EmptyState
        icon="📭"
        message="Henüz ilan oluşturmadınız"
        actionLabel="+ İlk İlanı Oluştur"
        onAction={onCreateClick}
      />
    );

  return (
    <div style={{ display: 'grid', gap: '12px' }}>
      {listings.map(l => {
        const s   = STATUS_CFG[l.status] || STATUS_CFG.AVAILABLE;
        const pct = Math.round((l.remaining_quantity / l.total_quantity) * 100);
        return (
          <div key={l.listing_id} style={{
            background: '#fff', borderRadius: '16px', padding: '1.2rem 1.4rem',
            boxShadow: '0 4px 16px rgba(0,0,0,0.07)',
            border: '1px solid rgba(0,0,0,0.05)',
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', gap: '16px'
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center',
                            gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                <h3 style={{ margin: 0, fontSize: '0.95rem',
                             fontWeight: 700, color: '#1b5e20', fontFamily: FONT }}>
                  {l.title}
                </h3>
                <StatusBadge {...s} />
              </div>

              {/* Progress */}
              <div style={{ height: '6px', borderRadius: '3px',
                            background: '#f0f0f0', overflow: 'hidden', marginBottom: '6px' }}>
                <div style={{
                  height: '100%', borderRadius: '3px', width: `${pct}%`,
                  background: pct > 50 ? '#43a047' : pct > 20 ? '#fb8c00' : '#ef5350'
                }} />
              </div>

              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                {[
                  { icon: '📦', text: `${l.remaining_quantity}/${l.total_quantity} birim` },
                  { icon: '⏰', text: new Date(l.expiry_date).toLocaleDateString('tr-TR') },
                  { icon: '📍', text: `${parseFloat(l.lat).toFixed(3)}, ${parseFloat(l.lng).toFixed(3)}` },
                ].map((item, i) => (
                  <span key={i} style={{ fontSize: '0.75rem', color: '#757575',
                                         display: 'flex', alignItems: 'center', gap: '4px',
                                         fontFamily: FONT }}>
                    {item.icon} {item.text}
                  </span>
                ))}
              </div>
            </div>

            <button onClick={() => onDelete(l.listing_id)} style={{
              width: '38px', height: '38px', borderRadius: '10px',
              background: '#fff5f5', border: '1px solid #ffcdd2',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', flexShrink: 0
            }}>
              <TrashIcon style={{ width: '16px', color: '#ef5350' }} />
            </button>
          </div>
        );
      })}
    </div>
  );
}