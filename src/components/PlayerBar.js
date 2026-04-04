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
    is8D, setIs8D, start8D, stop8D,
    toast, API
  } = useApp();

  const audioRef = useRef(null);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [streamUrl, setStreamUrl] = useState(null);
  const [audioError, setAudioError] = useState(false);
  // FIXED: track whether we've wired 8D to this audio element
  const audio8DWired = useRef(false);

  const isLiked = currentTrack ? likedTracks.some(t => t.id === currentTrack.id) : false;

  // ── FIXED: Fetch stream URL when track changes ─────────────────────────
  useEffect(() => {
    if (!currentTrack?.id) return;
    setStreamUrl(null);
    setAudioError(false);
    setLoading(true);
    setProgress(0);
    setDuration(0);
    setPlayerReady(false);
    audio8DWired.current = false;

    API.get(`/api/stream/${currentTrack.id}`)
      .then(r => {
        if (r.data?.url) {
          setStreamUrl(r.data.url);
        } else {
          // Fallback proxy
          setStreamUrl(`${API.defaults.baseURL}/api/proxy/${currentTrack.id}`);
        }
        setPlayerReady(true);
      })
      .catch(() => {
        setStreamUrl(`${API.defaults.baseURL}/api/proxy/${currentTrack.id}`);
        setPlayerReady(true);
      })
      .finally(() => setLoading(false));
  }, [currentTrack?.id]);

  // ── FIXED: Expose audio element methods via playerRef ─────────────────
  useEffect(() => {
    if (!audioRef.current) return;
    playerRef.current = {
      playVideo: () => audioRef.current?.play().catch(() => {}),
      pauseVideo: () => audioRef.current?.pause(),
      seekTo: (t) => {
        if (audioRef.current) {
          audioRef.current.currentTime = Math.max(0, t);
        }
      },
      getCurrentTime: () => audioRef.current?.currentTime ?? 0,
      getDuration: () => audioRef.current?.duration ?? 0,
      // State: 1=playing, 2=paused (YouTube IFrame API convention)
      getPlayerState: () => audioRef.current?.paused ? 2 : 1,
      setVolume: (v) => { if (audioRef.current) audioRef.current.volume = v / 100; },
    };
  });

  // ── FIXED: Play/pause - wait for src to load first ────────────────────
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !streamUrl) return;

    if (isPlaying) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          // Autoplay blocked - that's fine, user will click play
          if (err.name !== 'AbortError') setIsPlaying(false);
        });
      }
    } else {
      audio.pause();
    }
  }, [isPlaying, streamUrl]);

  // ── FIXED: Volume + mute in sync ──────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    // When 8D is active, volume is controlled via gainRef in AppContext
    // When not 8D, control directly on the audio element
    if (!is8D) {
      audio.volume = isMuted ? 0 : Math.max(0, Math.min(1, volume));
    }
  }, [volume, isMuted, is8D]);

  // ── FIXED: 8D toggle - wire/unwire Web Audio API to this audio element ─
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (is8D && !audio8DWired.current) {
      // Must be triggered by a user gesture (happens via button click)
      start8D(audio);
      audio8DWired.current = true;
      // When 8D is active, mute the native <audio> volume
      // (output goes through Web Audio API gainRef instead)
      audio.volume = 0.001;
    } else if (!is8D && audio8DWired.current) {
      stop8D();
      audio8DWired.current = false;
      audio.volume = isMuted ? 0 : volume;
    }
  }, [is8D]);

  // ── Audio event handlers ───────────────────────────────────────────────
  function onLoadedMetadata() {
    const audio = audioRef.current;
    if (!audio) return;
    setDuration(audio.duration || 0);
    if (isPlaying) audio.play().catch(() => {});
  }

  function onTimeUpdate() {
    const audio = audioRef.current;
    if (!audio) return;
    setProgress(audio.currentTime);
    // FIXED: update duration if it changed (some streams don't have it initially)
    if (audio.duration && !isNaN(audio.duration)) {
      setDuration(audio.duration);
    }
  }

  function onAudioEnded() {
    onTrackEnd();
  }

  // FIXED: two-step error fallback (direct URL → proxy → error toast)
  function onAudioError() {
    if (!audioError && streamUrl && !streamUrl.includes('/api/proxy/')) {
      setAudioError(true);
      setStreamUrl(`${API.defaults.baseURL}/api/proxy/${currentTrack?.id}`);
    } else {
      toast('Could not load audio. Try again later.', 'error');
      setIsPlaying(false);
    }
  }

  // FIXED: Seek using a proper click handler that handles touch too
  function seek(e) {
    if (!duration || !audioRef.current || isNaN(duration)) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const newTime = pct * duration;
    audioRef.current.currentTime = newTime;
    setProgress(newTime);
  }

  function fmtTime(s) {
    if (!s || isNaN(s) || !isFinite(s)) return '0:00';
    const totalSec = Math.floor(s);
    const m = Math.floor(totalSec / 60);
    const sec = (totalSec % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  }

  const pct = duration > 0 ? Math.min(100, (progress / duration) * 100) : 0;

  return (
    <>
      {/* ── HTML5 Audio Element ─────────────────────────────────────────── */}
      {streamUrl && (
        <audio
          ref={audioRef}
          src={streamUrl}
          onLoadedMetadata={onLoadedMetadata}
          onTimeUpdate={onTimeUpdate}
          onEnded={onAudioEnded}
          onError={onAudioError}
          preload="auto"
          playsInline
          crossOrigin="anonymous"
          style={{ display: 'none' }}
        />
      )}

      {/* ── Mini Player Bar ─────────────────────────────────────────────── */}
      <div className="player-bar-wrap" style={{
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        zIndex: 100,
        userSelect: 'none',
        flexShrink: 0,
      }}>
        {/* Seek bar */}
        <div
          onClick={seek}
          onTouchStart={seek}
          style={{
            height: 3,
            background: 'var(--surface)',
            cursor: 'pointer',
            flexShrink: 0,
            position: 'relative',
            transition: 'height 0.15s',
          }}
          onMouseOver={e => e.currentTarget.style.height = '6px'}
          onMouseOut={e => e.currentTarget.style.height = '3px'}
        >
          {/* Buffer visualization */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(255,255,255,0.05)',
          }} />
          {/* Progress */}
          <div style={{
            width: `${pct}%`,
            height: '100%',
            background: 'var(--accent)',
            transition: 'width 0.1s linear',
            borderRadius: '0 2px 2px 0',
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute', right: -6, top: '50%',
              transform: 'translateY(-50%)',
              width: 12, height: 12, borderRadius: '50%',
              background: 'var(--accent)',
              opacity: 0,
              transition: 'opacity 0.15s',
            }} className="seek-thumb" />
          </div>
        </div>

        {/* Controls row */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 16px', height: 77, gap: 10 }}>

          {/* Track info */}
          <div
            onClick={() => setShowFullscreen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0, cursor: 'pointer' }}
          >
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <img
                src={currentTrack?.thumbnail}
                alt={currentTrack?.title}
                style={{
                  width: 48, height: 48, borderRadius: 8, objectFit: 'cover',
                  border: isPlaying ? '2px solid var(--accent)' : '2px solid transparent',
                  transition: 'border-color 0.3s',
                }}
              />
              {loading && (
                <div style={{ position: 'absolute', inset: 0, borderRadius: 8, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 18, height: 18, border: '2px solid transparent', borderTop: '2px solid var(--accent)', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                </div>
              )}
              {isPlaying && !loading && (
                <div style={{ position: 'absolute', inset: 0, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)' }}>
                  <div className="eq-bars" style={{ height: 12 }}><span /><span /><span /></div>
                </div>
              )}
            </div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{
                fontSize: 13, fontWeight: 600,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                color: isPlaying ? 'var(--accent)' : 'var(--text-primary)',
              }}>
                {currentTrack?.title}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentTrack?.channel}
              </div>
              {/* FIXED: Show time in the mini player for mobile */}
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }} className="mobile-time">
                {fmtTime(progress)} / {fmtTime(duration)}
              </div>
            </div>
          </div>

          {/* Playback controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
            <Btn onClick={() => toggleLike(currentTrack)} color={isLiked ? '#ff2d55' : undefined} size={16} title={isLiked ? 'Unlike' : 'Like'}>♥</Btn>
            <Btn onClick={prevTrack} size={20} title="Previous">⏮</Btn>
            <button
              onClick={() => setIsPlaying(p => !p)}
              style={{
                width: 42, height: 42, borderRadius: '50%',
                background: 'var(--accent)', color: '#000',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: 'none', cursor: 'pointer', fontSize: 18,
                transition: 'var(--transition)', flexShrink: 0,
                boxShadow: 'var(--accent-glow)',
              }}
            >
              {loading ? (
                <div style={{ width: 16, height: 16, border: '2px solid #000', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 0.5s linear infinite' }} />
              ) : isPlaying ? '⏸' : '▶'}
            </button>
            <Btn onClick={nextTrack} size={20} title="Next">⏭</Btn>
            <Btn
              onClick={() => setIsShuffled(s => !s)}
              color={isShuffled ? 'var(--accent)' : undefined}
              size={14} title={isShuffled ? 'Shuffle on' : 'Shuffle off'}
            >⇄</Btn>
            <Btn
              onClick={() => setRepeatMode(m => m === 'none' ? 'all' : m === 'all' ? 'one' : 'none')}
              color={repeatMode !== 'none' ? 'var(--accent)' : undefined}
              size={14}
              title={`Repeat: ${repeatMode}`}
            >
              {repeatMode === 'one' ? '🔂' : '🔁'}
            </Btn>

            {/* FIXED: 8D button in the mini bar */}
            <Btn
              onClick={() => setIs8D(d => !d)}
              color={is8D ? 'var(--accent)' : undefined}
              size={11}
              title={is8D ? '8D Audio ON' : '8D Audio OFF'}
              style={{ fontWeight: 800, letterSpacing: -0.5 }}
            >8D</Btn>

            {/* Volume */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} className="volume-control">
              <Btn onClick={() => setIsMuted(m => !m)} size={14} title={isMuted ? 'Unmute' : 'Mute'}>
                {isMuted || volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
              </Btn>
              <input
                type="range" min={0} max={1} step={0.01}
                value={isMuted ? 0 : volume}
                onChange={e => { setVolume(parseFloat(e.target.value)); setIsMuted(false); }}
                style={{ width: 70, accentColor: 'var(--accent)', cursor: 'pointer' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Fullscreen Player ─────────────────────────────────────────────── */}
      {showFullscreen && (
        <FullscreenPlayer
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
          progress={progress}
          duration={duration}
          pct={pct}
          seek={seek}
          fmtTime={fmtTime}
          volume={volume}
          setVolume={setVolume}
          isMuted={isMuted}
          setIsMuted={setIsMuted}
          isShuffled={isShuffled}
          setIsShuffled={setIsShuffled}
          repeatMode={repeatMode}
          setRepeatMode={setRepeatMode}
          isLiked={isLiked}
          toggleLike={toggleLike}
          nextTrack={nextTrack}
          prevTrack={prevTrack}
          is8D={is8D}
          setIs8D={setIs8D}
          loading={loading}
          onClose={() => setShowFullscreen(false)}
          onShowInfo={() => { setShowFullscreen(false); setShowInfo(true); }}
        />
      )}

      {showInfo && <TrackInfoModal track={currentTrack} onClose={() => setShowInfo(false)} />}

      <style>{`
        @media (max-width: 768px) {
          .volume-control { display: none !important; }
          .mobile-time { display: block; }
        }
        @media (min-width: 769px) {
          .mobile-time { display: none; }
        }
        .player-bar-wrap:hover .seek-thumb { opacity: 1 !important; }
      `}</style>
    </>
  );
}

