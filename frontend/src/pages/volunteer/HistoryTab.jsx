import EmptyState from '../../components/shared/EmptyState';
const FONT = "'Plus Jakarta Sans', sans-serif";

export default function HistoryTab({ deliveries }) {
  if (deliveries.length === 0)
    return <EmptyState icon="🏆" message="Henüz tamamlanan teslimat yok" />;

  return (
    <div style={{ display: 'grid', gap: '12px' }}>
      {deliveries.map(d => (
        <div key={d.delivery_id} style={{
          background: '#fff', borderRadius: '16px', padding: '1.2rem 1.4rem',
          boxShadow: '0 4px 16px rgba(0,0,0,0.07)', border: '1px solid #e8f5e9',
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', flexWrap: 'wrap', gap: '12px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center',
                          gap: '8px', marginBottom: '6px' }}>
              <h3 style={{ margin: 0, fontSize: '0.95rem',
                           fontWeight: 700, color: '#2e7d32', fontFamily: FONT }}>
                {d.title}
              </h3>
              <span style={{ padding: '2px 10px', borderRadius: '20px',
                             background: '#e8f5e9', color: '#2e7d32',
                             fontSize: '0.72rem', fontWeight: 600 }}>
                ✅ Tamamlandı
              </span>
            </div>
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              {[
                { icon: '🏢', text: d.charity_name },
                { icon: '📦', text: `${d.requested_quantity} birim` },
                { icon: '🕐', text: d.delivery_time
                    ? new Date(d.delivery_time).toLocaleString('tr-TR') : '-' },
              ].map((item, i) => (
                <span key={i} style={{ fontSize: '0.75rem', color: '#757575',
                                       display: 'flex', alignItems: 'center',
                                       gap: '4px', fontFamily: FONT }}>
                  {item.icon} {item.text}
                </span>
              ))}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.8rem' }}>⭐</div>
            <div style={{ fontSize: '0.68rem', color: '#9e9e9e', fontWeight: 500 }}>
              Tamamlandı
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}