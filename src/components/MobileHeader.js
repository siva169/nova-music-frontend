import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../AppContext';
import { NovaLogoSidebar } from './NovaLogo';

const PAGE_TITLES = {
  '/home': 'Home',
  '/search': 'Search',
  '/library': 'Library',
  '/liked': 'Liked Songs',
  '/settings': 'Settings',
};

export default function MobileHeader() {
  const { setSidebarOpen, user } = useApp();
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] || 'NOVA';

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0,
      height: 56, zIndex: 100,
      background: 'rgba(8,8,16,0.92)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center',
      padding: '0 16px', gap: 12
    }} className="mobile-header">
      <button onClick={() => setSidebarOpen(s => !s)} style={{
        color: 'var(--text-secondary)', fontSize: 20,
        width: 36, height: 36, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'var(--transition)', flexShrink: 0
      }}
        onMouseOver={e => e.currentTarget.style.background = 'var(--surface-hover)'}
        onMouseOut={e => e.currentTarget.style.background = 'transparent'}
      >☰</button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
        <NovaLogoSidebar />
        <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, letterSpacing: 3,
          background: 'linear-gradient(135deg, #fff 0%, var(--accent) 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>NOVA</span>
      </div>

      <img src={user?.picture} alt={user?.name}
        style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--accent)', flexShrink: 0 }} />

      <style>{`
        @media (min-width: 769px) { .mobile-header { display: none !important; } }
      `}</style>
    </div>
  );
}
