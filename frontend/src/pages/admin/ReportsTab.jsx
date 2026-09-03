const FONT = "'Plus Jakarta Sans', sans-serif";

export default function ReportsTab({ report }) {
  if (!report) return <p style={{ color: '#9e9e9e', fontFamily: FONT }}>Yükleniyor...</p>;

  return (
    <div style={{ display: 'grid', gap: '16px' }}>
      {/* Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px' }}>
        {[
          { icon: '🌍', label: 'Kurtarılan Gıda',    value: `${report.overview.total_units_saved} birim`, sub: 'Toplam dağıtılan',         color: '#2e7d32', bg: '#e8f5e9' },
          { icon: '👥', label: 'Tahmini Faydalanan', value: `${report.overview.total_units_saved} kişi`,  sub: '1 birim = 1 kişi',        color: '#1565c0', bg: '#e3f2fd' },
          { icon: '🚚', label: 'Tamamlanan',         value: report.overview.total_deliveries,             sub: 'Başarılı teslimat',        color: '#6a1b9a', bg: '#f3e5f5' },
          { icon: '🏢', label: 'Faydalanan Kuruluş', value: report.overview.total_beneficiary_orgs,       sub: 'Yardım kuruluşu',         color: '#e65100', bg: '#fff3e0' },
          { icon: '📅', label: 'Bu Ay',              value: `${report.overview.monthly_units} birim`,     sub: `${report.overview.monthly_deliveries} teslimat`, color: '#00695c', bg: '#e0f2f1' },
          { icon: '♻️', label: 'Kurtarma Oranı',     value: `%${report.overview.rescue_rate}`,            sub: `${report.overview.total_distributed}/${report.overview.total_available} birim`, color: '#b71c1c', bg: '#ffebee' },
        ].map((s, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: '16px', padding: '1.3rem',
                                boxShadow: '0 4px 16px rgba(0,0,0,0.07)',
                                border: `1px solid ${s.color}20`,
                                display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: s.bg,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '1.6rem', flexShrink: 0 }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#9e9e9e', fontWeight: 600,
                            marginBottom: '2px', fontFamily: FONT }}>{s.label}</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: s.color, lineHeight: 1, fontFamily: FONT }}>
                {s.value}
              </div>
              <div style={{ fontSize: '0.68rem', color: '#bdbdbd', marginTop: '3px', fontFamily: FONT }}>
                {s.sub}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Rescue Rate */}
      <div style={{ background: '#fff', borderRadius: '16px', padding: '1.4rem',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.07)' }}>
        <h3 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: 700,
                     color: '#333', fontFamily: FONT }}>
          ♻️ Gıda Kurtarma Oranı
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ flex: 1, height: '20px', borderRadius: '10px',
                        background: '#f0f0f0', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: '10px',
                          width: `${report.overview.rescue_rate}%`,
                          background: 'linear-gradient(90deg, #2e7d32, #66bb6a)' }} />
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#2e7d32',
                         minWidth: '50px', fontFamily: FONT }}>
            %{report.overview.rescue_rate}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between',
                      marginTop: '8px', fontSize: '0.75rem', color: '#9e9e9e', fontFamily: FONT }}>
          <span>Dağıtılan: {report.overview.total_distributed} birim</span>
          <span>Toplam: {report.overview.total_available} birim</span>
        </div>
      </div>

      {/* Weekly Chart */}
      <div style={{ background: '#fff', borderRadius: '16px', padding: '1.4rem',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.07)' }}>
        <h3 style={{ margin: '0 0 1.2rem', fontSize: '0.95rem', fontWeight: 700,
                     color: '#333', fontFamily: FONT }}>
          📈 Haftalık Teslimat Trendi
        </h3>
        {report.weekly.length === 0 ? (
          <p style={{ color: '#9e9e9e', textAlign: 'center', padding: '2rem 0', fontFamily: FONT }}>
            Henüz veri yok
          </p>
        ) : (
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'flex-end',
                            gap: '8px', height: '140px', padding: '0 4px' }}>
                {(() => {
                  const maxVal = Math.max(...report.weekly.map(w => Number(w.units_saved)), 1);
                  const weeks  = Array.from({ length: 7 }, (_, i) => {
                    const found = report.weekly[report.weekly.length - 7 + i];
                    return found || { week: i+1, units_saved: 0, deliveries: 0 };
                  });
                  return weeks.map((w, i) => (
                    <div key={i} style={{ flex: 1, display: 'flex',
                                          flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '0.62rem', color: '#9e9e9e', fontWeight: 600 }}>
                        {Number(w.units_saved) > 0 ? w.units_saved : ''}
                      </span>
                      <div style={{ width: '100%', position: 'relative', flex: 1,
                                    display: 'flex', alignItems: 'flex-end' }}>
                        <div style={{
                          width: '100%', borderRadius: '6px 6px 0 0',
                          background: Number(w.units_saved) > 0
                            ? 'linear-gradient(180deg, #43a047, #2e7d32)' : '#f0f0f0',
                          height: `${Math.max((Number(w.units_saved) / maxVal) * 110, Number(w.units_saved) > 0 ? 8 : 4)}px`,
                          boxShadow: Number(w.units_saved) > 0 ? '0 2px 8px rgba(46,125,50,0.3)' : 'none'
                        }} />
                      </div>
                      <span style={{ fontSize: '0.62rem', color: '#9e9e9e', fontFamily: FONT }}>
                        H{w.week}
                      </span>
                    </div>
                  ));
                })()}
              </div>
              <div style={{ height: '1px', background: '#e0e0e0', margin: '0 4px' }} />
            </div>
            <div style={{ width: '140px', flexShrink: 0, display: 'flex',
                          flexDirection: 'column', gap: '10px', justifyContent: 'center' }}>
              {[
                { label: 'Bu Hafta',    value: `${report.weekly[report.weekly.length-1]?.units_saved || 0} birim`, color: '#2e7d32' },
                { label: 'Teslimat',   value: `${report.weekly[report.weekly.length-1]?.deliveries || 0} adet`,  color: '#1565c0' },
                { label: 'Toplam Hafta', value: `${report.weekly.length} hafta`, color: '#6a1b9a' },
              ].map((item, i) => (
                <div key={i} style={{ padding: '10px 12px', borderRadius: '10px',
                                      background: `${item.color}08`, border: `1px solid ${item.color}20` }}>
                  <div style={{ fontSize: '0.65rem', color: '#9e9e9e', marginBottom: '2px', fontFamily: FONT }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: item.color, fontFamily: FONT }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Top Lists */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
        {[
          { title: '🏆 En Aktif Gönüllüler', color: '#6a1b9a', items: report.topVolunteers,
            nameKey: 'full_name', valueKey: 'units_delivered', unit: 'birim',
            subKey: (v) => `${v.total_deliveries} teslimat · ⭐ ${parseFloat(v.average_rating||0).toFixed(1)}` },
          { title: '🏢 En Çok Faydalanan', color: '#1565c0', items: report.topCharities,
            nameKey: 'charity_name', valueKey: 'total_units_received', unit: 'birim',
            subKey: (c) => `${c.total_requests} talep` },
          { title: '🍽️ En Çok Bağış Yapan', color: '#2e7d32', items: report.topProviders,
            nameKey: 'provider_name', valueKey: 'units_donated', unit: 'birim',
            subKey: (p) => `${p.total_listings} ilan` },
        ].map((card, ci) => (
          <div key={ci} style={{ background: '#fff', borderRadius: '16px', padding: '1.3rem',
                                 boxShadow: '0 4px 16px rgba(0,0,0,0.07)' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '0.9rem', fontWeight: 700,
                         color: card.color, fontFamily: FONT }}>
              {card.title}
            </h3>
            {card.items.length === 0 ? (
              <p style={{ color: '#9e9e9e', fontSize: '0.8rem', fontFamily: FONT }}>Henüz veri yok</p>
            ) : card.items.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px',
                                    padding: '8px 0', borderBottom: i < card.items.length-1 ? '1px solid #f5f5f5' : 'none' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '8px',
                              background: i === 0 ? '#fff8e1' : `${card.color}15`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '0.8rem', fontWeight: 700,
                              color: i === 0 ? '#f57f17' : card.color, flexShrink: 0 }}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#333', fontFamily: FONT,
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item[card.nameKey]}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#9e9e9e', fontFamily: FONT }}>
                    {card.subKey(item)}
                  </div>
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700,
                              color: card.color, fontFamily: FONT }}>
                  {item[card.valueKey]} {card.unit}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}