import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApp, API } from '../AppContext';

// ── Library Page ──────────────────────────────────────────────────
export function LibraryPage() {
  const { playlists, createPlaylist, likedTracks } = useApp();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');

  async function handleCreate(e) {
    e.preventDefault();
    if (!name.trim()) return;
    const pl = await createPlaylist(name.trim());
    setName(''); setShowCreate(false);
    if (pl) navigate(`/playlist/${pl.id}`);
  }

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>Your Library</h1>
        <button onClick={() => setShowCreate(s => !s)} className="btn-accent" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          + New Playlist
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-accent)', borderRadius: 'var(--radius-md)', padding: 20, marginBottom: 20, animation: 'fadeIn 0.2s ease' }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--accent)' }}>Create New Playlist</div>
          <input
            value={name} onChange={e => setName(e.target.value)}
            placeholder="Playlist name..." autoFocus
            style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: 14, marginBottom: 12, outline: 'none' }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" className="btn-accent">Create</button>
            <button type="button" className="btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
          </div>
        </form>
      )}

      {/* Liked Songs card */}
      <Link to="/liked" style={{ display: 'block', background: 'linear-gradient(135deg, #ff2d5533, #ff2d5508)', border: '1px solid #ff2d5544', borderRadius: 'var(--radius-md)', padding: 20, marginBottom: 12, textDecoration: 'none', transition: 'var(--transition)' }}
        onMouseOver={e => e.currentTarget.style.background = 'linear-gradient(135deg, #ff2d5550, #ff2d5515)'}
        onMouseOut={e => e.currentTarget.style.background = 'linear-gradient(135deg, #ff2d5533, #ff2d5508)'}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: 12, background: 'linear-gradient(135deg, #ff2d55, #ff6b6b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>♥</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Liked Songs</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{likedTracks.length} songs</div>
          </div>
        </div>
      </Link>

      {/* Playlists */}
      <div style={{ display: 'grid', gap: 8 }}>
        {playlists.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>♫</div>
            <div>No playlists yet. Create your first one!</div>
          </div>
        ) : playlists.map(pl => (
          <Link key={pl.id} to={`/playlist/${pl.id}`} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', textDecoration: 'none', transition: 'var(--transition)' }}
            onMouseOver={e => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.borderColor = 'var(--border-accent)'; }}
            onMouseOut={e => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            <div style={{ width: 52, height: 52, borderRadius: 10, background: pl.coverColor || 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>♫</div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pl.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{pl.tracks?.length || 0} songs{pl.isPublic ? ' · Shared' : ''}</div>
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: 18 }}>›</div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ── Liked Songs Page ──────────────────────────────────────────────
export function LikedPage() {
  const { likedTracks, playTrack } = useApp();

  function playAll(shuffle = false) {
    if (!likedTracks.length) return;
    const q = shuffle ? [...likedTracks].sort(() => Math.random() - 0.5) : likedTracks;
    playTrack(q[0], q, 0);
  }

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={{ background: 'linear-gradient(135deg, #ff2d5522, transparent)', borderRadius: 'var(--radius-xl)', padding: '28px', marginBottom: 24 }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>♥</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>Liked Songs</h1>
        <div style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>{likedTracks.length} songs</div>
        {likedTracks.length > 0 && (
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => playAll(false)} className="btn-accent">▶ Play All</button>
            <button onClick={() => playAll(true)} className="btn-ghost">⇄ Shuffle</button>
          </div>
        )}
      </div>
      <div>
        {likedTracks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>♥</div>
            <div>Songs you like will appear here</div>
          </div>
        ) : likedTracks.map((t, i) => (
          <TrackCompact key={t.id} track={t} queue={likedTracks} index={i} />
        ))}
      </div>
    </div>
  );
}

