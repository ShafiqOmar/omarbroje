export default function StatusBadge({ label, color, bg, dot }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '2px 10px', borderRadius: '20px',
      background: bg, color, fontSize: '0.72rem', fontWeight: 600
    }}>
      {dot && (
        <span style={{ width: '5px', height: '5px', borderRadius: '50%',
                       background: dot, display: 'inline-block' }} />
      )}
      {label}
    </span>
  );
}