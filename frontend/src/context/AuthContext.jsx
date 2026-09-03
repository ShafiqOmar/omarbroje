import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        setUser(JSON.parse(stored));
        connectSocket();
      }
    // eslint-disable-next-line no-unused-vars
    } catch (e) {
      localStorage.clear();
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });

    console.log('Login response:', data); // ← مؤقت للتشخيص

    localStorage.setItem('accessToken',  data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user',         JSON.stringify(data.user));

    console.log('Stored user:', localStorage.getItem('user')); // ← مؤقت

    setUser(data.user);
    connectSocket();
    return data.user;
  };

  const register = async (formData) => {
    const { data } = await api.post('/auth/register', formData);
    return data;
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      await api.post('/auth/logout', { refreshToken });
    } finally {
      localStorage.clear();
      setUser(null);
      disconnectSocket();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
           style={{ background: '#f4faf6' }}>
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin mx-auto mb-3"
               style={{ borderColor: '#2e7d32', borderTopColor: 'transparent' }} />
          <p style={{ color: '#2e7d32' }}>Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);