// ── Playlist Page ─────────────────────────────────────────────────
// FIXED: Use useParams() instead of parsing window.location manually
export function PlaylistPage() {
  const { id } = useParams();
  const { playlists, fetchPlaylists, playTrack, toast } = useApp();
  const navigate = useNavigate();
  const [shareUrl, setShareUrl] = useState('');

  const playlist = playlists.find(p => p.id === id);

  if (!playlist) return (
    <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-muted)' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>🤔</div>
      <div>Playlist not found</div>
    </div>
  );

  async function share() {
    try {
      const r = await API.post(`/api/playlists/${playlist.id}/share`);
      setShareUrl(r.data.shareUrl);
      try { await navigator.clipboard.writeText(r.data.shareUrl); } catch {}
      toast('Share link copied! 🔗');
    } catch { toast('Error sharing', 'error'); }
  }

  async function deletePlaylist() {
    if (!window.confirm(`Delete "${playlist.name}"?`)) return;
    try {
      await API.delete(`/api/playlists/${playlist.id}`);
      fetchPlaylists();
      navigate('/library');
      toast('Playlist deleted');
    } catch { toast('Error deleting', 'error'); }
  }

  async function removeTrack(track) {
    try {
      await API.delete(`/api/playlists/${playlist.id}/tracks/${track.id}`);
      fetchPlaylists();
      toast('Removed from playlist');
    } catch { toast('Error removing track', 'error'); }
  }

  function playAll(shuffle = false) {
    if (!playlist.tracks?.length) return;
    const q = shuffle ? [...playlist.tracks].sort(() => Math.random() - 0.5) : playlist.tracks;
    playTrack(q[0], q, 0);
  }

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={{ background: `linear-gradient(135deg, ${playlist.coverColor || 'var(--accent)'}22, transparent)`, borderRadius: 'var(--radius-xl)', padding: 28, marginBottom: 24 }}>
        <div style={{ width: 80, height: 80, borderRadius: 16, background: playlist.coverColor || 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, marginBottom: 12 }}>♫</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>{playlist.name}</h1>
        {playlist.description && <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 8 }}>{playlist.description}</p>}
        <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>
          {playlist.tracks?.length || 0} songs{playlist.isPublic ? ' · Public' : ' · Private'}
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {(playlist.tracks?.length > 0) && <>
            <button onClick={() => playAll(false)} className="btn-accent">▶ Play</button>
            <button onClick={() => playAll(true)} className="btn-ghost">⇄ Shuffle</button>
          </>}
          <button onClick={share} className="btn-ghost">🔗 Share</button>
          <button onClick={deletePlaylist} className="btn-ghost" style={{ color: '#ff2d55' }}>🗑 Delete</button>
        </div>
        {shareUrl && (
          <div style={{ marginTop: 12, fontSize: 12, color: 'var(--accent)', background: 'var(--accent-dim)', padding: '8px 14px', borderRadius: 8, wordBreak: 'break-all' }}>
            🔗 {shareUrl}
          </div>
        )}
      </div>
      <div>
        {(!playlist.tracks?.length) ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>♫</div>
            <div>Add songs by right-clicking any track</div>
          </div>
        ) : playlist.tracks.map((t, i) => (
          <TrackCompact key={`${t.id}-${i}`} track={t} queue={playlist.tracks} index={i} onRemove={removeTrack} />
        ))}
      </div>
    </div>
  );
}

