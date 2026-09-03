const FONT = "'Plus Jakarta Sans', sans-serif";

export default function StatCard({ icon, label, value, color }) {
  return (
    <div style={{
      background: '#fff', borderRadius: '16px', padding: '1.2rem 1.4rem',
      boxShadow: '0 8px 32px rgba(0,0,0,0.10)',
      border: '1px solid rgba(0,0,0,0.05)',
      display: 'flex', alignItems: 'center', gap: '12px'
    }}>
      <div style={{
        width: '48px', height: '48px', borderRadius: '12px',
        background: `${color}15`, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        fontSize: '1.4rem', flexShrink: 0
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '1.6rem', fontWeight: 800,
                      color, lineHeight: 1 }}>
          {value ?? 0}
        </div>
        <div style={{ fontSize: '0.72rem', color: '#9e9e9e',
                      fontWeight: 500, marginTop: '3px',
                      fontFamily: FONT }}>
          {label}
        </div>
      </div>
    </div>
  );
}