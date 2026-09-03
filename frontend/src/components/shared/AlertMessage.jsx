export default function AlertMessage({ type, text }) {
  if (!text) return null;
  const isSuccess = type === 'success';
  return (
    <div style={{
      padding: '0.85rem 1.2rem', borderRadius: '12px', marginBottom: '1.2rem',
      fontSize: '0.875rem', fontWeight: 600,
      background: isSuccess ? '#e8f5e9' : '#ffebee',
      color:      isSuccess ? '#2e7d32' : '#c62828',
      border:     `1px solid ${isSuccess ? '#c8e6c9' : '#ffcdd2'}`,
    }}>
      {isSuccess ? '✅' : '⚠️'} {text}
    </div>
  );
}