// ── Shared Playlist Page ──────────────────────────────────────────
// FIXED: Use useParams() instead of parsing window.location
export function SharedPage() {
  const { shareId } = useParams();
  const { playTrack } = useApp();
  const [playlist, setPlaylist] = React.useState(null);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    if (!shareId) return;
    API.get(`/api/shared/${shareId}`)
      .then(r => setPlaylist(r.data.playlist))
      .catch(() => setError('Playlist not found or link expired'));
  }, [shareId]);

  if (error) return (
    <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-muted)' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>🔗</div>
      <div>{error}</div>
    </div>
  );

  if (!playlist) return (
    <div style={{ textAlign: 'center', padding: 80 }}>
      <div style={{ width: 36, height: 36, border: '3px solid var(--border)', borderTop: '3px solid var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
      <div style={{ marginTop: 16, color: 'var(--text-muted)', fontSize: 13 }}>Loading playlist...</div>
    </div>
  );

  return (
    <div style={{ animation: 'fadeIn 0.3s ease', maxWidth: 800, margin: '0 auto' }}>
      <div style={{ padding: 28, marginBottom: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>♫</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>{playlist.name}</h1>
        <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>{playlist.tracks?.length || 0} songs · Shared playlist</div>
        {playlist.tracks?.length > 0 && (
          <button onClick={() => playTrack(playlist.tracks[0], playlist.tracks, 0)} className="btn-accent">
            ▶ Play All
          </button>
        )}
      </div>
      {(playlist.tracks || []).map((t, i) => (
        <TrackCompact key={`${t.id}-${i}`} track={t} queue={playlist.tracks} index={i} />
      ))}
    </div>
  );
}

// ── Settings Page ─────────────────────────────────────────────────
export function SettingsPage() {
  const { user, theme, accent, saveSettings, logout } = useApp();
  const [localTheme, setLocalTheme] = useState(theme);
  const [localAccent, setLocalAccent] = useState(accent);
  const [saved, setSaved] = useState(false);

  function apply() {
    saveSettings(localTheme, localAccent);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const ACCENTS = [
    { id: 'cyan',   color: '#00d4ff', label: 'Cyan'   },
    { id: 'red',    color: '#ff2d55', label: 'Red'    },
    { id: 'green',  color: '#00ff88', label: 'Green'  },
    { id: 'blue',   color: '#4c9eff', label: 'Blue'   },
    { id: 'yellow', color: '#ffd60a', label: 'Yellow' },
    { id: 'purple', color: '#bf5af2', label: 'Purple' },
  ];

  return (
    <div style={{ animation: 'fadeIn 0.3s ease', maxWidth: 600 }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24 }}>Settings</h1>

      <Section title="Profile">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <img src={user?.picture} alt={user?.name} style={{ width: 60, height: 60, borderRadius: '50%', border: '3px solid var(--accent)' }} />
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{user?.name}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{user?.email}</div>
          </div>
        </div>
      </Section>

      <Section title="Theme Mode">
        <div style={{ display: 'flex', gap: 10 }}>
          {['dark', 'light'].map(t => (
            <button key={t} onClick={() => setLocalTheme(t)} style={{
              padding: '10px 24px', borderRadius: 99, fontWeight: 600, fontSize: 13,
              border: '2px solid', borderColor: localTheme === t ? 'var(--accent)' : 'var(--border)',
              background: localTheme === t ? 'var(--accent-dim)' : 'transparent',
              color: localTheme === t ? 'var(--accent)' : 'var(--text-secondary)',
              transition: 'var(--transition)', textTransform: 'capitalize', cursor: 'pointer',
            }}>
              {t === 'dark' ? '🌙 Dark' : '☀️ Light'}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Accent Color">
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {ACCENTS.map(({ id, color, label }) => (
            <button key={id} onClick={() => setLocalAccent(id)} title={label} style={{
              width: 40, height: 40, borderRadius: '50%', background: color, cursor: 'pointer',
              border: localAccent === id ? '3px solid white' : '3px solid transparent',
              outline: localAccent === id ? `3px solid ${color}` : 'none',
              transition: 'var(--transition)',
              transform: localAccent === id ? 'scale(1.15)' : 'scale(1)',
            }} />
          ))}
        </div>
        <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
          Selected: {ACCENTS.find(a => a.id === localAccent)?.label}
        </div>
      </Section>

      <button onClick={apply} className="btn-accent" style={{ marginBottom: 24, minWidth: 140 }}>
        {saved ? '✓ Saved!' : 'Save Changes'}
      </button>

      <Section title="Account">
        <button onClick={logout} style={{
          padding: '10px 24px', borderRadius: 99,
          background: 'rgba(255,45,85,0.1)', border: '1px solid #ff2d5544',
          color: '#ff2d55', fontWeight: 600, fontSize: 13, cursor: 'pointer',
          transition: 'var(--transition)',
        }}
          onMouseOver={e => e.currentTarget.style.background = 'rgba(255,45,85,0.2)'}
          onMouseOut={e => e.currentTarget.style.background = 'rgba(255,45,85,0.1)'}
        >Sign Out</button>
      </Section>
    </div>
  );
}

// ── Shared components ─────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 20, marginBottom: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>{title}</div>
      {children}
    </div>
  );
}

function TrackCompact({ track, queue, index, onRemove }) {
  const { playTrack, currentTrack, isPlaying, toggleLike, likedTracks, playlists, addToPlaylist, toast } = useApp();
  const [showMenu, setShowMenu] = useState(false);
  const isCurrentTrack = currentTrack?.id === track.id;
  const isLiked = likedTracks.some(t => t.id === track.id);

  return (
    <div
      onClick={() => playTrack(track, queue, index)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 12px', borderRadius: 'var(--radius-sm)',
        cursor: 'pointer', transition: 'var(--transition)',
        background: isCurrentTrack ? 'var(--accent-dim)' : 'transparent', marginBottom: 2,
      }}
      onMouseOver={e => { if (!isCurrentTrack) e.currentTarget.style.background = 'var(--surface-hover)'; }}
      onMouseOut={e => { if (!isCurrentTrack) e.currentTarget.style.background = isCurrentTrack ? 'var(--accent-dim)' : 'transparent'; }}
    >
      <div style={{ width: 44, height: 44, borderRadius: 8, overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
        <img src={track.thumbnail} alt={track.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        {isCurrentTrack && isPlaying && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="eq-bars" style={{ height: 14 }}><span /><span /><span /></div>
          </div>
        )}
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: isCurrentTrack ? 'var(--accent)' : 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {track.title}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{track.channel}</div>
      </div>
      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
        <button
          onClick={e => { e.stopPropagation(); toggleLike(track); }}
          style={{ color: isLiked ? '#ff2d55' : 'var(--text-muted)', fontSize: 14, padding: 6, background: 'none', border: 'none', cursor: 'pointer' }}
        >♥</button>
        <button
          onClick={e => { e.stopPropagation(); window.open(`https://youtube.com/watch?v=${track.id}`, '_blank'); }}
          style={{ color: 'var(--text-muted)', fontSize: 12, padding: 6, background: 'none', border: 'none', cursor: 'pointer' }}
        >▶ YT</button>
        {onRemove && (
          <button
            onClick={e => { e.stopPropagation(); onRemove(track); }}
            style={{ color: 'var(--text-muted)', fontSize: 14, padding: 6, background: 'none', border: 'none', cursor: 'pointer' }}
          >✕</button>
        )}
      </div>
    </div>
  );
}
