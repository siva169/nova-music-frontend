import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useApp } from '../AppContext';
import TrackInfoModal from './TrackInfoModal';

export default function PlayerBar() {
  const {
    currentTrack, isPlaying, setIsPlaying,
    progress, setProgress, duration, setDuration,
    volume, setVolume, isMuted, setIsMuted,
    isShuffled, setIsShuffled, repeatMode, setRepeatMode,
    playerRef, setPlayerReady,
    nextTrack, prevTrack, onTrackEnd,
    toggleLike, likedTracks,
    toast, API
  } = useApp();

  const audioRef = useRef(null);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [streamUrl, setStreamUrl] = useState(null);
  const isLiked = currentTrack ? likedTracks.some(t => t.id === currentTrack.id) : false;

  // ── Fetch stream URL from backend when track changes ──────────────────
  useEffect(() => {
    if (!currentTrack?.id) return;
    setStreamUrl(null);
    setLoading(true);
    setProgress(0);
    setDuration(0);
    setPlayerReady(false);

    API.get(`/api/stream/${currentTrack.id}`)
      .then(r => {
        setStreamUrl(r.data.url);
        setPlayerReady(true);
      })
      .catch(() => {
        // Fallback to proxy endpoint
        setStreamUrl(`https://nova-music-backend-production.up.railway.app/api/proxy/${currentTrack.id}`);
        setPlayerReady(true);
      })
      .finally(() => setLoading(false));
  }, [currentTrack?.id]);

  // ── Expose audio element via playerRef for MediaSession ───────────────
  useEffect(() => {
    if (audioRef.current) {
      // Make playerRef compatible with existing code
      playerRef.current = {
        playVideo: () => audioRef.current?.play(),
        pauseVideo: () => audioRef.current?.pause(),
        seekTo: (t) => { if (audioRef.current) audioRef.current.currentTime = t; },
        getCurrentTime: () => audioRef.current?.currentTime || 0,
        getDuration: () => audioRef.current?.duration || 0,
        getPlayerState: () => audioRef.current?.paused ? 2 : 1,
        setVolume: (v) => { if (audioRef.current) audioRef.current.volume = v / 100; },
      };
    }
  }, [audioRef.current]);

  // ── Play/pause control ─────────────────────────────────────────────────
  useEffect(() => {
    if (!audioRef.current || !streamUrl) return;
    if (isPlaying) {
      audioRef.current.play().catch(() => setIsPlaying(false));
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, streamUrl]);

  // ── Volume control ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  // ── Audio event handlers ───────────────────────────────────────────────
  function onAudioReady() {
    setDuration(audioRef.current?.duration || 0);
    if (isPlaying) audioRef.current?.play().catch(() => {});
  }

  function onTimeUpdate() {
    if (!audioRef.current) return;
    setProgress(audioRef.current.currentTime);
    setDuration(audioRef.current.duration || 0);
  }

  function onAudioEnded() {
    onTrackEnd();
  }

  function onAudioError() {
    // Fallback to proxy if direct stream fails
    if (streamUrl && !streamUrl.includes('/api/proxy/')) {
      setStreamUrl(`https://nova-music-backend-production.up.railway.app/api/proxy/${currentTrack?.id}`);
    } else {
      toast('Could not load audio', 'error');
      setIsPlaying(false);
    }
  }

  function seek(e) {
    if (!duration || !audioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    const newTime = Math.max(0, Math.min(duration, pct * duration));
    audioRef.current.currentTime = newTime;
    setProgress(newTime);
  }

  function fmtTime(s) {
    if (!s || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  }

  const pct = duration > 0 ? Math.min(100, (progress / duration) * 100) : 0;

  return (
    <>
      {/* ── HTML5 Audio Element (replaces YouTube iframe) ── */}
      {streamUrl && (
        <audio
          ref={audioRef}
          src={streamUrl}
          onLoadedMetadata={onAudioReady}
          onTimeUpdate={onTimeUpdate}
          onEnded={onAudioEnded}
          onError={onAudioError}
          preload="auto"
          playsInline
          style={{ display: 'none' }}
        />
      )}

      {/* ── Player Bar ── */}
      <div className="player-bar" style={{
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        position: 'relative', zIndex: 100,
        userSelect: 'none'
      }}>
        {/* Progress bar */}
        <div onClick={seek} style={{
          height: 3, background: 'var(--surface)', cursor: 'pointer',
          flexShrink: 0, position: 'relative'
        }}
          onMouseOver={e => e.currentTarget.style.height = '5px'}
          onMouseOut={e => e.currentTarget.style.height = '3px'}
        >
          <div style={{ width: `${pct}%`, height: '100%', background: 'var(--accent)', transition: 'width 0.1s linear', borderRadius: '0 2px 2px 0' }} />
        </div>

        {/* Main controls */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 16px', height: 77, gap: 12 }}>

          {/* Track info */}
          <div onClick={() => setShowFullscreen(true)} style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0, cursor: 'pointer' }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <img src={currentTrack?.thumbnail} alt={currentTrack?.title}
                style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', border: isPlaying ? '2px solid var(--accent)' : '2px solid transparent' }} />
              {loading && (
                <div style={{ position: 'absolute', inset: 0, borderRadius: 8, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 16, height: 16, border: '2px solid transparent', borderTop: '2px solid var(--accent)', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                </div>
              )}
              {isPlaying && !loading && (
                <div style={{ position: 'absolute', inset: 0, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div className="eq-bars" style={{ height: 12 }}><span /><span /><span /></div>
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

          {/* Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <Btn onClick={() => toggleLike(currentTrack)} color={isLiked ? '#ff2d55' : undefined} size={16}>♥</Btn>
            <Btn onClick={prevTrack} size={20}>⏮</Btn>
            <button onClick={() => setIsPlaying(p => !p)} style={{
              width: 40, height: 40, borderRadius: '50%',
              background: 'var(--accent)', color: '#000',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: 'none', cursor: 'pointer',
              fontSize: 18, transition: 'var(--transition)', flexShrink: 0,
              boxShadow: 'var(--accent-glow)'
            }}>{isPlaying ? '⏸' : '▶'}</button>
            <Btn onClick={nextTrack} size={20}>⏭</Btn>
            <Btn onClick={() => setIsShuffled(s => !s)} color={isShuffled ? 'var(--accent)' : undefined} size={14}>⇄</Btn>
            <Btn onClick={() => setRepeatMode(m => m === 'none' ? 'all' : m === 'all' ? 'one' : 'none')}
              color={repeatMode !== 'none' ? 'var(--accent)' : undefined} size={14}>
              {repeatMode === 'one' ? '🔂' : '🔁'}
            </Btn>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} className="volume-control">
              <Btn onClick={() => setIsMuted(m => !m)} size={14}>{isMuted || volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}</Btn>
              <input type="range" min={0} max={1} step={0.01} value={isMuted ? 0 : volume}
                onChange={e => { setVolume(parseFloat(e.target.value)); setIsMuted(false); }}
                style={{ width: 60, accentColor: 'var(--accent)', cursor: 'pointer' }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Fullscreen Player ── */}
      {showFullscreen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 500,
          background: 'linear-gradient(180deg, rgba(0,0,0,0.9) 0%, var(--bg-primary) 100%)',
          display: 'flex', flexDirection: 'column',
          animation: 'slideUp 0.3s ease'
        }}>
          <div style={{
            position: 'absolute', inset: 0, zIndex: -1,
            backgroundImage: `url(${currentTrack?.thumbnail})`,
            backgroundSize: 'cover', backgroundPosition: 'center',
            filter: 'blur(40px) brightness(0.3)', transform: 'scale(1.1)'
          }} />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', paddingTop: 'env(safe-area-inset-top, 16px)' }}>
            <button onClick={() => setShowFullscreen(false)} style={{ color: '#fff', fontSize: 22, opacity: 0.8, background: 'none', border: 'none', cursor: 'pointer' }}>⌄</button>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>Now Playing</div>
            <button onClick={() => setShowInfo(true)} style={{ color: '#fff', fontSize: 20, opacity: 0.8, background: 'none', border: 'none', cursor: 'pointer' }}>⋯</button>
          </div>

          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <img src={currentTrack?.thumbnail} alt={currentTrack?.title} style={{
              width: 'min(75vw, 320px)', height: 'min(75vw, 320px)',
              borderRadius: 16, objectFit: 'cover',
              boxShadow: '0 40px 100px rgba(0,0,0,0.7)',
              transform: isPlaying ? 'scale(1)' : 'scale(0.92)',
              transition: 'transform 0.4s ease'
            }} />
          </div>

          <div style={{ padding: '0 24px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentTrack?.title}
              </div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>{currentTrack?.channel}</div>
            </div>
            <button onClick={() => toggleLike(currentTrack)} style={{ color: isLiked ? '#ff2d55' : 'rgba(255,255,255,0.6)', fontSize: 26, marginLeft: 16, background: 'none', border: 'none', cursor: 'pointer' }}>
              {isLiked ? '♥' : '♡'}
            </button>
          </div>

          <div style={{ padding: '0 24px 8px' }}>
            <div onClick={seek} style={{ height: 5, background: 'rgba(255,255,255,0.2)', borderRadius: 99, cursor: 'pointer', marginBottom: 8, position: 'relative' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: '#fff', borderRadius: 99, transition: 'width 0.1s linear' }} />
              <div style={{ position: 'absolute', top: '50%', left: `${pct}%`, transform: 'translate(-50%,-50%)', width: 14, height: 14, borderRadius: '50%', background: '#fff' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
              <span>{fmtTime(progress)}</span>
              <span>{fmtTime(duration)}</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 32px 16px' }}>
            <button onClick={() => setIsShuffled(s => !s)} style={{ color: isShuffled ? 'var(--accent)' : 'rgba(255,255,255,0.6)', fontSize: 22, background: 'none', border: 'none', cursor: 'pointer' }}>⇄</button>
            <button onClick={prevTrack} style={{ color: '#fff', fontSize: 36, background: 'none', border: 'none', cursor: 'pointer' }}>⏮</button>
            <button onClick={() => setIsPlaying(p => !p)} style={{
              width: 68, height: 68, borderRadius: '50%',
              background: '#fff', color: '#000', fontSize: 28,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: 'none', cursor: 'pointer', boxShadow: '0 8px 30px rgba(0,0,0,0.4)'
            }}>{isPlaying ? '⏸' : '▶'}</button>
            <button onClick={nextTrack} style={{ color: '#fff', fontSize: 36, background: 'none', border: 'none', cursor: 'pointer' }}>⏭</button>
            <button onClick={() => setRepeatMode(m => m === 'none' ? 'all' : m === 'all' ? 'one' : 'none')}
              style={{ color: repeatMode !== 'none' ? 'var(--accent)' : 'rgba(255,255,255,0.6)', fontSize: 22, background: 'none', border: 'none', cursor: 'pointer' }}>
              {repeatMode === 'one' ? '🔂' : '🔁'}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 24px', marginBottom: 'env(safe-area-inset-bottom, 24px)' }}>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16 }}>🔉</span>
            <input type="range" min={0} max={1} step={0.01} value={isMuted ? 0 : volume}
              onChange={e => { setVolume(parseFloat(e.target.value)); setIsMuted(false); }}
              style={{ flex: 1, accentColor: '#fff' }} />
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16 }}>🔊</span>
          </div>
        </div>
      )}

      {showInfo && <TrackInfoModal track={currentTrack} onClose={() => setShowInfo(false)} />}

      <style>{`
        @media (max-width: 768px) { .volume-control { display: none !important; } }
      `}</style>
    </>
  );
}

function Btn({ onClick, children, color, size = 16, style = {} }) {
  return (
    <button onClick={onClick} style={{
      width: 32, height: 32, borderRadius: '50%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: color || 'var(--text-secondary)', fontSize: size,
      transition: 'var(--transition)', flexShrink: 0,
      background: 'none', border: 'none', cursor: 'pointer', ...style
    }}
      onMouseOver={e => { e.currentTarget.style.color = color || 'var(--text-primary)'; e.currentTarget.style.background = 'var(--surface-hover)'; }}
      onMouseOut={e => { e.currentTarget.style.color = color || 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; }}
    >{children}</button>
  );
}
