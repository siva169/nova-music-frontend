import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext';

const NAV = [
  { path: '/home',    icon: '⌂', label: 'Home' },
  { path: '/search',  icon: '⌕', label: 'Search' },
  { path: '/library', icon: '⊞', label: 'Library' },
  { path: '/liked',   icon: '♥', label: 'Liked' },
];

export default function MobileNav() {
  return (
    <nav className="mobile-nav" style={{
      display: 'none', // shown via CSS on mobile
      background: 'var(--bg-secondary)',
      borderTop: '1px solid var(--border)',
      padding: '8px 0 env(safe-area-inset-bottom, 8px)',
      zIndex: 150,
      justifyContent: 'space-around',
      alignItems: 'center',
    }}>
      {NAV.map(({ path, icon, label }) => (
        <NavLink key={path} to={path} style={({ isActive }) => ({
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 3, padding: '4px 16px', textDecoration: 'none',
          color: isActive ? 'var(--accent)' : 'var(--text-muted)',
          transition: 'var(--transition)'
        })}>
          <span style={{ fontSize: 22 }}>{icon}</span>
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.5 }}>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
