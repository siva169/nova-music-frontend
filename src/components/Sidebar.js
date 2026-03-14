import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext';
import { NovaLogoSidebar } from './NovaLogo';

const NAV = [
  { path: '/home', icon: '⌂', label: 'Home' },
  { path: '/search', icon: '⌕', label: 'Search' },
  { path: '/library', icon: '⊞', label: 'Library' },
  { path: '/liked', icon: '♥', label: 'Liked Songs' },
];

export default function Sidebar() {
  const { user, playlists, logout, sidebarOpen, setSidebarOpen, createPlaylist } = useApp();
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');

  async function handleCreate(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    const pl = await createPlaylist(newName.trim());
    setNewName(''); setCreating(false);
    if (pl) navigate(`/playlist/${pl.id}`);
  }

  return (
    <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`} style={{
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      height: '100%', overflow: 'hidden'
    }}>
      {/* Logo */}
      <div style={{ padding: '18px 20px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <NovaLogoSidebar />
          <div>
            <div style={{
              fontFamily: "'Bebas Neue', sans-serif", fontSize: 26,
              letterSpacing: 4, lineHeight: 1,
              background: 'linear-gradient(135deg, #ffffff 0%, var(--accent) 60%, #bf5af2 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
            }}>NOVA</div>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1.5, marginTop: 1 }}>
              UNIVERSE OF SOUND
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: '12px 12px 0' }}>
        {NAV.map(({ path, icon, label }) => (
          <NavLink key={path} to={path} onClick={() => setSidebarOpen(false)}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 12px', borderRadius: 'var(--radius-sm)',
              marginBottom: 2, transition: 'var(--transition)',
              color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
              background: isActive ? 'var(--accent-dim)' : 'transparent',
              fontWeight: isActive ? 600 : 400, fontSize: 14, textDecoration: 'none'
            })}>
            <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Playlists */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', marginTop: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px' }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Playlists</span>
          <button onClick={() => setCreating(true)}
            style={{ color: 'var(--text-muted)', fontSize: 20, lineHeight: 1, padding: '0 4px', transition: 'var(--transition)' }}
            onMouseOver={e => e.target.style.color = 'var(--accent)'}
            onMouseOut={e => e.target.style.color = 'var(--text-muted)'}
          >+</button>
        </div>

        {creating && (
          <form onSubmit={handleCreate} style={{ padding: '0 12px 8px' }}>
            <input autoFocus value={newName} onChange={e => setNewName(e.target.value)}
              placeholder="Playlist name..."
              onBlur={() => { if (!newName) setCreating(false); }}
              style={{
                width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-elevated)', border: '1px solid var(--border-accent)',
                color: 'var(--text-primary)', fontSize: 13, outline: 'none'
              }} />
          </form>
        )}

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px' }}>
          {playlists.map(pl => (
            <NavLink key={pl.id} to={`/playlist/${pl.id}`} onClick={() => setSidebarOpen(false)}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 12px', borderRadius: 'var(--radius-sm)',
                marginBottom: 2, transition: 'var(--transition)',
                color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                background: isActive ? 'var(--accent-dim)' : 'transparent',
                fontSize: 13, textDecoration: 'none'
              })}>
              <div style={{
                width: 28, height: 28, borderRadius: 6, flexShrink: 0,
                background: pl.coverColor || 'var(--accent-dim)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12
              }}>♫</div>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pl.name}</span>
            </NavLink>
          ))}
          {playlists.length === 0 && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '12px', textAlign: 'center', lineHeight: 1.6 }}>
              No playlists yet<br/>Press + to create one
            </div>
          )}
        </div>
      </div>

      {/* User */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <img src={user?.picture} alt={user?.name} style={{ width: 34, height: 34, borderRadius: '50%', border: '2px solid var(--accent)' }} />
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
          <NavLink to="/settings" style={{ fontSize: 11, color: 'var(--text-muted)' }}>Settings</NavLink>
        </div>
        <button onClick={logout} title="Sign out"
          style={{ color: 'var(--text-muted)', fontSize: 16, transition: 'var(--transition)' }}
          onMouseOver={e => e.target.style.color = '#ff2d55'}
          onMouseOut={e => e.target.style.color = 'var(--text-muted)'}
        >⏏</button>
      </div>
    </aside>
  );
}
