import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api  from '../../services/api';
import logo from '../../assets/logo.png';

const FONT = "'Plus Jakarta Sans', sans-serif";

export default function ResetPassword() {
  const navigate                    = useNavigate();
  const [searchParams]              = useSearchParams();
  const [password,  setPassword]   = useState('');
  const [confirm,   setConfirm]    = useState('');
  const [loading,   setLoading]    = useState(false);
  const [error,     setError]      = useState('');
  const [success,   setSuccess]    = useState(false);

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  useEffect(() => {
    if (!token || !email) {
      setError('Geçersiz veya eksik bağlantı');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) { setError('Şifreler eşleşmiyor'); return; }
    if (password.length < 6)  { setError('Şifre en az 6 karakter olmalıdır'); return; }

    setLoading(true); setError('');
    try {
      await api.post('/auth/reset-password', {
        email, token, newPassword: password
      });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
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
        }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <img src={logo} alt="logo" style={{ width: '64px', height: '64px',
                                                objectFit: 'contain', marginBottom: '10px' }} />
            <h1 style={{ color: '#1b5e20', fontWeight: 800, fontSize: '1.4rem', margin: 0 }}>
              SmartFoodAid
            </h1>
            <p style={{ color: '#4caf50', fontSize: '0.82rem', margin: '4px 0 0' }}>
              Yeni Şifre Belirle
            </p>
          </div>

          {success ? (
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>✅</div>
              <h3 style={{ color: '#1b5e20', margin: '0 0 8px' }}>Şifreniz Güncellendi!</h3>
              <p style={{ color: '#9e9e9e', fontSize: '0.85rem' }}>
                Giriş sayfasına yönlendiriliyorsunuz...
              </p>
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

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem',
                                  fontWeight: 600, color: '#2e7d32', marginBottom: '6px' }}>
                    Yeni Şifre
                  </label>
                  <input type="password" value={password} required minLength={6}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="En az 6 karakter"
                    style={{ width: '100%', padding: '11px 14px', borderRadius: '10px',
                             border: '1.5px solid #c8e6c9', fontSize: '0.9rem',
                             fontFamily: FONT, outline: 'none',
                             background: 'rgba(255,255,255,0.8)',
                             boxSizing: 'border-box', color: '#333' }}
                    onFocus={e => e.target.style.border = '1.5px solid #43a047'}
                    onBlur={e  => e.target.style.border = '1.5px solid #c8e6c9'}
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem',
                                  fontWeight: 600, color: '#2e7d32', marginBottom: '6px' }}>
                    Şifre Tekrar
                  </label>
                  <input type="password" value={confirm} required
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="Şifreyi tekrar girin"
                    style={{ width: '100%', padding: '11px 14px', borderRadius: '10px',
                             border: confirm && confirm !== password
                               ? '1.5px solid #ef5350' : '1.5px solid #c8e6c9',
                             fontSize: '0.9rem', fontFamily: FONT, outline: 'none',
                             background: 'rgba(255,255,255,0.8)',
                             boxSizing: 'border-box', color: '#333' }}
                    onFocus={e => e.target.style.border = '1.5px solid #43a047'}
                    onBlur={e  => e.target.style.border = confirm !== password
                      ? '1.5px solid #ef5350' : '1.5px solid #c8e6c9'}
                  />
                  {confirm && confirm !== password && (
                    <p style={{ color: '#ef5350', fontSize: '0.75rem',
                                marginTop: '4px', fontWeight: 500 }}>
                      Şifreler eşleşmiyor
                    </p>
                  )}
                </div>

                <button type="submit" disabled={loading || !token || !email} style={{
                  width: '100%', padding: '12px', borderRadius: '12px', border: 'none',
                  background: loading ? '#a5d6a7' : 'linear-gradient(135deg, #1b5e20, #43a047)',
                  color: '#fff', fontFamily: FONT, fontWeight: 700,
                  fontSize: '0.9rem', cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 15px rgba(46,125,50,0.35)'
                }}>
                  {loading ? 'Güncelleniyor...' : '🔒 Şifremi Güncelle'}
                </button>
              </form>

              <p style={{ textAlign: 'center', marginTop: '1.5rem',
                          fontSize: '0.82rem', color: '#9e9e9e' }}>
                <Link to="/login" style={{ color: '#2e7d32', fontWeight: 600 }}>
                  ← Giriş sayfasına dön
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}