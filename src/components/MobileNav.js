import React from 'react';
import { NavLink } from 'react-router-dom';

const NAV = [
  { path: '/home', icon: '⌂', label: 'Home' },
  { path: '/search', icon: '⌕', label: 'Search' },
  { path: '/library', icon: '⊞', label: 'Library' },
  { path: '/liked', icon: '♥', label: 'Liked' },
];

export default function MobileNav() {
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'var(--bg-secondary)',
      borderTop: '1px solid var(--border)',
      padding: '8px 0',
      zIndex: 150,
      display: 'none',
    }} className="mobile-nav">
      {NAV.map(({ path, icon, label }) => (
        <NavLink key={path} to={path} style={({ isActive }) => ({
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
          padding: '6px 0', color: isActive ? 'var(--accent)' : 'var(--text-muted)',
          fontSize: 20, textDecoration: 'none', flex: 1
        })}>
          {icon}
          <span style={{ fontSize: 9, letterSpacing: 0.5, fontWeight: 600 }}>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
