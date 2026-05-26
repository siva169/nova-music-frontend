import React from 'react';
import { NavLink } from 'react-router-dom';

const NAV = [
  { path: '/home',    label: 'Home',    icon: (active) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={active?'white':'rgba(255,255,255,0.5)'}>
      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
    </svg>
  )},
  { path: '/songs',  label: 'Songs',  icon: (active) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active?'white':'rgba(255,255,255,0.5)'} strokeWidth="2.5" strokeLinecap="round">
      <path d="M9 18V5l10-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/>
    </svg>
  )},
  { path: '/folders', label: 'Folders', icon: (active) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={active?'white':'rgba(255,255,255,0.5)'}>
      <path d="M10 4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h6z"/>
    </svg>
  )},
  { path: '/library', label: 'Library', icon: (active) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={active?'white':'rgba(255,255,255,0.5)'}>
      <path d="M4 6h2v14H4zM8 4h12v16H8zM12 8h4v2h-4z"/>
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
