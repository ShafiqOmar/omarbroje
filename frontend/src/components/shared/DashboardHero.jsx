const FONT = "'Plus Jakarta Sans', sans-serif";

export default function DashboardHero({ title, subtitle, gradient, textColor }) {
  return (
    <div style={{
      background: gradient,
      padding: '2rem 1.5rem 5rem',
      position: 'relative', overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute', top: '-40px', right: '-40px',
        width: '220px', height: '220px', borderRadius: '50%',
        background: 'rgba(255,255,255,0.04)'
      }} />
      <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
        <p style={{
          color: textColor, fontSize: '0.8rem', fontWeight: 600,
          letterSpacing: '0.1em', textTransform: 'uppercase',
          marginBottom: '4px', fontFamily: FONT
        }}>
          Hoş Geldiniz
        </p>
        <h1 style={{
          color: '#fff', fontSize: '1.8rem', fontWeight: 800,
          letterSpacing: '-0.02em', margin: 0, fontFamily: FONT
        }}>
          {title}
        </h1>
        <p style={{ color: textColor, fontSize: '0.9rem',
                    marginTop: '6px', fontFamily: FONT }}>
          {subtitle}
        </p>
      </div>
    </div>
  );
}