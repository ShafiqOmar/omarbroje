const FONT = "'Plus Jakarta Sans', sans-serif";

export default function StatsTab({ stats }) {
  if (!stats) return <p style={{ color: '#9e9e9e', fontFamily: FONT }}>Yükleniyor...</p>;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
      {[
        { title: '👥 Kullanıcılar', color: '#b71c1c',
          items: [{ label: 'Aktif', value: stats.users.active }, { label: 'Beklemede', value: stats.users.pending }, { label: 'Askıya Alındı', value: stats.users.suspended }] },
        { title: '📋 Gıda İlanları', color: '#1565c0',
          items: [{ label: 'Mevcut', value: stats.listings.available }, { label: 'Kısmi', value: stats.listings.partial }, { label: 'Tamamlandı', value: stats.listings.completed }, { label: 'Bağışlanan', value: `${stats.listings.donated_quantity || 0} birim` }] },
        { title: '📬 Talepler', color: '#2e7d32',
          items: [{ label: 'Beklemede', value: stats.requests.pending }, { label: 'Onaylandı', value: stats.requests.approved }, { label: 'Reddedildi', value: stats.requests.rejected }] },
        { title: '🚚 Teslimatlar', color: '#e65100',
          items: [{ label: 'Atandı', value: stats.deliveries.assigned }, { label: 'Yolda', value: stats.deliveries.picked_up }, { label: 'Teslim Edildi', value: stats.deliveries.delivered }, { label: 'Ort. Puan', value: `${stats.ratings.average_rating || 0} ⭐` }] },
      ].map((card, i) => (
        <div key={i} style={{ background: '#fff', borderRadius: '16px', padding: '1.4rem',
                              boxShadow: '0 4px 16px rgba(0,0,0,0.07)',
                              border: `1px solid ${card.color}20` }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: 700,
                       color: card.color, fontFamily: FONT }}>
            {card.title}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {card.items.map((item, j) => (
              <div key={j} style={{ padding: '10px 14px', borderRadius: '10px',
                                    background: `${card.color}08`, border: `1px solid ${card.color}15` }}>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: card.color }}>
                  {item.value || 0}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#9e9e9e', marginTop: '2px', fontFamily: FONT }}>
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}