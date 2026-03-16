import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../AppContext';
import { NovaLogoFull } from './NovaLogo';
export default function MobileHeader() {
  const { user, setSidebarOpen, currentTrack } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const isSearch = location.pathname === '/search';

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px',
      height: 56,
      background: 'var(--bg-primary)',
      borderBottom: '1px solid var(--border)',
      position: 'sticky',
      top: 0,
      zIndex: 200,
      flexShrink: 0,
    }} className="mobile-only">

      {/* Left - Menu */}
      <button
        onClick={() => setSidebarOpen(s => !s)}
        style={{ width: 38, height: 38, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)', fontSize: 20 }}
      >☰</button>

      {/* Center - Logo */}
      <div
        onClick={() => navigate('/home')}
        style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
      >
        <span style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 22,
          letterSpacing: 4,
          background: 'linear-gradient(135deg, #ffffff 0%, #00d4ff 50%, #bf5af2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>NOVA</span>
      </div>

      {/* Right - Search icon (navigates to search page) */}
      <button
        onClick={() => navigate('/search')}
        style={{
          width: 38, height: 38, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: isSearch ? 'var(--accent)' : 'var(--text-primary)',
          fontSize: 20,
          background: isSearch ? 'rgba(var(--accent-rgb), 0.1)' : 'transparent',
        }}
      >⌕</button>
    </header>
  );
}
