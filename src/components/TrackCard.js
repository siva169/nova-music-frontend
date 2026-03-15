import React, { useState } from 'react';
import { useApp } from '../AppContext';
import TrackInfoModal from './TrackInfoModal';

export default function TrackCard({ track, queue = [], index = 0, compact = false, onRemove }) {
  const { playTrack, currentTrack, isPlaying, toggleLike, likedTracks, playlists, addToPlaylist } = useApp();
  const [showInfo, setShowInfo] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });

  const isCurrentTrack = currentTrack?.id === track.id;
  const isLiked = likedTracks.some(t => t.id === track.id);

  function play(e) {
    e.stopPropagation();
    playTrack(track, queue.length ? queue : [track], index);
  }

  function openMenu(e) {
    e.stopPropagation();
    e.preventDefault();
    setMenuPos({ x: e.clientX, y: e.clientY });
    setShowMenu(true);
  }

  if (compact) {
    return (
      <>
        <div onClick={() => setShowInfo(true)} style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
          borderRadius: 'var(--radius-sm)', cursor: 'pointer', transition: 'var(--transition)',
          background: isCurrentTrack ? 'var(--accent-dim)' : 'transparent'
        }}
          onMouseOver={e => { if (!isCurrentTrack) e.currentTarget.style.background = 'var(--surface-hover)'; }}
          onMouseOut={e => { if (!isCurrentTrack) e.currentTarget.style.background = isCurrentTrack ? 'var(--accent-dim)' : 'transparent'; }}
          onContextMenu={openMenu}
        >
          <div style={{ width: 42, height: 42, borderRadius: 6, position: 'relative', flexShrink: 0, overflow: 'hidden' }}>
            <img src={track.thumbnail} alt={track.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            {isCurrentTrack && isPlaying && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="eq-bars"><span /><span /><span /><span /></div>
              </div>
            )}
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: 13, fontWeight: isCurrentTrack ? 700 : 500, color: isCurrentTrack ? 'var(--accent)' : 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {track.title}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {track.channel}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <button onClick={e => { e.stopPropagation(); play(e); }} style={{ color: 'var(--text-muted)', fontSize: 14, padding: 6 }}>▶</button>
            <button onClick={e => { e.stopPropagation(); toggleLike(track); }} style={{ color: isLiked ? '#ff2d55' : 'var(--text-muted)', fontSize: 14, padding: 4 }}>♥</button>
            <button onClick={openMenu} style={{ color: 'var(--text-muted)', fontSize: 18, padding: 4 }}>⋯</button>
          </div>
        </div>
        {showMenu && (
          <ContextMenu track={track} pos={menuPos} onClose={() => setShowMenu(false)}
            playlists={playlists} addToPlaylist={addToPlaylist}
            toggleLike={toggleLike} isLiked={isLiked} onRemove={onRemove}
            onInfo={() => setShowInfo(true)} />
        )}
        {showInfo && <TrackInfoModal track={track} onClose={() => setShowInfo(false)} />}
      </>
    );
  }

  return (
    <>
      <div onClick={() => setShowInfo(true)} onContextMenu={openMenu} style={{
        background: 'var(--bg-card)', borderRadius: 'var(--radius-md)',
        overflow: 'hidden', cursor: 'pointer', transition: 'var(--transition)',
        border: isCurrentTrack ? '1px solid var(--border-accent)' : '1px solid var(--border)',
        animation: 'fadeIn 0.3s ease'
      }}
        onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.3)'; }}
        onMouseOut={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
      >
        <div style={{ position: 'relative', paddingBottom: '56.25%', overflow: 'hidden' }}>
          <img src={track.thumbnail} alt={track.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          {isCurrentTrack && isPlaying && (
            <div style={{ position: 'absolute', top: 8, left: 8, background: 'var(--accent)', borderRadius: 99, padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <div className="eq-bars" style={{ height: 12 }}><span /><span /><span /></div>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#000' }}>PLAYING</span>
            </div>
          )}
          {/* Play button overlay */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0)', transition: 'background 0.2s' }}
            className="play-overlay">
            <button onClick={play} style={{
              width: 44, height: 44, borderRadius: '50%',
              background: 'var(--accent)', color: '#000',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, opacity: 0, transition: 'opacity 0.2s',
              boxShadow: 'var(--accent-glow)'
            }} className="play-btn">▶</button>
          </div>
          <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 4 }}>
            <button onClick={e => { e.stopPropagation(); toggleLike(track); }} style={{
              background: 'rgba(0,0,0,0.6)', borderRadius: '50%', width: 28, height: 28,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: isLiked ? '#ff2d55' : '#fff', fontSize: 13
            }}>♥</button>
            <button onClick={openMenu} style={{
              background: 'rgba(0,0,0,0.6)', borderRadius: '50%', width: 28, height: 28,
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 16
            }}>⋯</button>
          </div>
        </div>
        <div style={{ padding: '10px 12px 12px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: isCurrentTrack ? 'var(--accent)' : 'var(--text-primary)' }}>
            {track.title}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>{track.channel}</div>

        </div>
      </div>
      {showMenu && (
        <ContextMenu track={track} pos={menuPos} onClose={() => setShowMenu(false)}
          playlists={playlists} addToPlaylist={addToPlaylist}
          toggleLike={toggleLike} isLiked={isLiked} onRemove={onRemove}
          onInfo={() => setShowInfo(true)} />
      )}
      {showInfo && <TrackInfoModal track={track} onClose={() => setShowInfo(false)} />}

      <style>{`
        div:hover .play-overlay { background: rgba(0,0,0,0.3) !important; }
        div:hover .play-btn { opacity: 1 !important; }
      `}</style>
    </>
  );
}

function ContextMenu({ track, pos, onClose, playlists, addToPlaylist, toggleLike, isLiked, onRemove, onInfo }) {
  const adjustedPos = {
    x: Math.min(pos.x, window.innerWidth - 220),
    y: Math.min(pos.y, window.innerHeight - 300)
  };

  React.useEffect(() => {
    const close = () => onClose();
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  return (
    <div style={{
      position: 'fixed', top: adjustedPos.y, left: adjustedPos.x,
      background: 'var(--bg-elevated)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)', padding: 8, minWidth: 200, zIndex: 9000,
      boxShadow: '0 16px 48px rgba(0,0,0,0.5)', animation: 'fadeIn 0.15s ease'
    }} onClick={e => e.stopPropagation()}>
      <MenuItem onClick={() => { onInfo(); onClose(); }} icon="ℹ">View Info & Download</MenuItem>
      <MenuItem onClick={() => { toggleLike(track); onClose(); }} icon={isLiked ? '💔' : '♥'}>
        {isLiked ? 'Remove from Liked' : 'Add to Liked Songs'}
      </MenuItem>
      <MenuItem onClick={() => { window.open(`https://youtube.com/watch?v=${track.id}`, '_blank'); onClose(); }} icon="▶">
        View on YouTube
      </MenuItem>
      <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
      <div style={{ fontSize: 11, color: 'var(--text-muted)', padding: '4px 12px 8px', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>Add to Playlist</div>
      {playlists.map(pl => (
        <MenuItem key={pl.id} onClick={() => { addToPlaylist(pl.id, track); onClose(); }} icon="⊕">
          {pl.name}
        </MenuItem>
      ))}
      {!playlists.length && <div style={{ padding: '8px 12px', fontSize: 12, color: 'var(--text-muted)' }}>No playlists yet</div>}
      {onRemove && (
        <>
          <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
          <MenuItem onClick={() => { onRemove(track); onClose(); }} icon="✕" color="#ff2d55">
            Remove from playlist
          </MenuItem>
        </>
      )}
    </div>
  );
}

function MenuItem({ onClick, icon, children, color }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick}
      onMouseOver={() => setHov(true)}
      onMouseOut={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, width: '100%',
        padding: '9px 12px', borderRadius: 8, fontSize: 13,
        color: color || 'var(--text-primary)',
        background: hov ? 'var(--surface-hover)' : 'transparent',
        transition: 'background 0.15s', textAlign: 'left'
      }}>
      <span style={{ width: 16, textAlign: 'center', flexShrink: 0 }}>{icon}</span>
      {children}
    </button>
  );
}
