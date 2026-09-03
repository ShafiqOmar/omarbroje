const FONT = "'Plus Jakarta Sans', sans-serif";

export default function ReportsTab({ report }) {

  const totalRequests = report?.overview?.total_requests || 0;
  const approved      = report?.overview?.approved || 0;
  const successRate   = totalRequests > 0 ? Math.round((approved / totalRequests) * 100) : 0;
  if (!report) return (
    <div style={{ background: '#fff', borderRadius: '20px', padding: '4rem 2rem',
                  textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
      <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>⏳</div>
      <p style={{ color: '#9e9e9e', fontWeight: 500, fontFamily: FONT }}>Yükleniyor...</p>
    </div>
  );

  return (
    <div style={{ display: 'grid', gap: '16px' }}>

      {/* Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px' }}>
        {[
          { icon: '📦', label: 'Toplam Alınan Gıda',    value: `${report.deliveries.delivered_units} birim`, sub: 'Teslim edilen toplam',      color: '#1b5e20', bg: '#e8f5e9' },
          { icon: '🚚', label: 'Tamamlanan Teslimat',   value: report.deliveries.total_deliveries,           sub: 'Başarılı teslimat sayısı',  color: '#1565c0', bg: '#e3f2fd' },
          { icon: '📋', label: 'Toplam Talep',          value: report.overview.total_requests,               sub: 'Gönderilen toplam talep',   color: '#6a1b9a', bg: '#f3e5f5' },
          { icon: '✅', label: 'Onaylanan Talep',       value: report.overview.approved,                     sub: 'Onaylanan talep sayısı',    color: '#2e7d32', bg: '#e8f5e9' },
          { icon: '⏳', label: 'Bekleyen Talep',        value: report.overview.pending,                      sub: 'Yanıt bekleyen talepler',   color: '#e65100', bg: '#fff3e0' },
          { icon: '❌', label: 'Reddedilen Talep',      value: report.overview.rejected,                     sub: 'Reddedilen talep sayısı',   color: '#c62828', bg: '#ffebee' },
        ].map((s, i) => (
          <div key={i} style={{
            background: '#fff', borderRadius: '16px', padding: '1.3rem',
            boxShadow: '0 4px 16px rgba(0,0,0,0.07)',
            border: `1px solid ${s.color}20`,
            display: 'flex', alignItems: 'center', gap: '14px'
          }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '14px',
                          background: s.bg, display: 'flex', alignItems: 'center',
                          justifyContent: 'center', fontSize: '1.6rem', flexShrink: 0 }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#9e9e9e', fontWeight: 600,
                            marginBottom: '2px', fontFamily: FONT }}>{s.label}</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: s.color,
                            lineHeight: 1, fontFamily: FONT }}>{s.value || 0}</div>
              <div style={{ fontSize: '0.68rem', color: '#bdbdbd', marginTop: '3px',
                            fontFamily: FONT }}>{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Top Volunteers */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

        <div style={{ background: '#fff', borderRadius: '16px', padding: '1.4rem',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.07)' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: 700,
                       color: '#4a148c', fontFamily: FONT }}>
            🏆 Bize Hizmet Eden Gönüllüler
          </h3>
          {report.topVolunteers.length === 0 ? (
            <p style={{ color: '#9e9e9e', fontSize: '0.85rem', fontFamily: FONT }}>
              Henüz tamamlanan teslimat yok
            </p>
          ) : report.topVolunteers.map((v, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '8px 0',
              borderBottom: i < report.topVolunteers.length-1 ? '1px solid #f5f5f5' : 'none'
            }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px',
                            background: i === 0 ? '#fff8e1' : '#f3e5f5',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.9rem', fontWeight: 700,
                            color: i === 0 ? '#f57f17' : '#6a1b9a', flexShrink: 0 }}>
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#333',
                              fontFamily: FONT, overflow: 'hidden',
                              textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {v.full_name}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#9e9e9e', fontFamily: FONT }}>
                  {v.total_deliveries} teslimat · ⭐ {parseFloat(v.average_rating || 0).toFixed(1)}
                </div>
              </div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700,
                            color: '#4a148c', fontFamily: FONT }}>
                {v.units_delivered} birim
              </div>
            </div>
          ))}
        </div>

        {/* Recent Deliveries */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '1.4rem',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.07)' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: 700,
                       color: '#1565c0', fontFamily: FONT }}>
            🚚 Son Teslimatlar
          </h3>
          {report.recentDeliveries.length === 0 ? (
            <p style={{ color: '#9e9e9e', fontSize: '0.85rem', fontFamily: FONT }}>
              Henüz teslimat yok
            </p>
          ) : report.recentDeliveries.map((d, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '8px 0',
              borderBottom: i < report.recentDeliveries.length-1 ? '1px solid #f5f5f5' : 'none'
            }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px',
                            background: d.status === 'DELIVERED' ? '#e8f5e9' : '#fff3e0',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '1rem', flexShrink: 0 }}>
                {d.status === 'DELIVERED' ? '✅' : '🚗'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#333',
                              fontFamily: FONT, overflow: 'hidden',
                              textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {d.title}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#9e9e9e', fontFamily: FONT }}>
                  🤝 {d.volunteer_name} · 📦 {d.requested_quantity} birim
                </div>
              </div>
              <div style={{ fontSize: '0.7rem', color: '#9e9e9e',
                            fontFamily: FONT, flexShrink: 0 }}>
                {d.delivery_time
                  ? new Date(d.delivery_time).toLocaleDateString('tr-TR')
                  : '-'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rescue Rate */}
      <div style={{ background: '#fff', borderRadius: '16px', padding: '1.4rem',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.07)' }}>
        <h3 style={{ margin: '0 0 1rem', fontSize: '0.95rem', fontWeight: 700,
                     color: '#333', fontFamily: FONT }}>
          📊 Talep Başarı Oranı
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ flex: 1, height: '20px', borderRadius: '10px',
                        background: '#f0f0f0', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: '10px',
              width: `${successRate}%`,
              background: 'linear-gradient(90deg, #1a237e, #3949ab)',
              transition: 'width 0.5s ease-in-out'
            }} />
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#1a237e',
                         minWidth: '50px', fontFamily: FONT }}>
            %{successRate}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between',
                      marginTop: '8px', fontSize: '0.75rem', color: '#9e9e9e', fontFamily: FONT }}>
          <span>Onaylanan: {report.overview.approved} talep</span>
          <span>Toplam: {report.overview.total_requests} talep</span>
        </div>
      </div>

    </div>
  );
}