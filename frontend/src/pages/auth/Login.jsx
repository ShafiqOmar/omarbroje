import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import  {useAuth}  from '../../context/AuthContext';
import { EnvelopeIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import logo from "../../assets/logo.png";
import bgPhoto from "../../assets/wheat.jpg";

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [form,    setForm]    = useState({ email: '', password: '' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

 const handleSubmit = async (e) => {
  e.preventDefault();
  console.log('1. Form submitted:', form); // ← هل يظهر؟

  setError('');
  setLoading(true);

  try {
    console.log('2. Calling login...'); // ← هل يظهر؟
    const user = await login(form.email, form.password);
  
    console.log('3. Login success:', user); 
    console.log('Role:', user?.role);// ← هل يظهر؟

    const routes = {
      PROVIDER:  '/provider',
      CHARITY:   '/charity',
      VOLUNTEER: '/volunteer',
      ADMIN:     '/admin',
    };

    console.log('4. Navigating to:', routes[user.role]); // ← هل يظهر؟
    navigate(routes[user.role]);

  } catch (err) {
    console.log('5. Error:', err); // ← هل يظهر؟
    setError(err.response?.data?.message || 'Giriş başarısız');
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">

      {/* Blurred background photo (source image is low-res, so blur hides upscale artifacts) */}
      <div className="absolute inset-0 scale-105"
           style={{
             backgroundImage: `url(${bgPhoto})`,
             backgroundSize: 'cover',
             backgroundPosition: 'center 82%',
             filter: 'blur(3px) saturate(1.15)',
           }} />
      <div className="absolute inset-0"
           style={{ background: 'linear-gradient(135deg, rgba(27,94,32,0.12), rgba(46,125,50,0.05))' }} />

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm mx-4">
        <div className="backdrop-blur-md rounded-3xl p-8 shadow-2xl"
             style={{ background: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.6)' }}>

          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <img src={logo} alt="SmartFoodAid" className="w-40 h-40 object-contain mb-3"
                 style={{ filter: 'drop-shadow(0 4px 12px rgba(46,125,50,0.3))' }} />
            <h1 className="text-2xl font-bold" style={{ color: '#1b5e20' }}>SmartFoodAid</h1>
            <p className="text-sm mt-1" style={{ color: '#4caf50' }}>Gıda İsrafını Birlikte Önleyelim</p>
          </div>

          <h2 className="text-xl font-bold text-center mb-6" style={{ color: '#2e7d32' }}>
            Giriş Yap
          </h2>

          {/* Error */}
          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl text-sm font-medium"
                 style={{ background: '#ffebee', color: '#c62828', border: '1px solid #ffcdd2' }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Email */}
            <div className="relative">
              <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5"
                             style={{ color: '#388e3c' }} />
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="E-posta adresiniz"
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.8)',
                  border: '1.5px solid #c8e6c9',
                  color: '#1b5e20'
                }}
                onFocus={e => e.target.style.border = '1.5px solid #43a047'}
                onBlur={e  => e.target.style.border = '1.5px solid #c8e6c9'}
              />
            </div>

            {/* Password */}
            <div className="relative">
              <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5"
                               style={{ color: '#388e3c' }} />
              <input
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="Şifreniz"
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.8)',
                  border: '1.5px solid #c8e6c9',
                  color: '#1b5e20'
                }}
                onFocus={e => e.target.style.border = '1.5px solid #43a047'}
                onBlur={e  => e.target.style.border = '1.5px solid #c8e6c9'}
              />
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
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white"
                       xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10"
                            stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor"
                          d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Giriş yapılıyor...
                </span>
              ) : 'Giriş Yap'}
            </button>
          </form>

          {/* Footer */}
          <div className="flex justify-between mt-5 text-sm">
            <Link to="/register"
                  className="font-medium transition-colors"
                  style={{ color: '#388e3c' }}>
              Kayıt Ol
            </Link>
            <Link to="/forgot-password" style={{ color: '#757575', textDecoration: 'none' }}>
             Şifremi Unuttum?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}