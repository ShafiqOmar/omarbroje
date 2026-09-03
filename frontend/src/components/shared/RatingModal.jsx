import { useState } from 'react';
import api from '../../services/api';

const FONT = "'Plus Jakarta Sans', sans-serif";
const LABELS = ['', 'Çok Kötü', 'Kötü', 'Orta', 'İyi', 'Mükemmel'];

export default function RatingModal({ deliveryId, volunteerName, onClose, onSuccess }) {
  const [score,   setScore]   = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      await api.post('/ratings', {
        delivery_id: deliveryId,
        rating:      score,
        comment:     comment || null
      });
      onSuccess('Değerlendirmeniz gönderildi ⭐');
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '1rem'
    }}>
      <div style={{
        background: '#fff', borderRadius: '20px', padding: '2rem',
        width: '100%', maxWidth: '420px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        fontFamily: FONT
      }}>
        <h3 style={{ margin: '0 0 0.4rem', fontSize: '1.1rem',
                     fontWeight: 800, color: '#1a237e' }}>
          ⭐ Gönüllüyü Değerlendir
        </h3>
        <p style={{ margin: '0 0 1.5rem', fontSize: '0.85rem', color: '#9e9e9e' }}>
          {volunteerName}
        </p>

        {error && (
          <div style={{ padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem',
                        background: '#ffebee', color: '#c62828', fontSize: '0.85rem' }}>
            ⚠️ {error}
          </div>
        )}

        {/* Stars */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '0.5rem',
                      justifyContent: 'center' }}>
          {[1,2,3,4,5].map(star => (
            <button key={star} onClick={() => setScore(star)} style={{
              width: '48px', height: '48px', borderRadius: '12px',
              border: 'none', fontSize: '1.5rem', cursor: 'pointer',
              transition: 'all 0.15s',
              background: star <= score ? '#fff8e1' : '#f5f5f5',
              transform: star <= score ? 'scale(1.1)' : 'scale(1)',
              boxShadow: star <= score ? '0 2px 8px rgba(245,127,23,0.3)' : 'none'
            }}>
              {star <= score ? '⭐' : '☆'}
            </button>
          ))}
        </div>
        <p style={{ textAlign: 'center', fontSize: '0.85rem', color: '#f57f17',
                    fontWeight: 700, marginBottom: '1.2rem' }}>
          {LABELS[score]}
        </p>

        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Yorum ekleyin (isteğe bağlı)..."
          rows={3}
          style={{
            width: '100%', padding: '10px 14px', borderRadius: '10px',
            border: '1.5px solid #e0e0e0', fontSize: '0.875rem',
            fontFamily: FONT, outline: 'none', resize: 'none',
            boxSizing: 'border-box', marginBottom: '1.2rem'
          }}
        />

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '11px', borderRadius: '10px',
            background: '#f5f5f5', border: 'none', color: '#757575',
            fontFamily: FONT, fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer'
          }}>
            İptal
          </button>
          <button onClick={handleSubmit} disabled={loading} style={{
            flex: 2, padding: '11px', borderRadius: '10px', border: 'none',
            background: 'linear-gradient(135deg, #1a237e, #3949ab)',
            color: '#fff', fontFamily: FONT, fontWeight: 700,
            fontSize: '0.875rem', cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 12px rgba(57,73,171,0.3)',
            opacity: loading ? 0.7 : 1
          }}>
            {loading ? 'Gönderiliyor...' : '⭐ Değerlendirmeyi Gönder'}
          </button>
        </div>
      </div>
    </div>
  );
}