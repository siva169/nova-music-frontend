import React from 'react';
import { NavLink } from 'react-router-dom';

const NAV = [
  { path: '/home',    label: 'Home',    icon: (active) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={active?'white':'rgba(255,255,255,0.5)'}>
      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
    </svg>
  )},
  { path: '/youtube', label: 'YouTube', icon: (active) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={active?'#ff3333':'rgba(255,255,255,0.5)'}>
      <path d="M21.8 8s-.2-1.4-.8-2c-.8-.8-1.6-.8-2-.9C16.2 5 12 5 12 5s-4.2 0-7 .1c-.4.1-1.2.1-2 .9-.6.6-.8 2-.8 2S2 9.6 2 11.2v1.5c0 1.6.2 3.2.2 3.2s.2 1.4.8 2c.8.8 1.8.8 2.2.8C6.8 19 12 19 12 19s4.2 0 7-.2c.4-.1 1.2-.1 2-.9.6-.6.8-2 .8-2s.2-1.6.2-3.2v-1.5C22 9.6 21.8 8 21.8 8zM10 14.5v-5l5.5 2.5L10 14.5z"/>
    </svg>
  )},
  { path: '/songs',  label: 'Songs',  icon: (active) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active?'white':'rgba(255,255,255,0.5)'} strokeWidth="2.5" strokeLinecap="round">
      <path d="M9 18V5l10-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/>
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
