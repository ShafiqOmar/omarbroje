import EmptyState from '../../components/shared/EmptyState';
const FONT = "'Plus Jakarta Sans', sans-serif";

export default function AlertsTab({ alerts }) {
  if (alerts.length === 0)
    return <EmptyState icon="✅" message="Bekleyen uyarı yok" />;

  return (
    <div style={{ display: 'grid', gap: '12px' }}>
      {alerts.map(a => (
        <div key={a.request_id} style={{ background: '#fff', borderRadius: '16px',
                                         padding: '1.2rem 1.4rem',
                                         boxShadow: '0 4px 16px rgba(0,0,0,0.07)',
                                         border: '1px solid #ffe082',
                                         display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px',
                        background: '#fff8e1', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>
            ⚠️
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem',
                          color: '#e65100', marginBottom: '4px', fontFamily: FONT }}>
              {a.title}
            </div>
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              {[
                { icon: '🏢', text: a.charity_name },
                { icon: '📦', text: `${a.requested_quantity} birim` },
                { icon: '🕐', text: `${new Date(a.created_at).toLocaleString('tr-TR')} tarihinden beri bekliyor` },
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
      ))}
    </div>
  );
}