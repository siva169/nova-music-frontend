import React from 'react';
import { NavLink } from 'react-router-dom';

const NAV = [
  { path: '/home',    label: 'Home',    icon: (active) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={active?'white':'rgba(255,255,255,0.5)'}>
      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
    </svg>
  )},
  { path: '/search',  label: 'Search',  icon: (active) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active?'white':'rgba(255,255,255,0.5)'} strokeWidth="2.5" strokeLinecap="round">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
    </svg>
  )},
  { path: '/library', label: 'Library', icon: (active) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={active?'white':'rgba(255,255,255,0.5)'}>
      <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8 12.5v-9l6 4.5-6 4.5z"/>
    </svg>
  )},
  { path: '/liked',   label: 'Liked',   icon: (active) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={active?'#ff2d55':'rgba(255,255,255,0.5)'}>
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
    </svg>
  )},
];

export default function MobileNav() {
  return (
    <nav className="mobile-nav" style={{
      display:'none',
      background:'var(--bg-secondary)',
      borderTop:'1px solid var(--border)',
      paddingBottom:'env(safe-area-inset-bottom, 0px)',
      justifyContent:'space-around',
      alignItems:'center',
      height: 'var(--mobile-nav-h)',
    }}>
      {NAV.map(({ path, label, icon }) => (
        <NavLink key={path} to={path} style={({ isActive }) => ({
          display:'flex', flexDirection:'column', alignItems:'center',
          gap:3, padding:'6px 16px', textDecoration:'none',
          color: isActive ? 'white' : 'rgba(255,255,255,0.5)',
          transition:'var(--transition)', flex:1, justifyContent:'center'
        })}>
          {({ isActive }) => (
            <>
              {icon(isActive)}
              <span style={{fontSize:10, fontWeight: isActive ? 700 : 400, letterSpacing:0.3}}>
                {label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
