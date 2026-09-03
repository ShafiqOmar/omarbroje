import { useState } from 'react';
import { MagnifyingGlassIcon, CheckCircleIcon, XCircleIcon, NoSymbolIcon } from '@heroicons/react/24/outline';
const FONT = "'Plus Jakarta Sans', sans-serif";
const ROLE_CFG   = { PROVIDER: { bg: '#e8f5e9', color: '#2e7d32', label: 'Sağlayıcı' }, CHARITY: { bg: '#e3f2fd', color: '#1565c0', label: 'Kuruluş' }, VOLUNTEER: { bg: '#f3e5f5', color: '#6a1b9a', label: 'Gönüllü' }, ADMIN: { bg: '#fff3e0', color: '#e65100', label: 'Yönetici' } };
const STATUS_CFG = { ACTIVE: { bg: '#e8f5e9', color: '#2e7d32', label: 'Aktif' }, PENDING: { bg: '#fff8e1', color: '#f57f17', label: 'Beklemede' }, SUSPENDED: { bg: '#ffebee', color: '#c62828', label: 'Askıya Alındı' } };

export default function UsersTab({ users, onApprove, onSuspend, onDelete }) {
  const [search, setSearch] = useState('');
  const filtered = users.filter(u =>
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ position: 'relative', marginBottom: '1rem' }}>
        <MagnifyingGlassIcon style={{ position: 'absolute', left: '12px', top: '50%',
                                      transform: 'translateY(-50%)', width: '18px', color: '#9e9e9e' }} />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="İsim veya e-posta ile ara..."
          style={{ width: '100%', padding: '11px 14px 11px 38px', borderRadius: '12px',
                   border: '1.5px solid #e0e0e0', fontSize: '0.875rem',
                   fontFamily: FONT, outline: 'none', background: '#fff', boxSizing: 'border-box' }} />
      </div>
      <div style={{ display: 'grid', gap: '10px' }}>
        {filtered.map(u => {
          const r = ROLE_CFG[u.role_name] || ROLE_CFG.PROVIDER;
          const s = STATUS_CFG[u.status]  || STATUS_CFG.PENDING;
          return (
            <div key={u.user_id} style={{ background: '#fff', borderRadius: '14px', padding: '1rem 1.2rem',
                                          boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
                                          display: 'flex', justifyContent: 'space-between',
                                          alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px',
                              background: `${r.color}20`, display: 'flex', alignItems: 'center',
                              justifyContent: 'center', fontSize: '1rem', fontWeight: 700,
                              color: r.color, flexShrink: 0 }}>
                  {u.full_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#333', fontFamily: FONT }}>
                      {u.full_name}
                    </span>
                    {[r, s].map((badge, i) => (
                      <span key={i} style={{ padding: '1px 8px', borderRadius: '20px',
                                            background: badge.bg, color: badge.color,
                                            fontSize: '0.68rem', fontWeight: 600 }}>
                        {badge.label}
                      </span>
                    ))}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#9e9e9e', fontFamily: FONT }}>
                    {u.email} · {u.phone || '-'}
                    {u.average_rating > 0 && ` · ⭐ ${parseFloat(u.average_rating).toFixed(1)}`}
                  </div>
                </div>
              </div>
              {u.role_name !== 'ADMIN' && (
                <div style={{ display: 'flex', gap: '6px' }}>
                  {u.status === 'PENDING' && (
                    <button onClick={() => onApprove(u.user_id)} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px', borderRadius: '8px', background: '#e8f5e9', border: '1px solid #c8e6c9', color: '#2e7d32', fontFamily: FONT, fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer' }}>
                      <CheckCircleIcon style={{ width: '13px' }} /> Onayla
                    </button>
                  )}
                  {u.status !== 'SUSPENDED' && (
                    <button onClick={() => onSuspend(u.user_id)} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px', borderRadius: '8px', background: '#fff8e1', border: '1px solid #ffe082', color: '#f57f17', fontFamily: FONT, fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer' }}>
                      <NoSymbolIcon style={{ width: '13px' }} /> Askıya Al
                    </button>
                  )}
                  <button onClick={() => onDelete(u.user_id)} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px', borderRadius: '8px', background: '#fff5f5', border: '1px solid #ffcdd2', color: '#c62828', fontFamily: FONT, fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer' }}>
                    <XCircleIcon style={{ width: '13px' }} /> Sil
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}