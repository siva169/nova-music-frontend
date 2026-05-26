import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../AppContext';
export default function MobileHeader() {
  const { currentTrack } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/home';
  const pageName = location.pathname.replace('/', '') || 'home';

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

      <button onClick={() => navigate('/search')} style={{ width: 38, height: 38, borderRadius: '50%', color: 'var(--text-primary)', fontSize: 18 }}>⌕</button>

      <div
        onClick={() => !isHome && navigate('/home')}
        style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
      >
        <span style={{fontSize:14, fontWeight:700, letterSpacing:1, textTransform:'capitalize'}}>{pageName}</span>
      </div>

      <button
        onClick={() => navigate('/settings')}
        style={{
          width: 38, height: 38, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-primary)',
          fontSize: 20,
          background: 'transparent',
        }}
      >⚙</button>
    </header>
  );
}
