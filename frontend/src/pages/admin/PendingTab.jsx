import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import EmptyState from '../../components/shared/EmptyState';
const FONT = "'Plus Jakarta Sans', sans-serif";
const ROLE_CFG = {
  PROVIDER:  { bg: '#e8f5e9', color: '#2e7d32', label: 'Sağlayıcı' },
  CHARITY:   { bg: '#e3f2fd', color: '#1565c0', label: 'Kuruluş'   },
  VOLUNTEER: { bg: '#f3e5f5', color: '#6a1b9a', label: 'Gönüllü'   },
};

export default function PendingTab({ pending, onApprove, onDelete, loading }) {
  if (pending.length === 0)
    return <EmptyState icon="✅" message="Bekleyen onay yok" />;

  return (
    <div style={{ display: 'grid', gap: '12px' }}>
      {pending.map(u => {
        const r = ROLE_CFG[u.role_name] || ROLE_CFG.PROVIDER;
        return (
          <div key={u.user_id} style={{
            background: '#fff', borderRadius: '16px', padding: '1.2rem 1.4rem',
            boxShadow: '0 4px 16px rgba(0,0,0,0.07)', border: '1px solid #ffe082',
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', flexWrap: 'wrap', gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px',
                            background: `${r.color}20`, display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                            fontSize: '1rem', fontWeight: 800, color: r.color }}>
                {u.full_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#333', fontFamily: FONT }}>
                    {u.full_name}
                  </span>
                  <span style={{ padding: '2px 10px', borderRadius: '20px',
                                 background: r.bg, color: r.color,
                                 fontSize: '0.72rem', fontWeight: 600 }}>
                    {r.label}
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#9e9e9e', fontFamily: FONT }}>
                  {u.email} · {u.phone || '-'} · {new Date(u.created_at).toLocaleString('tr-TR')}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => onApprove(u.user_id)} disabled={loading} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 16px', borderRadius: '10px', border: 'none',
                background: 'linear-gradient(135deg, #2e7d32, #43a047)',
                color: '#fff', fontFamily: FONT, fontWeight: 600,
                fontSize: '0.8rem', cursor: 'pointer'
              }}>
                <CheckCircleIcon style={{ width: '15px' }} /> Onayla
              </button>
              <button onClick={() => onDelete(u.user_id)} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 14px', borderRadius: '10px',
                background: '#fff5f5', border: '1px solid #ffcdd2',
                color: '#c62828', fontFamily: FONT, fontWeight: 600,
                fontSize: '0.8rem', cursor: 'pointer'
              }}>
                <XCircleIcon style={{ width: '15px' }} /> Reddet
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}