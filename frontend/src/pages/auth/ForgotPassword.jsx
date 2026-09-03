import { useState } from 'react';
import { Link } from 'react-router-dom';
import api  from '../../services/api';
import logo from '../../assets/logo.png';

const FONT = "'Plus Jakarta Sans', sans-serif";

export default function ForgotPassword() {
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [sent,    setSent]    = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '1rem',
      background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 40%, #a5d6a7 100%)',
      fontFamily: FONT
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{
          borderRadius: '24px', padding: '2.5rem',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          background: 'rgba(255,255,255,0.9)',
          border: '1px solid rgba(255,255,255,0.9)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <img src={logo} alt="logo" style={{ width: '64px', height: '64px',
                                                objectFit: 'contain', marginBottom: '10px' }} />
            <h1 style={{ color: '#1b5e20', fontWeight: 800, fontSize: '1.4rem', margin: 0 }}>
              SmartFoodAid
            </h1>
            <p style={{ color: '#4caf50', fontSize: '0.82rem', margin: '4px 0 0' }}>
              Şifre Sıfırlama
            </p>
          </div>

          {sent ? (
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📧</div>
              <h3 style={{ color: '#1b5e20', margin: '0 0 8px' }}>E-posta Gönderildi!</h3>
              <p style={{ color: '#555', fontSize: '0.88rem', lineHeight: 1.6 }}>
                <strong>{email}</strong> adresine şifre sıfırlama bağlantısı gönderildi.
                Lütfen e-postanızı kontrol edin.
              </p>
              <p style={{ color: '#9e9e9e', fontSize: '0.78rem', marginTop: '12px' }}>
                ⏱ Bağlantı 30 dakika geçerlidir.
              </p>
              <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button onClick={() => setSent(false)} style={{
                  padding: '10px', borderRadius: '10px', border: '1px solid #c8e6c9',
                  background: '#f1f8e9', color: '#2e7d32', fontFamily: FONT,
                  fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer'
                }}>
                  Farklı e-posta dene
                </button>
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div style={{ padding: '0.75rem 1rem', borderRadius: '10px',
                              marginBottom: '1rem', fontSize: '0.85rem', fontWeight: 600,
                              background: '#ffebee', color: '#c62828',
                              border: '1px solid #ffcdd2' }}>
                  ⚠️ {error}
                </div>
              )}

              <p style={{ color: '#555', fontSize: '0.88rem',
                          marginBottom: '1.5rem', textAlign: 'center' }}>
                Kayıtlı e-posta adresinizi girin, size sıfırlama bağlantısı gönderelim.
              </p>

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '1.2rem' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem',
                                  fontWeight: 600, color: '#2e7d32', marginBottom: '6px' }}>
                    E-posta Adresi
                  </label>
                  <input type="email" value={email} required
                    onChange={e => setEmail(e.target.value)}
                    placeholder="ornek@email.com"
                    style={{ width: '100%', padding: '11px 14px', borderRadius: '10px',
                             border: '1.5px solid #c8e6c9', fontSize: '0.9rem',
                             fontFamily: FONT, outline: 'none',
                             background: 'rgba(255,255,255,0.8)',
                             boxSizing: 'border-box', color: '#333' }}
                    onFocus={e => e.target.style.border = '1.5px solid #43a047'}
                    onBlur={e  => e.target.style.border = '1.5px solid #c8e6c9'}
                  />
                </div>
                <button type="submit" disabled={loading} style={{
                  width: '100%', padding: '12px', borderRadius: '12px', border: 'none',
                  background: loading ? '#a5d6a7' : 'linear-gradient(135deg, #1b5e20, #43a047)',
                  color: '#fff', fontFamily: FONT, fontWeight: 700,
                  fontSize: '0.9rem', cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 15px rgba(46,125,50,0.35)'
                }}>
                  {loading ? 'Gönderiliyor...' : '📧 Sıfırlama Bağlantısı Gönder'}
                </button>
              </form>
            </>
          )}

          <p style={{ textAlign: 'center', marginTop: '1.5rem',
                      fontSize: '0.82rem', color: '#9e9e9e' }}>
            <Link to="/login" style={{ color: '#2e7d32', fontWeight: 600 }}>
              ← Giriş sayfasına dön
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}