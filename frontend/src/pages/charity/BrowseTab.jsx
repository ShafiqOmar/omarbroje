import { useState } from 'react';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';
import StatusBadge from '../../components/shared/StatusBadge';
import EmptyState  from '../../components/shared/EmptyState';

const FONT = "'Plus Jakarta Sans', sans-serif";

const STATUS_CFG = {
  AVAILABLE: { bg: '#e8f5e9', color: '#2e7d32', dot: '#43a047', label: 'Mevcut' },
  PARTIAL:   { bg: '#fff3e0', color: '#e65100', dot: '#fb8c00', label: 'Kısmi'  },
};

export default function BrowseTab({ listings, onRequest, isLoading }) {
  const [qtyMap,     setQtyMap]     = useState({});
  const [requesting, setRequesting] = useState(null);

  const handleRequest = async (listingId) => {
    const qty = qtyMap[listingId];
    if (!qty || qty <= 0) return;
    setRequesting(listingId);
    await onRequest(listingId, qty);
    setQtyMap(prev => ({ ...prev, [listingId]: '' }));
    setRequesting(null);
  };

  if (isLoading) return (
    <div style={{ background: '#fff', borderRadius: '20px', padding: '4rem 2rem',
                  textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
      <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>⏳</div>
      <p style={{ color: '#9e9e9e', fontWeight: 500, fontFamily: FONT }}>
        İlanlar yükleniyor...
      </p>
    </div>
  );

  if (listings.length === 0)
    return <EmptyState icon="🍽️" message="Şu an mevcut gıda ilanı yok" />;

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
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between',
                          alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <div style={{ display: 'flex', alignItems: 'center',
                              gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                  <h3 style={{ margin: 0, fontSize: '0.95rem',
                               fontWeight: 700, color: '#1a237e', fontFamily: FONT }}>
                    {l.title}
                  </h3>
                  <StatusBadge {...s} />
                </div>
                {l.description && (
                  <p style={{ margin: '0 0 8px', fontSize: '0.8rem',
                              color: '#757575', fontFamily: FONT }}>
                    {l.description}
                  </p>
                )}
                <div style={{ height: '5px', borderRadius: '3px',
                              background: '#f0f0f0', overflow: 'hidden', marginBottom: '8px' }}>
                  <div style={{ height: '100%', borderRadius: '3px', width: `${pct}%`,
                                background: pct > 50 ? '#43a047' : pct > 20 ? '#fb8c00' : '#ef5350' }} />
                </div>
                <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                  {[
                    { icon: '🏪', text: l.provider_name },
                    { icon: '📦', text: `${l.remaining_quantity} birim kaldı` },
                    { icon: '⏰', text: new Date(l.expiry_date).toLocaleDateString('tr-TR') },
                  ].map((item, i) => (
                    <span key={i} style={{ fontSize: '0.75rem', color: '#757575',
                                           display: 'flex', alignItems: 'center',
                                           gap: '4px', fontFamily: FONT }}>
                      {item.icon} {item.text}
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="number" min="1" max={l.remaining_quantity}
                  value={qtyMap[l.listing_id] || ''}
                  onChange={e => setQtyMap(prev => ({ ...prev, [l.listing_id]: e.target.value }))}
                  placeholder="Miktar"
                  style={{ width: '90px', padding: '9px 12px', borderRadius: '10px',
                           border: '1.5px solid #e0e0e0', fontSize: '0.85rem',
                           fontFamily: FONT, outline: 'none', textAlign: 'center' }}
                  onFocus={e => e.target.style.border = '1.5px solid #3949ab'}
                  onBlur={e  => e.target.style.border = '1.5px solid #e0e0e0'}
                />
                <button
                  onClick={() => handleRequest(l.listing_id)}
                  disabled={requesting === l.listing_id}
                  style={{
                    padding: '9px 18px', borderRadius: '10px', border: 'none',
                    background: requesting === l.listing_id
                      ? '#c5cae9' : 'linear-gradient(135deg, #1a237e, #3949ab)',
                    color: '#fff', fontFamily: FONT, fontWeight: 600,
                    fontSize: '0.82rem',
                    cursor: requesting === l.listing_id ? 'not-allowed' : 'pointer',
                    boxShadow: '0 3px 10px rgba(57,73,171,0.3)',
                    display: 'flex', alignItems: 'center', gap: '6px',
                  }}>
                  <ShoppingCartIcon style={{ width: '15px' }} />
                  {requesting === l.listing_id ? '...' : 'Talep Et'}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}