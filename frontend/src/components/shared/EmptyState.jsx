const FONT = "'Plus Jakarta Sans', sans-serif";

export default function EmptyState({ icon, message, actionLabel, onAction }) {
  return (
    <div style={{
      background: '#fff', borderRadius: '20px', padding: '4rem 2rem',
      textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
    }}>
      <div style={{ fontSize: '3rem', marginBottom: '12px' }}>{icon}</div>
      <p style={{ color: '#9e9e9e', fontWeight: 500, fontFamily: FONT }}>
        {message}
      </p>
      {actionLabel && onAction && (
        <button onClick={onAction} style={{
          marginTop: '16px', padding: '10px 24px', borderRadius: '12px',
          background: 'linear-gradient(135deg, #1b5e20, #43a047)',
          color: '#fff', fontFamily: FONT, fontWeight: 600,
          fontSize: '0.875rem', border: 'none', cursor: 'pointer',
        }}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}