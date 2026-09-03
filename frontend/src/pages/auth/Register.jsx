import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import  {useAuth}  from '../../context/AuthContext';
import {
  UserIcon, EnvelopeIcon, LockClosedIcon,
  PhoneIcon, UserGroupIcon
} from '@heroicons/react/24/outline';
import logo from "../../assets/logo.png";

const ROLES = [
  { id: 2, label: 'Gıda Sağlayıcı',  icon: '🍽️' },
  { id: 3, label: 'Yardım Kuruluşu', icon: '🏢' },
  { id: 4, label: 'Gönüllü',          icon: '🤝' },
];

export default function Register() {
  const { register } = useAuth();
  const navigate     = useNavigate();

  const [form, setForm] = useState({
    full_name: '', email: '', password: '',
    phone: '', role_id: ''
  });
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register({ ...form, role_id: parseInt(form.role_id) });
      setSuccess('Kayıt başarılı! Admin onayı bekleniyor...');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Kayıt başarısız');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all";
  const inputStyle = {
    background: 'rgba(255,255,255,0.8)',
    border: '1.5px solid #c8e6c9',
    color: '#1b5e20'
  };

  const fields = [
    { key: 'full_name', type: 'text',     placeholder: 'Ad Soyad',       Icon: UserIcon         },
    { key: 'email',     type: 'email',    placeholder: 'E-posta',         Icon: EnvelopeIcon     },
    { key: 'password',  type: 'password', placeholder: 'Şifre (min. 6)', Icon: LockClosedIcon   },
    { key: 'phone',     type: 'tel',      placeholder: 'Telefon',         Icon: PhoneIcon        },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden py-8"
         style={{ background: 'linear-gradient(135deg, #f1f8e9 0%, #dcedc8 40%, #c5e1a5 100%)' }}>

      {/* Background blobs */}
      <div className="absolute top-[-60px] right-[-60px] w-64 h-64 rounded-full opacity-25"
           style={{ background: 'radial-gradient(circle, #66bb6a, transparent)' }} />
      <div className="absolute bottom-[-40px] left-[-40px] w-80 h-80 rounded-full opacity-20"
           style={{ background: 'radial-gradient(circle, #33691e, transparent)' }} />

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm mx-4">
        <div className="backdrop-blur-md rounded-3xl p-8 shadow-2xl"
             style={{ background: 'rgba(255,255,255,0.78)', border: '1px solid rgba(255,255,255,0.9)' }}>

         {/* Logo */}
<div className="flex flex-col items-center mb-3">
  <img
    src={logo}
    alt="SmartFoodAid"
    className="w-40 h-40 object-contain mb-2"
    style={{ filter: 'drop-shadow(0 4px 12px rgba(46,125,50,0.3))' }}
  />

  <h1 className="text-xl font-bold" style={{ color: '#1b5e20' }}>
    SmartFoodAid
  </h1>
</div>

<h2 className="text-xl font-bold text-center mb-3" style={{ color: '#2e7d32' }}>
  Kayıt Ol
</h2>

          {/* Messages */}
          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl text-sm font-medium"
                 style={{ background: '#ffebee', color: '#c62828', border: '1px solid #ffcdd2' }}>
              ⚠️ {error}
            </div>
          )}
          {success && (
            <div className="mb-4 px-4 py-3 rounded-xl text-sm font-medium"
                 style={{ background: '#e8f5e9', color: '#2e7d32', border: '1px solid #c8e6c9' }}>
              ✅ {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">

            {/* Dynamic fields */}
            {fields.map(({ key, type, placeholder, Icon }) => (
              <div key={key} className="relative">
                <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5"
                      style={{ color: '#388e3c' }} />
                <input
                  type={type}
                  value={form[key]}
                  onChange={e => setForm({ ...form, [key]: e.target.value })}
                  placeholder={placeholder}
                  required={key !== 'phone'}
                  minLength={key === 'password' ? 6 : undefined}
                  className={inputClass}
                  style={inputStyle}
                  onFocus={e => e.target.style.border = '1.5px solid #43a047'}
                  onBlur={e  => e.target.style.border = '1.5px solid #c8e6c9'}
                />
              </div>
            ))}

            {/* Role Select */}
            <div className="relative">
              <UserGroupIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5"
                              style={{ color: '#388e3c' }} />
              <select
                value={form.role_id}
                onChange={e => setForm({ ...form, role_id: e.target.value })}
                required
                className={inputClass}
                style={{ ...inputStyle, appearance: 'none' }}
                onFocus={e => e.target.style.border = '1.5px solid #43a047'}
                onBlur={e  => e.target.style.border = '1.5px solid #c8e6c9'}
              >
                <option value="">Rol Seçin...</option>
                {ROLES.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.icon} {r.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-white text-base transition-all duration-200 mt-2"
              style={{
                background: loading
                  ? '#a5d6a7'
                  : 'linear-gradient(135deg, #2e7d32, #43a047)',
                boxShadow: '0 4px 15px rgba(46,125,50,0.4)',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center mt-5 text-sm" style={{ color: '#757575' }}>
            Zaten hesabınız var mı?{' '}
            <Link to="/login" className="font-bold" style={{ color: '#2e7d32' }}>
              Giriş Yap
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}