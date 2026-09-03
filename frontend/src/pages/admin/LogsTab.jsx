const FONT = "'Plus Jakarta Sans', sans-serif";
const LOG_COLORS = { REGISTER: '#43a047', LOGIN: '#1e88e5', CREATE: '#8e24aa', APPROVE: '#2e7d32', DELETE: '#ef5350', SUSPEND: '#f57f17' };

export default function LogsTab({ logs }) {
  return (
    <div style={{ background: '#fff', borderRadius: '16px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
      <div style={{ padding: '1rem 1.4rem', borderBottom: '1px solid #f0f0f0' }}>
        <span style={{ fontWeight: 700, color: '#333', fontSize: '0.9rem', fontFamily: FONT }}>
          Son 100 İşlem Kaydı
        </span>
      </div>
      <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
        {logs.map(log => (
          <div key={log.log_id} style={{ padding: '0.85rem 1.4rem', borderBottom: '1px solid #f9f9f9',
                                         display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                          background: LOG_COLORS[log.action] || '#9e9e9e' }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 600, fontSize: '0.82rem', fontFamily: FONT,
                               color: LOG_COLORS[log.action] || '#555' }}>{log.action}</span>
                <span style={{ fontSize: '0.75rem', color: '#9e9e9e', fontFamily: FONT }}>
                  {log.entity_type} #{log.entity_id}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#bdbdbd', fontFamily: FONT }}>
                  by {log.actor_name || 'System'}
                </span>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#9e9e9e', fontFamily: FONT,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {log.description}
              </div>
            </div>
            <div style={{ fontSize: '0.7rem', color: '#bdbdbd', flexShrink: 0, fontFamily: FONT }}>
              {new Date(log.created_at).toLocaleString('tr-TR')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}