// ── Fullscreen Player (extracted for clarity) ──────────────────────────────
function FullscreenPlayer({
  currentTrack, isPlaying, setIsPlaying,
  progress, duration, pct, seek, fmtTime,
  volume, setVolume, isMuted, setIsMuted,
  isShuffled, setIsShuffled, repeatMode, setRepeatMode,
  isLiked, toggleLike, nextTrack, prevTrack,
  is8D, setIs8D, loading,
  onClose, onShowInfo
}) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      background: 'linear-gradient(180deg, rgba(5,5,16,0.95) 0%, var(--bg-primary) 100%)',
      display: 'flex', flexDirection: 'column',
      animation: 'slideUp 0.3s cubic-bezier(0.4,0,0.2,1)',
    }}>
      {/* Blurred background */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: -1,
        backgroundImage: `url(${currentTrack?.thumbnail})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        filter: 'blur(60px) brightness(0.25) saturate(1.5)',
        transform: 'scale(1.15)',
      }} />

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px',
        paddingTop: 'max(16px, env(safe-area-inset-top))',
      }}>
        <button onClick={onClose} style={{ color: '#fff', fontSize: 26, opacity: 0.8, background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }}>⌄</button>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>Now Playing</div>
        <button onClick={onShowInfo} style={{ color: '#fff', fontSize: 22, opacity: 0.8, background: 'none', border: 'none', cursor: 'pointer' }}>⋯</button>
      </div>

      {/* Album art */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 32px' }}>
        <img
          src={currentTrack?.thumbnail}
          alt={currentTrack?.title}
          style={{
            width: 'min(80vw, 320px)', height: 'min(80vw, 320px)',
            borderRadius: 20, objectFit: 'cover',
            boxShadow: '0 40px 100px rgba(0,0,0,0.8)',
            transform: isPlaying ? 'scale(1)' : 'scale(0.9)',
            transition: 'transform 0.5s cubic-bezier(0.4,0,0.2,1)',
          }}
        />
      </div>

      {/* Track info + like */}
      <div style={{ padding: '0 28px 12px', display: 'flex', alignItems: 'center' }}>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {currentTrack?.title}
          </div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>{currentTrack?.channel}</div>
        </div>
        <button
          onClick={() => toggleLike(currentTrack)}
          style={{ color: isLiked ? '#ff2d55' : 'rgba(255,255,255,0.5)', fontSize: 28, marginLeft: 16, background: 'none', border: 'none', cursor: 'pointer', transition: 'all 0.2s', transform: isLiked ? 'scale(1.2)' : 'scale(1)' }}
        >{isLiked ? '♥' : '♡'}</button>
      </div>

      {/* Seek bar */}
      <div style={{ padding: '0 28px 8px' }}>
        <div
          onClick={seek}
          onTouchStart={seek}
          style={{ height: 5, background: 'rgba(255,255,255,0.2)', borderRadius: 99, cursor: 'pointer', marginBottom: 8, position: 'relative' }}
        >
          <div style={{ width: `${pct}%`, height: '100%', background: '#fff', borderRadius: 99, transition: 'width 0.1s linear', position: 'relative' }}>
            <div style={{ position: 'absolute', right: -8, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, borderRadius: '50%', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }} />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'rgba(255,255,255,0.5)', fontVariantNumeric: 'tabular-nums' }}>
          <span>{fmtTime(progress)}</span>
          <span>{fmtTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 36px 12px' }}>
        <button onClick={() => setIsShuffled(s => !s)} style={{ color: isShuffled ? 'var(--accent)' : 'rgba(255,255,255,0.6)', fontSize: 22, background: 'none', border: 'none', cursor: 'pointer' }}>⇄</button>
        <button onClick={prevTrack} style={{ color: '#fff', fontSize: 34, background: 'none', border: 'none', cursor: 'pointer' }}>⏮</button>
        <button
          onClick={() => setIsPlaying(p => !p)}
          style={{ width: 70, height: 70, borderRadius: '50%', background: '#fff', color: '#000', fontSize: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', boxShadow: '0 8px 30px rgba(0,0,0,0.5)', transition: 'transform 0.15s' }}
        >
          {loading ? <div style={{ width: 24, height: 24, border: '3px solid #000', borderTop: '3px solid transparent', borderRadius: '50%', animation: 'spin 0.5s linear infinite' }} /> : isPlaying ? '⏸' : '▶'}
        </button>
        <button onClick={nextTrack} style={{ color: '#fff', fontSize: 34, background: 'none', border: 'none', cursor: 'pointer' }}>⏭</button>
        <button
          onClick={() => setRepeatMode(m => m === 'none' ? 'all' : m === 'all' ? 'one' : 'none')}
          style={{ color: repeatMode !== 'none' ? 'var(--accent)' : 'rgba(255,255,255,0.6)', fontSize: 22, background: 'none', border: 'none', cursor: 'pointer' }}
        >{repeatMode === 'one' ? '🔂' : '🔁'}</button>
      </div>

      {/* Volume + 8D */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 28px', marginBottom: 'max(24px, env(safe-area-inset-bottom))' }}>
        <button onClick={() => setIsMuted(m => !m)} style={{ color: 'rgba(255,255,255,0.5)', fontSize: 18, background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
          {isMuted || volume === 0 ? '🔇' : '🔉'}
        </button>
        <input
          type="range" min={0} max={1} step={0.01}
          value={isMuted ? 0 : volume}
          onChange={e => { setVolume(parseFloat(e.target.value)); setIsMuted(false); }}
          style={{ flex: 1, accentColor: '#fff', cursor: 'pointer' }}
        />
        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 18, flexShrink: 0 }}>🔊</span>

        {/* 8D toggle in fullscreen */}
        <button
          onClick={() => setIs8D(d => !d)}
          style={{
            marginLeft: 8, padding: '6px 12px', borderRadius: 99, fontSize: 11, fontWeight: 800,
            background: is8D ? 'var(--accent)' : 'rgba(255,255,255,0.1)',
            color: is8D ? '#000' : 'rgba(255,255,255,0.6)',
            border: 'none', cursor: 'pointer', letterSpacing: 0.5,
            transition: 'all 0.2s',
          }}
        >8D</button>
      </div>
    </div>
  );
}

function Btn({ onClick, children, color, size = 16, title, style = {} }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      title={title}
      onMouseOver={() => setHov(true)}
      onMouseOut={() => setHov(false)}
      style={{
        width: 34, height: 34, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: color || (hov ? 'var(--text-primary)' : 'var(--text-secondary)'),
        fontSize: size,
        background: hov ? 'var(--surface-hover)' : 'none',
        border: 'none', cursor: 'pointer',
        transition: 'var(--transition)', flexShrink: 0,
        ...style,
      }}
    >{children}</button>
  );
}

