

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  BellIcon, ArrowRightOnRectangleIcon,
  Bars3Icon, XMarkIcon
} from '@heroicons/react/24/outline';
import logo from '../assets/logo.png';

export default function Navbar({ notifCount = 0, onNotifClick }) {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const roleInfo = {
    PROVIDER:  { label: 'Gıda Sağlayıcı', color: '#a5d6a7' },
    CHARITY:   { label: 'Yardım Kuruluşu', color: '#90caf9' },
    VOLUNTEER: { label: 'Gönüllü',          color: '#ce93d8' },
    ADMIN:     { label: 'Yönetici',         color: '#ffcc80' },
  };
  const role = roleInfo[user?.role] || roleInfo.PROVIDER;

  return (
    <nav style={{
      background: 'linear-gradient(135deg, #0a3d1f 0%, #1b5e20 50%, #2e7d32 100%)',
      boxShadow: '0 4px 30px rgba(0,0,0,0.3)',
      position: 'sticky', top: 0, zIndex: 100,
      fontFamily: "'Plus Jakarta Sans', sans-serif"
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto',
                    padding: '0 1.5rem', height: '68px',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between' }}>
<div
  style={{
    display: "flex",
    alignItems: "center",
    gap: "12px",
    cursor: "pointer"
  }}
>
  {/* Logo */}
  <img
    src={logo}
    alt="SmartFoodAid Logo"
    style={{
      width: "46px",
      height: "46px",
      objectFit: "contain",
      transition: "all 0.3s ease",
      filter: "drop-shadow(0 6px 12px rgba(0,0,0,0.25))"
    }}
    onMouseOver={(e) => {
      e.currentTarget.style.transform = "scale(1.1) rotate(-3deg)";
      e.currentTarget.style.filter =
        "drop-shadow(0 10px 20px rgba(0,0,0,0.35))";
    }}
    onMouseOut={(e) => {
      e.currentTarget.style.transform = "scale(1)";
      e.currentTarget.style.filter =
        "drop-shadow(0 6px 12px rgba(0,0,0,0.25))";
    }}
  />

  {/* Text */}
  <div style={{ display: "flex", flexDirection: "column" }}>
    <span
      style={{
        color: "#fff",
        fontWeight: 800,
        fontSize: "1.2rem",
        letterSpacing: "-0.02em"
      }}
    >
      SmartFoodAid
    </span>

    <span
      style={{
        color: "#A5D6A7",
        fontSize: "0.7rem",
        fontWeight: 500
      }}
    >
      Gıda İsrafını Önle
    </span>
  </div>
</div>

        {/* ── Right: Actions ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>

          {/* Role badge */}
          <div style={{
            padding: '4px 12px', borderRadius: '20px',
            background: 'rgba(255,255,255,0.1)',
            border: `1px solid ${role.color}40`,
            display: 'flex', alignItems: 'center', gap: '6px'
          }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%',
                          background: role.color }} />
            <span style={{ color: role.color, fontSize: '0.72rem', fontWeight: 600 }}>
              {role.label}
            </span>
          </div>

          {/* Notifications */}
          <button onClick={onNotifClick} style={{
            position: 'relative', width: '40px', height: '40px',
            borderRadius: '10px', border: 'none', cursor: 'pointer',
            background: 'rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s'
          }}>
            <BellIcon style={{ width: '20px', color: '#fff' }} />
            {notifCount > 0 && (
              <div style={{
                position: 'absolute', top: '-4px', right: '-4px',
                width: '18px', height: '18px', borderRadius: '50%',
                background: '#ef5350', border: '2px solid #1b5e20',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.6rem', fontWeight: 700, color: '#fff'
              }}>
                {notifCount > 9 ? '9+' : notifCount}
              </div>
            )}
          </button>

          {/* User */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '6px 12px', borderRadius: '10px',
            background: 'rgba(255,255,255,0.1)',
          }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '8px',
              background: 'linear-gradient(135deg, #43a047, #66bb6a)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.8rem', fontWeight: 700, color: '#fff'
            }}>
              {user?.fullName?.charAt(0).toUpperCase()}
            </div>
            <span style={{ color: '#fff', fontSize: '0.82rem',
                           fontWeight: 600, maxWidth: '120px',
                           overflow: 'hidden', textOverflow: 'ellipsis',
                           whiteSpace: 'nowrap' }}>
              {user?.fullName}
            </span>
          </div>

          {/* Logout */}
          <button onClick={handleLogout} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 14px', borderRadius: '10px',
            background: 'rgba(239,83,80,0.2)',
            border: '1px solid rgba(239,83,80,0.3)',
            color: '#ef9a9a', fontSize: '0.8rem', fontWeight: 600,
            cursor: 'pointer', transition: 'all 0.2s'
          }}>
            <ArrowRightOnRectangleIcon style={{ width: '16px' }} />
            <span>Çıkış</span>
          </button>
        </div>
      </div>
    </nav>
  );
}