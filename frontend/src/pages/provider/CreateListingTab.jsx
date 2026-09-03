import { useState } from 'react';
import { MapPinIcon } from '@heroicons/react/24/outline';
import api from '../../services/api';

const FONT = "'Plus Jakarta Sans', sans-serif";

export default function CreateListingTab({ onSuccess }) {
  const [form,     setForm]     = useState({ title:'', description:'', total_quantity:'', expiry_date:'', lat:'', lng:'' });
  const [loading,  setLoading]  = useState(false);
  const [locating, setLocating] = useState(false);
  const [error,    setError]    = useState('');

  // ── موقع حقيقي ──
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setError('Konum servisi desteklenmiyor');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm(prev => ({
          ...prev,
          lat: pos.coords.latitude.toFixed(6),
          lng: pos.coords.longitude.toFixed(6)
        }));
        setLocating(false);
      },
      () => {
        setError('Konum alınamadı. Lütfen tarayıcı iznini kontrol edin.');
        setLocating(false);
      },
      { enableHighAccuracy: true }
    );
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true); 
  setError('');

  try {
    // تحويل التاريخ إلى الصيغة الصحيحة MySQL
    const expiryDate = form.expiry_date.replace('T', ''); // إذا بدون ثانية
    // أو لو تريد تضمين الثواني
    const expiryDateSQL = form.expiry_date.replace('T', ' ') + ':00'; 

    await api.post('/food', {
      ...form,
      total_quantity: parseInt(form.total_quantity),
      lat: parseFloat(form.lat),
      lng: parseFloat(form.lng),
      expiry_date: expiryDateSQL
    });

    setForm({ title:'', description:'', total_quantity:'', expiry_date:'', lat:'', lng:'' });
    onSuccess('İlan başarıyla oluşturuldu!');
  } catch (err) {
    setError(err.response?.data?.message || 'Hata oluştu');
  } finally {
    setLoading(false);
  }
};

  return (
    <div style={{
      background: '#fff', borderRadius: '20px', padding: '2rem',
      boxShadow: '0 4px 20px rgba(0,0,0,0.07)', fontFamily: FONT
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '10px',
                      background: '#e8f5e9', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
          🍽️
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#1b5e20' }}>
            Yeni Gıda İlanı Oluştur
          </h2>
          <p style={{ margin: 0, fontSize: '0.78rem', color: '#9e9e9e' }}>
            Fazla gıdanızı ihtiyaç sahipleriyle paylaşın
          </p>
        </div>
      </div>

      {error && (
        <div style={{ padding: '0.85rem', borderRadius: '10px', marginBottom: '1rem',
                      background: '#ffebee', color: '#c62828', fontSize: '0.875rem' }}>
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>

          {/* Title */}
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600,
                            color: '#2e7d32', marginBottom: '6px' }}>
              İlan Başlığı
            </label>
            <input type="text" value={form.title} required
              onChange={e => setForm({...form, title: e.target.value})}
              placeholder="Örn: Pilav ve Çorba"
              style={{ width: '100%', padding: '10px 14px', borderRadius: '10px',
                       border: '1.5px solid #e0e0e0', fontSize: '0.875rem',
                       fontFamily: FONT, outline: 'none', background: '#fafafa',
                       boxSizing: 'border-box', color: '#333' }}
              onFocus={e => e.target.style.border = '1.5px solid #43a047'}
              onBlur={e  => e.target.style.border = '1.5px solid #e0e0e0'}
            />
          </div>

          {/* Description */}
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600,
                            color: '#2e7d32', marginBottom: '6px' }}>
              Açıklama
            </label>
            <input type="text" value={form.description}
              onChange={e => setForm({...form, description: e.target.value})}
              placeholder="Kısa açıklama..."
              style={{ width: '100%', padding: '10px 14px', borderRadius: '10px',
                       border: '1.5px solid #e0e0e0', fontSize: '0.875rem',
                       fontFamily: FONT, outline: 'none', background: '#fafafa',
                       boxSizing: 'border-box', color: '#333' }}
              onFocus={e => e.target.style.border = '1.5px solid #43a047'}
              onBlur={e  => e.target.style.border = '1.5px solid #e0e0e0'}
            />
          </div>

          {/* Quantity */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600,
                            color: '#2e7d32', marginBottom: '6px' }}>
              Miktar (kişi)
            </label>
            <input type="number" value={form.total_quantity} required
              onChange={e => setForm({...form, total_quantity: e.target.value})}
              placeholder="50"
              style={{ width: '100%', padding: '10px 14px', borderRadius: '10px',
                       border: '1.5px solid #e0e0e0', fontSize: '0.875rem',
                       fontFamily: FONT, outline: 'none', background: '#fafafa',
                       boxSizing: 'border-box', color: '#333' }}
              onFocus={e => e.target.style.border = '1.5px solid #43a047'}
              onBlur={e  => e.target.style.border = '1.5px solid #e0e0e0'}
            />
          </div>

          {/* Expiry */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600,
                            color: '#2e7d32', marginBottom: '6px' }}>
              Son Tüketim Tarihi
            </label>
            <input type="datetime-local" value={form.expiry_date} required
              onChange={e => setForm({...form, expiry_date: e.target.value})}
              min={new Date(Date.now() + 60*60*1000).toISOString().slice(0,16)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '10px',
                       border: '1.5px solid #e0e0e0', fontSize: '0.875rem',
                       fontFamily: FONT, outline: 'none', background: '#fafafa',
                       boxSizing: 'border-box', color: '#333' }}
              onFocus={e => e.target.style.border = '1.5px solid #43a047'}
              onBlur={e  => e.target.style.border = '1.5px solid #e0e0e0'}
            />
          </div>

          {/* Location Section */}
          <div style={{ gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between',
                          alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#2e7d32' }}>
                📍 Konum Bilgisi
              </label>
              <button type="button" onClick={handleGetLocation} disabled={locating}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '7px 14px', borderRadius: '8px', border: 'none',
                  background: locating ? '#e8f5e9' : 'linear-gradient(135deg, #1b5e20, #43a047)',
                  color: locating ? '#9e9e9e' : '#fff',
                  fontFamily: FONT, fontWeight: 600, fontSize: '0.78rem',
                  cursor: locating ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 8px rgba(46,125,50,0.3)'
                }}>
                <MapPinIcon style={{ width: '14px' }} />
                {locating ? 'Konum alınıyor...' : 'Mevcut Konumumu Kullan'}
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <input type="number" value={form.lat} required
                  onChange={e => setForm({...form, lat: e.target.value})}
                  placeholder="Enlem (Lat): 41.0082"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px',
                           border: form.lat ? '1.5px solid #43a047' : '1.5px solid #e0e0e0',
                           fontSize: '0.875rem', fontFamily: FONT, outline: 'none',
                           background: form.lat ? '#f1f8e9' : '#fafafa',
                           boxSizing: 'border-box', color: '#333' }}
                />
              </div>
              <div>
                <input type="number" value={form.lng} required
                  onChange={e => setForm({...form, lng: e.target.value})}
                  placeholder="Boylam (Lng): 28.9784"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px',
                           border: form.lng ? '1.5px solid #43a047' : '1.5px solid #e0e0e0',
                           fontSize: '0.875rem', fontFamily: FONT, outline: 'none',
                           background: form.lng ? '#f1f8e9' : '#fafafa',
                           boxSizing: 'border-box', color: '#333' }}
                />
              </div>
            </div>

            {form.lat && form.lng && (
              <div style={{ marginTop: '8px', padding: '8px 12px', borderRadius: '8px',
                            background: '#e8f5e9', border: '1px solid #c8e6c9',
                            display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPinIcon style={{ width: '14px', color: '#2e7d32' }} />
                <span style={{ fontSize: '0.75rem', color: '#2e7d32', fontWeight: 600 }}>
                  Konum seçildi: {parseFloat(form.lat).toFixed(4)}, {parseFloat(form.lng).toFixed(4)}
                </span>
              </div>
            )}
          </div>
        </div>

        <button type="submit" disabled={loading} style={{
          width: '100%', marginTop: '1.5rem', padding: '13px',
          borderRadius: '12px', border: 'none',
          background: loading ? '#a5d6a7' : 'linear-gradient(135deg, #1b5e20, #43a047)',
          color: '#fff', fontFamily: FONT, fontWeight: 700, fontSize: '0.9rem',
          cursor: loading ? 'not-allowed' : 'pointer',
          boxShadow: '0 4px 15px rgba(46,125,50,0.35)'
        }}>
          {loading ? 'Oluşturuluyor...' : '+ İlan Oluştur'}
        </button>
      </form>
    </div>
  );
}