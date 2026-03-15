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
    toast, queue
  } = useApp();

  const progressInterval = useRef(null);
  const wakeLockRef = useRef(null);
  const [showAddTo, setShowAddTo] = useState(false);
  const [ytKey, setYtKey] = useState(0);
  const [expanded, setExpanded] = useState(false);

  const isLiked = currentTrack ? likedTracks.some(t => t.id === currentTrack.id) : false;

  // ── Reset on track change ──────────────────────────────────────────
  useEffect(() => {
    setYtKey(k => k + 1);
    setProgress(0);
    setDuration(0);
    setPlayerReady(false);
    setExpanded(false);
  }, [currentTrack?.id]);

  // ── Progress polling ───────────────────────────────────────────────
  useEffect(() => {
    if (isPlaying && playerRef.current) {
      progressInterval.current = setInterval(() => {
        try {
          const curr = playerRef.current.getCurrentTime?.() || 0;
          const dur = playerRef.current.getDuration?.() || 0;
          setProgress(curr);
          setDuration(dur);
          // Update media session position
          if ('mediaSession' in navigator && dur > 0) {
            try {
              navigator.mediaSession.setPositionState({
                duration: dur,
                playbackRate: 1,
                position: curr
              });
            } catch {}
          }
          if (dur > 0 && curr >= dur - 0.5) onTrackEnd();
        } catch {}
      }, 500);
    }
    return () => clearInterval(progressInterval.current);
  }, [isPlaying, currentTrack]);

  // ── Play/pause control ─────────────────────────────────────────────
  useEffect(() => {
    if (!playerRef.current) return;
    try {
      if (isPlaying) {
        playerRef.current.playVideo?.();
        requestWakeLock();
      } else {
        playerRef.current.pauseVideo?.();
        releaseWakeLock();
      }
    } catch {}
  }, [isPlaying]);

  // ── Volume control ─────────────────────────────────────────────────
  useEffect(() => {
    if (!playerRef.current) return;
    try { playerRef.current.setVolume?.((isMuted ? 0 : volume) * 100); } catch {}
  }, [volume, isMuted]);

  // ── 8D toggle ─────────────────────────────────────────────────────
  useEffect(() => {
    if (is8D) start8D();
    else stop8D();
  }, [is8D]);

  // ── Wake Lock API (keeps screen active for lock screen controls) ───
  async function requestWakeLock() {
    try {
      if ('wakeLock' in navigator && !wakeLockRef.current) {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
        wakeLockRef.current.addEventListener('release', () => {
          wakeLockRef.current = null;
        });
      }
    } catch {}
  }

  async function releaseWakeLock() {
    try {
      if (wakeLockRef.current) {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
    } catch {}
  }

  // ── Media Session API (lock screen controls) ───────────────────────
  useEffect(() => {
    if (!currentTrack || !('mediaSession' in navigator)) return;

    // Set metadata for lock screen
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: currentTrack.channel,
      album: 'NOVA Music',
      artwork: [
        { src: currentTrack.thumbnail, sizes: '96x96',   type: 'image/jpeg' },
        { src: currentTrack.thumbnail, sizes: '128x128', type: 'image/jpeg' },
        { src: currentTrack.thumbnail, sizes: '256x256', type: 'image/jpeg' },
        { src: currentTrack.thumbnail, sizes: '512x512', type: 'image/jpeg' },
      ]
    });

    // Lock screen action handlers
    navigator.mediaSession.setActionHandler('play', () => {
      setIsPlaying(true);
      playerRef.current?.playVideo?.();
      navigator.mediaSession.playbackState = 'playing';
    });

    navigator.mediaSession.setActionHandler('pause', () => {
      setIsPlaying(false);
      playerRef.current?.pauseVideo?.();
      navigator.mediaSession.playbackState = 'paused';
    });

    navigator.mediaSession.setActionHandler('previoustrack', () => {
      prevTrack();
    });

    navigator.mediaSession.setActionHandler('nexttrack', () => {
      nextTrack();
    });

    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime !== undefined) {
        playerRef.current?.seekTo?.(details.seekTime, true);
        setProgress(details.seekTime);
      }
    });

    navigator.mediaSession.setActionHandler('seekbackward', (details) => {
      const skipTime = details.seekOffset || 10;
      const newTime = Math.max(0, progress - skipTime);
      playerRef.current?.seekTo?.(newTime, true);
      setProgress(newTime);
    });

    navigator.mediaSession.setActionHandler('seekforward', (details) => {
      const skipTime = details.seekOffset || 10;
      const newTime = Math.min(duration, progress + skipTime);
      playerRef.current?.seekTo?.(newTime, true);
      setProgress(newTime);
    });

    navigator.mediaSession.setActionHandler('stop', () => {
      setIsPlaying(false);
      playerRef.current?.stopVideo?.();
    });

    // Set playback state
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

  }, [currentTrack, isPlaying, progress, duration]);

  // ── YouTube player callbacks ───────────────────────────────────────
  function onReady(e) {
    playerRef.current = e.target;
    setPlayerReady(true);
    e.target.setVolume((isMuted ? 0 : volume) * 100);
    if (isPlaying) e.target.playVideo();
  }

  function onStateChange(e) {
    // YT.PlayerState: PLAYING=1, PAUSED=2, ENDED=0, BUFFERING=3
    if (e.data === 1) {
      setIsPlaying(true);
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
    } else if (e.data === 2) {
      setIsPlaying(false);
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
    } else if (e.data === 0) {
      onTrackEnd();
    }
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
                playsinline: 1,
                origin: window.location.origin
              }
            }}
            onReady={onReady}
            onStateChange={onStateChange}
            onEnd={onTrackEnd}
          />
        </div>
      )}

      {/* ── Player Bar ── */}
      <div style={{
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border)',
        display: 'flex', alignItems: 'center',
        padding: '0 16px', gap: 12,
        position: 'relative', zIndex: 100
      }}>

        {/* Progress bar — full width at top of player */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, cursor: 'pointer', background: 'var(--surface)' }}
          onClick={seek}>
          <div style={{ width: `${pct}%`, height: '100%', background: 'var(--accent)', transition: 'width 0.1s linear', borderRadius: '0 2px 2px 0' }} />
        </div>

        {/* Track Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0, cursor: 'pointer' }}
          onClick={() => setExpanded(e => !e)}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <img src={currentTrack?.thumbnail} alt={currentTrack?.title}
              style={{ width: 46, height: 46, borderRadius: 8, objectFit: 'cover', border: isPlaying ? '2px solid var(--accent)' : '2px solid transparent' }} />
            {isPlaying && (
              <div style={{ position: 'absolute', bottom: 2, right: 2 }}>
                <div className="eq-bars" style={{ height: 10 }}><span /><span /><span /></div>
              </div>
            )}
          </div>
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: isPlaying ? 'var(--accent)' : 'var(--text-primary)' }}>
              {currentTrack?.title}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentTrack?.channel}
            </div>
          </div>
        </div>

        {/* Center Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          <PlayerBtn onClick={() => setIsShuffled(s => !s)} title="Shuffle"
            color={isShuffled ? 'var(--accent)' : undefined} size={16}>⇄</PlayerBtn>
          <PlayerBtn onClick={prevTrack} title="Previous" size={20}>⏮</PlayerBtn>
          <button onClick={() => setIsPlaying(p => !p)} style={{
            width: 42, height: 42, borderRadius: '50%',
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
            color={repeatMode !== 'none' ? 'var(--accent)' : undefined} size={14}>
            {repeatMode === 'one' ? '🔂' : '🔁'}
          </PlayerBtn>
        </div>

        {/* Right Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
          {/* Like */}
          <PlayerBtn onClick={() => toggleLike(currentTrack)} title={isLiked ? 'Unlike' : 'Like'}
            color={isLiked ? '#ff2d55' : undefined} size={15}>♥</PlayerBtn>

          {/* 8D */}
          <button onClick={() => setIs8D(d => !d)} style={{
            padding: '4px 8px', borderRadius: 99,
            background: is8D ? 'var(--accent)' : 'var(--surface)',
            color: is8D ? '#000' : 'var(--text-secondary)',
            fontSize: 10, fontWeight: 700, letterSpacing: 1,
            border: '1px solid var(--border)', transition: 'var(--transition)',
          }}>8D</button>

          {/* YouTube link */}
          <PlayerBtn onClick={() => window.open(`https://youtube.com/watch?v=${currentTrack?.id}`, '_blank')}
            title="View on YouTube" size={13}>▶</PlayerBtn>

          {/* Add to playlist */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <PlayerBtn onClick={() => setIsMuted(m => !m)} title="Mute" size={15}>
              {isMuted || volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
            </PlayerBtn>
            <input type="range" min={0} max={1} step={0.01} value={isMuted ? 0 : volume}
              onChange={e => { setVolume(parseFloat(e.target.value)); setIsMuted(false); }}
              style={{ width: 60, accentColor: 'var(--accent)', cursor: 'pointer' }} />
          </div>
        </div>

        {/* Time display */}
        <div style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0, display: 'flex', gap: 4 }}>
          <span>{fmtTime(progress)}</span>
          <span>/</span>
          <span>{fmtTime(duration)}</span>
        </div>
      </div>

      {/* ── Expanded full screen player (mobile) ── */}
      {expanded && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 500,
          background: 'linear-gradient(180deg, #0a0a1a 0%, #050510 100%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '60px 24px 40px', animation: 'fadeIn 0.2s ease'
        }}>
          {/* Close */}
          <button onClick={() => setExpanded(false)} style={{ position: 'absolute', top: 20, left: 20, color: 'var(--text-muted)', fontSize: 22 }}>✕</button>

          {/* Album art */}
          <img src={currentTrack?.thumbnail} alt={currentTrack?.title} style={{
            width: '75vw', maxWidth: 300, aspectRatio: '1',
            borderRadius: 20, objectFit: 'cover',
            boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
            border: '2px solid var(--border-accent)',
            marginBottom: 32
          }} />

          {/* Track info */}
          <div style={{ textAlign: 'center', marginBottom: 24, width: '100%' }}>
            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentTrack?.title}
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>{currentTrack?.channel}</div>
          </div>

          {/* Like button */}
          <button onClick={() => toggleLike(currentTrack)} style={{
            color: isLiked ? '#ff2d55' : 'var(--text-muted)', fontSize: 24,
            position: 'absolute', right: 24, top: '45%', background: 'none', border: 'none', cursor: 'pointer'
          }}>♥</button>

          {/* Progress bar */}
          <div style={{ width: '100%', marginBottom: 8 }}>
            <div onClick={seek} style={{ width: '100%', height: 5, background: 'var(--surface)', borderRadius: 99, cursor: 'pointer', marginBottom: 6 }}>
              <div style={{ width: `${pct}%`, height: '100%', background: 'var(--accent)', borderRadius: 99 }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
              <span>{fmtTime(progress)}</span>
              <span>{fmtTime(duration)}</span>
            </div>
          </div>

          {/* Main controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 32 }}>
            <button onClick={() => setIsShuffled(s => !s)} style={{ color: isShuffled ? 'var(--accent)' : 'var(--text-muted)', fontSize: 20, background: 'none', border: 'none', cursor: 'pointer' }}>⇄</button>
            <button onClick={prevTrack} style={{ color: 'var(--text-primary)', fontSize: 32, background: 'none', border: 'none', cursor: 'pointer' }}>⏮</button>
            <button onClick={() => setIsPlaying(p => !p)} style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'var(--accent)', color: '#000',
              fontSize: 26, display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: 'none', cursor: 'pointer', boxShadow: 'var(--accent-glow)'
            }}>{isPlaying ? '⏸' : '▶'}</button>
            <button onClick={nextTrack} style={{ color: 'var(--text-primary)', fontSize: 32, background: 'none', border: 'none', cursor: 'pointer' }}>⏭</button>
            <button onClick={() => setRepeatMode(m => m === 'none' ? 'all' : m === 'all' ? 'one' : 'none')} style={{ color: repeatMode !== 'none' ? 'var(--accent)' : 'var(--text-muted)', fontSize: 20, background: 'none', border: 'none', cursor: 'pointer' }}>
              {repeatMode === 'one' ? '🔂' : '🔁'}
            </button>
          </div>

          {/* Extra controls */}
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <button onClick={() => setIs8D(d => !d)} style={{
              padding: '8px 16px', borderRadius: 99,
              background: is8D ? 'var(--accent)' : 'var(--surface)',
              color: is8D ? '#000' : 'var(--text-secondary)',
              fontSize: 12, fontWeight: 700, border: '1px solid var(--border)', cursor: 'pointer'
            }}>🎧 8D</button>
            <button onClick={() => setIsMuted(m => !m)} style={{ color: 'var(--text-muted)', fontSize: 20, background: 'none', border: 'none', cursor: 'pointer' }}>
              {isMuted ? '🔇' : '🔊'}
            </button>
            <input type="range" min={0} max={1} step={0.01} value={isMuted ? 0 : volume}
              onChange={e => { setVolume(parseFloat(e.target.value)); setIsMuted(false); }}
              style={{ width: 100, accentColor: 'var(--accent)' }} />
          </div>
        </div>
      )}
    </>
  );
}

function PlayerBtn({ onClick, children, title, color, size = 16 }) {
  return (
    <button onClick={onClick} title={title} style={{
      width: 30, height: 30, borderRadius: '50%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: color || 'var(--text-secondary)', fontSize: size,
      transition: 'var(--transition)', flexShrink: 0, border: 'none',
      background: 'transparent', cursor: 'pointer'
    }}
      onMouseOver={e => { e.currentTarget.style.color = color || 'var(--text-primary)'; e.currentTarget.style.background = 'var(--surface-hover)'; }}
      onMouseOut={e => { e.currentTarget.style.color = color || 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; }}
    >{children}</button>
  );
}
