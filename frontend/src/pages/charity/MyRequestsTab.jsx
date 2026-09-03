import { XCircleIcon } from '@heroicons/react/24/outline';
import StatusBadge from '../../components/shared/StatusBadge';
import EmptyState  from '../../components/shared/EmptyState';

const FONT = "'Plus Jakarta Sans', sans-serif";
const REQUEST_CFG = {
  PENDING:   { bg: '#fff8e1', color: '#f57f17', dot: '#fdd835', label: 'Beklemede'  },
  APPROVED:  { bg: '#e8f5e9', color: '#2e7d32', dot: '#43a047', label: 'Onaylandı'  },
  REJECTED:  { bg: '#ffebee', color: '#c62828', dot: '#ef5350', label: 'Reddedildi' },
  CANCELLED: { bg: '#f5f5f5', color: '#757575', dot: '#bdbdbd', label: 'İptal'      },
};

export default function MyRequestsTab({ requests, onCancel, onBrowseClick }) {
  if (requests.length === 0)
    return (
      <EmptyState icon="📋" message="Henüz talep göndermediniz"
                  actionLabel="İlanları Görüntüle" onAction={onBrowseClick} />
    );

  return (
    <div style={{ display: 'grid', gap: '12px' }}>
      {requests.map(r => {
        const s = REQUEST_CFG[r.status] || REQUEST_CFG.PENDING;
        return (
          <div key={r.request_id} style={{
            background: '#fff', borderRadius: '16px', padding: '1.2rem 1.4rem',
            boxShadow: '0 4px 16px rgba(0,0,0,0.07)',
            border: `1px solid ${r.status === 'PENDING' ? '#ffe082' : 'rgba(0,0,0,0.05)'}`,
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', flexWrap: 'wrap', gap: '12px'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center',
                            gap: '8px', marginBottom: '6px' }}>
                <span style={{ fontWeight: 700, fontSize: '0.95rem',
                               color: '#1a237e', fontFamily: FONT }}>
                  {r.listing_title}
                </span>
                <StatusBadge {...s} />
              </div>
              <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                {[
                  { icon: '📦', text: `${r.requested_quantity} birim` },
                  { icon: '🕐', text: new Date(r.created_at).toLocaleString('tr-TR') },
                ].map((item, i) => (
                  <span key={i} style={{ fontSize: '0.75rem', color: '#757575',
                                         display: 'flex', alignItems: 'center',
                                         gap: '4px', fontFamily: FONT }}>
                    {item.icon} {item.text}
                  </span>
                ))}
              </div>
            </div>
            {r.status === 'PENDING' && (
              <button onClick={() => onCancel(r.request_id)} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 14px', borderRadius: '10px',
                background: '#fff5f5', border: '1px solid #ffcdd2',
                color: '#c62828', fontFamily: FONT, fontWeight: 600,
                fontSize: '0.8rem', cursor: 'pointer'
              }}>
                <XCircleIcon style={{ width: '15px' }} />
                İptal Et
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}