import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useApp } from '../AppContext';
import YouTube from 'react-youtube';

export default function PlayerBar() {
  const {
    currentTrack, isPlaying, setIsPlaying,
    progress, setProgress, duration, setDuration,
    volume, setVolume, isMuted, setIsMuted,
    isShuffled, setIsShuffled, repeatMode, setRepeatMode,
    is8D, setIs8D, start8D, stop8D,
    playerRef, setPlayerReady,
    nextTrack, prevTrack, onTrackEnd,
    toggleLike, likedTracks, playlists, addToPlaylist,
    toast
  } = useApp();

  const progressInterval = useRef(null);
  const [showVolume, setShowVolume] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [showAddTo, setShowAddTo] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [ytKey, setYtKey] = useState(0);

  const isLiked = currentTrack ? likedTracks.some(t => t.id === currentTrack.id) : false;

  // Reset player on track change
  useEffect(() => {
    setYtKey(k => k + 1);
    setProgress(0);
    setDuration(0);
    setPlayerReady(false);
  }, [currentTrack?.id]);

  // Progress polling
  useEffect(() => {
    if (isPlaying && playerRef.current) {
      progressInterval.current = setInterval(() => {
        try {
          const curr = playerRef.current.getCurrentTime?.() || 0;
          const dur = playerRef.current.getDuration?.() || 0;
          setProgress(curr);
          setDuration(dur);
          if (dur > 0 && curr >= dur - 0.5) onTrackEnd();
        } catch {}
      }, 500);
    }
    return () => clearInterval(progressInterval.current);
  }, [isPlaying, currentTrack]);

  useEffect(() => {
    if (!playerRef.current) return;
    try {
      if (isPlaying) playerRef.current.playVideo?.();
      else playerRef.current.pauseVideo?.();
    } catch {}
  }, [isPlaying]);

  useEffect(() => {
    if (!playerRef.current) return;
    try { playerRef.current.setVolume?.((isMuted ? 0 : volume) * 100); } catch {}
  }, [volume, isMuted]);

  useEffect(() => {
    if (is8D) start8D();
    else stop8D();
  }, [is8D]);

  function onReady(e) {
    playerRef.current = e.target;
    setPlayerReady(true);
    e.target.setVolume((isMuted ? 0 : volume) * 100);
    if (isPlaying) e.target.playVideo();
  }

  function seek(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    const newTime = pct * duration;
    setProgress(newTime);
    try { playerRef.current?.seekTo?.(newTime, true); } catch {}
  }

  function fmtTime(s) {
    if (!s || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  }

  const pct = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <>
      {/* Hidden YouTube Player */}
      {currentTrack && (
        <div style={{ position: 'fixed', top: -9999, left: -9999, width: 1, height: 1, overflow: 'hidden', pointerEvents: 'none' }}>
          <YouTube
            key={`${currentTrack.id}-${ytKey}`}
            videoId={currentTrack.id}
            opts={{
              playerVars: {
                autoplay: isPlaying ? 1 : 0,
                controls: 0,
                modestbranding: 1,
                rel: 0,
                origin: window.location.origin
              }
            }}
            onReady={onReady}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnd={onTrackEnd}
          />
        </div>
      )}

      {/* Player Bar */}
      <div style={{
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        gap: 16,
        position: 'relative',
        zIndex: 100
      }}>

        {/* Track Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: 240, flexShrink: 0 }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <img
              src={currentTrack?.thumbnail}
              alt={currentTrack?.title}
              style={{ width: 52, height: 52, borderRadius: 8, objectFit: 'cover', border: isPlaying ? '2px solid var(--accent)' : '2px solid var(--border)' }}
            />
            {isPlaying && (
              <div style={{ position: 'absolute', bottom: 2, right: 2 }}>
                <div className="eq-bars">
                  <span style={{ height: '60%' }} /><span style={{ height: '100%' }} />
                  <span style={{ height: '70%' }} /><span style={{ height: '40%' }} />
                </div>
              </div>
            )}
          </div>
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentTrack?.title}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentTrack?.channel}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <PlayerBtn onClick={() => toggleLike(currentTrack)} title={isLiked ? 'Unlike' : 'Like'}
              color={isLiked ? '#ff2d55' : undefined} size={16}>♥</PlayerBtn>
          </div>
        </div>

        {/* Center Controls */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <PlayerBtn onClick={() => setIsShuffled(s => !s)} title="Shuffle"
              color={isShuffled ? 'var(--accent)' : undefined} size={16}>⇄</PlayerBtn>
            <PlayerBtn onClick={prevTrack} title="Previous" size={20}>⏮</PlayerBtn>
            <button onClick={() => setIsPlaying(p => !p)} style={{
              width: 44, height: 44, borderRadius: '50%',
              background: 'var(--accent)', color: '#000',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, transition: 'var(--transition)', flexShrink: 0,
              boxShadow: 'var(--accent-glow)'
            }}
              onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'}
              onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
            >{isPlaying ? '⏸' : '▶'}</button>
            <PlayerBtn onClick={nextTrack} title="Next" size={20}>⏭</PlayerBtn>
            <PlayerBtn onClick={() => setRepeatMode(m => m === 'none' ? 'all' : m === 'all' ? 'one' : 'none')}
              title={`Repeat: ${repeatMode}`}
              color={repeatMode !== 'none' ? 'var(--accent)' : undefined} size={16}>
              {repeatMode === 'one' ? '⟳¹' : '⟳'}
            </PlayerBtn>
          </div>

          {/* Progress Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', maxWidth: 500 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', minWidth: 35, textAlign: 'right' }}>{fmtTime(progress)}</span>
            <div onClick={seek} style={{
              flex: 1, height: 4, background: 'var(--surface-hover)',
              borderRadius: 99, cursor: 'pointer', position: 'relative'
            }}>
              <div style={{ width: `${pct}%`, height: '100%', background: 'var(--accent)', borderRadius: 99, transition: 'width 0.1s linear' }} />
              <div style={{
                position: 'absolute', top: '50%', left: `${pct}%`,
                transform: 'translate(-50%, -50%)',
                width: 12, height: 12, borderRadius: '50%', background: 'var(--accent)',
                boxShadow: 'var(--accent-glow)', opacity: 0,
                transition: 'opacity 0.2s'
              }} className="progress-thumb" />
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', minWidth: 35 }}>{fmtTime(duration)}</span>
          </div>
        </div>

        {/* Right Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, width: 240, justifyContent: 'flex-end', flexShrink: 0 }}>
          {/* 8D Toggle */}
          <button onClick={() => setIs8D(d => !d)} style={{
            padding: '4px 10px', borderRadius: 99,
            background: is8D ? 'var(--accent)' : 'var(--surface)',
            color: is8D ? '#000' : 'var(--text-secondary)',
            fontSize: 11, fontWeight: 700, letterSpacing: 1,
            border: '1px solid var(--border)',
            transition: 'var(--transition)',
            animation: is8D ? 'glowPulse 2s infinite' : 'none'
          }}>8D</button>

          {/* YouTube Link */}
          <PlayerBtn onClick={() => window.open(`https://youtube.com/watch?v=${currentTrack?.id}`, '_blank')}
            title="View on YouTube" size={15}>▶</PlayerBtn>

          {/* Add to Playlist */}
          <div style={{ position: 'relative' }}>
            <PlayerBtn onClick={() => setShowAddTo(s => !s)} title="Add to playlist" size={16}>⊕</PlayerBtn>
            {showAddTo && (
              <div style={{
                position: 'absolute', bottom: '100%', right: 0, marginBottom: 8,
                background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)', padding: 8, minWidth: 200,
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)', zIndex: 300
              }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', padding: '4px 8px 8px', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>Add to Playlist</div>
                {playlists.map(pl => (
                  <button key={pl.id} onClick={() => { addToPlaylist(pl.id, currentTrack); setShowAddTo(false); }}
                    style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', borderRadius: 8, fontSize: 13, color: 'var(--text-primary)', transition: 'var(--transition)' }}
                    onMouseOver={e => e.currentTarget.style.background = 'var(--surface-hover)'}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                  >{pl.name}</button>
                ))}
                {!playlists.length && <div style={{ padding: '8px 12px', fontSize: 12, color: 'var(--text-muted)' }}>No playlists yet</div>}
              </div>
            )}
          </div>

          {/* Volume */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }}>
            <PlayerBtn onClick={() => setIsMuted(m => !m)} title="Mute" size={16}>
              {isMuted || volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
            </PlayerBtn>
            <input type="range" min={0} max={1} step={0.01} value={isMuted ? 0 : volume}
              onChange={e => { setVolume(parseFloat(e.target.value)); setIsMuted(false); }}
              style={{ width: 70, accentColor: 'var(--accent)', cursor: 'pointer' }} />
          </div>
        </div>
      </div>
    </>
  );
}

function PlayerBtn({ onClick, children, title, color, size = 16 }) {
  return (
    <button onClick={onClick} title={title} style={{
      width: 32, height: 32, borderRadius: '50%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: color || 'var(--text-secondary)', fontSize: size,
      transition: 'var(--transition)', flexShrink: 0
    }}
      onMouseOver={e => { e.currentTarget.style.color = color || 'var(--text-primary)'; e.currentTarget.style.background = 'var(--surface-hover)'; }}
      onMouseOut={e => { e.currentTarget.style.color = color || 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; }}
    >{children}</button>
  );
}
