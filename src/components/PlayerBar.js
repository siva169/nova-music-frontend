import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../AppContext';
import YouTube from 'react-youtube';
import TrackInfoModal from './TrackInfoModal';

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
  const [ytKey, setYtKey] = useState(0);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [showAddTo, setShowAddTo] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const isLiked = currentTrack ? likedTracks.some(t => t.id === currentTrack.id) : false;

  useEffect(() => {
    setYtKey(k => k + 1);
    setProgress(0); setDuration(0); setPlayerReady(false);
  }, [currentTrack?.id]);

  useEffect(() => {
    if (isPlaying && playerRef.current) {
      progressInterval.current = setInterval(() => {
        try {
          const curr = playerRef.current.getCurrentTime?.() || 0;
          const dur = playerRef.current.getDuration?.() || 0;
          setProgress(curr); setDuration(dur);
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
    if (is8D) start8D(); else stop8D();
  }, [is8D]);

  function onReady(e) {
    playerRef.current = e.target;
    setPlayerReady(true);
    e.target.setVolume((isMuted ? 0 : volume) * 100);
    if (isPlaying) e.target.playVideo();
  }

  function onStateChange(e) {
    if (e.data === 1) setIsPlaying(true);
    else if (e.data === 2) setIsPlaying(false);
    else if (e.data === 0) onTrackEnd();
  }

  function seek(e) {
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    const newTime = Math.max(0, Math.min(duration, pct * duration));
    setProgress(newTime);
    try { playerRef.current?.seekTo?.(newTime, true); } catch {}
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
      {/* Hidden YouTube Player */}
      {currentTrack && (
        <div style={{ position:'fixed', top:-9999, left:-9999, width:1, height:1, overflow:'hidden', pointerEvents:'none' }}>
          <YouTube
            key={`${currentTrack.id}-${ytKey}`}
            videoId={currentTrack.id}
            opts={{ playerVars: { autoplay: isPlaying ? 1 : 0, controls: 0, modestbranding: 1, rel: 0, playsinline: 1, origin: window.location.origin } }}
            onReady={onReady}
            onStateChange={onStateChange}
            onEnd={onTrackEnd}
          />
        </div>
      )}

      {/* ── Player Bar ── */}
      <div className="player-bar" style={{
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        position: 'relative', zIndex: 100,
        userSelect: 'none'
      }}>
        {/* Progress bar - clickable thin line at top */}
        <div onClick={seek} style={{
          height: 3, background: 'var(--surface)', cursor: 'pointer',
          flexShrink: 0, position: 'relative'
        }}
          onMouseOver={e => e.currentTarget.style.height = '5px'}
          onMouseOut={e => e.currentTarget.style.height = '3px'}
        >
          <div style={{ width:`${pct}%`, height:'100%', background:'var(--accent)', transition:'width 0.1s linear', borderRadius:'0 2px 2px 0' }} />
          <div style={{ position:'absolute', top:'50%', left:`${pct}%`, transform:'translate(-50%,-50%)', width:12, height:12, borderRadius:'50%', background:'var(--accent)', opacity:0, transition:'opacity 0.2s' }} className="progress-dot" />
        </div>

        {/* Main controls row */}
        <div style={{ display:'flex', alignItems:'center', padding:'0 16px', height:77, gap:12 }}>

          {/* Track info - clickable to open fullscreen */}
          <div onClick={() => setShowFullscreen(true)} style={{ display:'flex', alignItems:'center', gap:10, flex:1, minWidth:0, cursor:'pointer' }}>
            <div style={{ position:'relative', flexShrink:0 }}>
              <img src={currentTrack?.thumbnail} alt={currentTrack?.title}
                style={{ width:48, height:48, borderRadius:8, objectFit:'cover', border: isPlaying ? '2px solid var(--accent)' : '2px solid transparent', transition:'border 0.3s' }} />
              {isPlaying && (
                <div style={{ position:'absolute', inset:0, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <div className="eq-bars" style={{ height:12 }}><span/><span/><span/></div>
                </div>
              )}
            </div>
            <div style={{ overflow:'hidden', flex:1 }}>
              <div style={{ fontSize:13, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color: isPlaying ? 'var(--accent)' : 'var(--text-primary)' }}>
                {currentTrack?.title}
              </div>
              <div style={{ fontSize:11, color:'var(--text-muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {currentTrack?.channel}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div style={{ display:'flex', alignItems:'center', gap:4, flexShrink:0 }}>
            {/* Like */}
            <Btn onClick={() => toggleLike(currentTrack)} color={isLiked ? '#ff2d55' : undefined} size={16}>♥</Btn>

            {/* On mobile: show prev/play/next only */}
            <Btn onClick={prevTrack} size={20} className="desktop-only">⏮</Btn>
            <button onClick={() => setIsPlaying(p => !p)} style={{
              width:42, height:42, borderRadius:'50%',
              background:'var(--accent)', color:'#000',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:18, transition:'var(--transition)', flexShrink:0,
              boxShadow:'var(--accent-glow)'
            }}>{isPlaying ? '⏸' : '▶'}</button>
            <Btn onClick={nextTrack} size={20}>⏭</Btn>

            {/* Desktop extras */}
            <Btn onClick={prevTrack} size={20} style={{ display:'none' }} className="show-mobile">⏮</Btn>
            <Btn onClick={() => setIsShuffled(s => !s)} color={isShuffled ? 'var(--accent)' : undefined} size={14} style={{ display:'flex' }}>⇄</Btn>
            <Btn onClick={() => setRepeatMode(m => m==='none'?'all':m==='all'?'one':'none')}
              color={repeatMode!=='none' ? 'var(--accent)' : undefined} size={14}>
              {repeatMode==='one' ? '🔂' : '🔁'}
            </Btn>
            <button onClick={() => setIs8D(d => !d)} style={{
              padding:'3px 8px', borderRadius:99,
              background: is8D ? 'var(--accent)' : 'var(--surface)',
              color: is8D ? '#000' : 'var(--text-secondary)',
              fontSize:10, fontWeight:700, border:'1px solid var(--border)', transition:'var(--transition)'
            }}>8D</button>

            {/* Volume - hide on mobile */}
            <div style={{ display:'flex', alignItems:'center', gap:4 }} className="volume-control">
              <Btn onClick={() => setIsMuted(m => !m)} size={14}>{isMuted||volume===0 ? '🔇' : volume<0.5 ? '🔉' : '🔊'}</Btn>
              <input type="range" min={0} max={1} step={0.01} value={isMuted?0:volume}
                onChange={e => { setVolume(parseFloat(e.target.value)); setIsMuted(false); }}
                style={{ width:60, accentColor:'var(--accent)', cursor:'pointer' }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Fullscreen Player (Spotify-style) ── */}
      {showFullscreen && (
        <div style={{
          position:'fixed', inset:0, zIndex:500,
          background:`linear-gradient(180deg, rgba(0,0,0,0.9) 0%, var(--bg-primary) 100%)`,
          display:'flex', flexDirection:'column',
          animation:'slideUp 0.3s ease'
        }}>
          {/* Blurred background */}
          <div style={{
            position:'absolute', inset:0, zIndex:-1,
            backgroundImage:`url(${currentTrack?.thumbnail})`,
            backgroundSize:'cover', backgroundPosition:'center',
            filter:'blur(40px) brightness(0.3)', transform:'scale(1.1)'
          }} />

          {/* Header */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', paddingTop:'env(safe-area-inset-top, 16px)' }}>
            <button onClick={() => setShowFullscreen(false)} style={{ color:'#fff', fontSize:22, opacity:0.8 }}>⌄</button>
            <div style={{ fontSize:12, fontWeight:700, letterSpacing:2, color:'rgba(255,255,255,0.7)', textTransform:'uppercase' }}>Now Playing</div>
            <button onClick={() => setShowInfo(true)} style={{ color:'#fff', fontSize:20, opacity:0.8 }}>⋯</button>
          </div>

          {/* Album Art */}
          <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
            <img src={currentTrack?.thumbnail} alt={currentTrack?.title} style={{
              width:'min(75vw, 320px)', height:'min(75vw, 320px)',
              borderRadius:16, objectFit:'cover',
              boxShadow:'0 40px 100px rgba(0,0,0,0.7)',
              transform: isPlaying ? 'scale(1)' : 'scale(0.92)',
              transition:'transform 0.4s ease'
            }} />
          </div>

          {/* Track Info */}
          <div style={{ padding:'0 24px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ flex:1, overflow:'hidden' }}>
              <div style={{ fontSize:22, fontWeight:800, color:'#fff', marginBottom:4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {currentTrack?.title}
              </div>
              <div style={{ fontSize:14, color:'rgba(255,255,255,0.6)' }}>{currentTrack?.channel}</div>
            </div>
            <button onClick={() => toggleLike(currentTrack)} style={{ color: isLiked ? '#ff2d55' : 'rgba(255,255,255,0.6)', fontSize:26, marginLeft:16, background:'none', border:'none', cursor:'pointer' }}>
              {isLiked ? '♥' : '♡'}
            </button>
          </div>

          {/* Progress Bar */}
          <div style={{ padding:'0 24px 8px' }}>
            <div onClick={seek} style={{ height:5, background:'rgba(255,255,255,0.2)', borderRadius:99, cursor:'pointer', marginBottom:8, position:'relative' }}>
              <div style={{ width:`${pct}%`, height:'100%', background:'#fff', borderRadius:99, transition:'width 0.1s linear' }} />
              <div style={{ position:'absolute', top:'50%', left:`${pct}%`, transform:'translate(-50%,-50%)', width:14, height:14, borderRadius:'50%', background:'#fff', boxShadow:'0 0 6px rgba(0,0,0,0.5)' }} />
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'rgba(255,255,255,0.5)' }}>
              <span>{fmtTime(progress)}</span>
              <span>{fmtTime(duration)}</span>
            </div>
          </div>

          {/* Main Controls */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 32px 16px' }}>
            <button onClick={() => setIsShuffled(s => !s)} style={{ color: isShuffled ? 'var(--accent)' : 'rgba(255,255,255,0.6)', fontSize:22, background:'none', border:'none', cursor:'pointer' }}>⇄</button>
            <button onClick={prevTrack} style={{ color:'#fff', fontSize:36, background:'none', border:'none', cursor:'pointer' }}>⏮</button>
            <button onClick={() => setIsPlaying(p => !p)} style={{
              width:68, height:68, borderRadius:'50%',
              background:'#fff', color:'#000',
              fontSize:28, display:'flex', alignItems:'center', justifyContent:'center',
              border:'none', cursor:'pointer', boxShadow:'0 8px 30px rgba(0,0,0,0.4)',
              transition:'transform 0.15s'
            }}
              onMouseDown={e => e.currentTarget.style.transform = 'scale(0.94)'}
              onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
            >{isPlaying ? '⏸' : '▶'}</button>
            <button onClick={nextTrack} style={{ color:'#fff', fontSize:36, background:'none', border:'none', cursor:'pointer' }}>⏭</button>
            <button onClick={() => setRepeatMode(m => m==='none'?'all':m==='all'?'one':'none')} style={{ color: repeatMode!=='none' ? 'var(--accent)' : 'rgba(255,255,255,0.6)', fontSize:22, background:'none', border:'none', cursor:'pointer' }}>
              {repeatMode==='one' ? '🔂' : '🔁'}
            </button>
          </div>

          {/* Extra Controls */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:24, padding:'0 24px 16px' }}>
            <button onClick={() => setIs8D(d => !d)} style={{
              padding:'8px 20px', borderRadius:99,
              background: is8D ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)',
              color:'#fff', fontSize:13, fontWeight:700,
              border:'1px solid rgba(255,255,255,0.2)', cursor:'pointer'
            }}>🎧 {is8D ? '8D ON' : '8D OFF'}</button>
            <button onClick={() => window.open(`https://youtube.com/watch?v=${currentTrack?.id}`, '_blank')}
              style={{ padding:'8px 20px', borderRadius:99, background:'rgba(255,255,255,0.08)', color:'#fff', fontSize:13, fontWeight:700, border:'1px solid rgba(255,255,255,0.2)', cursor:'pointer' }}>
              ▶ YouTube
            </button>
          </div>

          {/* Volume */}
          <div style={{ display:'flex', alignItems:'center', gap:10, padding:'0 24px', marginBottom:'env(safe-area-inset-bottom, 24px)' }}>
            <span style={{ color:'rgba(255,255,255,0.5)', fontSize:16 }}>🔉</span>
            <input type="range" min={0} max={1} step={0.01} value={isMuted?0:volume}
              onChange={e => { setVolume(parseFloat(e.target.value)); setIsMuted(false); }}
              style={{ flex:1, accentColor:'#fff' }} />
            <span style={{ color:'rgba(255,255,255,0.5)', fontSize:16 }}>🔊</span>
          </div>
        </div>
      )}

      {showInfo && <TrackInfoModal track={currentTrack} onClose={() => setShowInfo(false)} />}

      <style>{`
        @media (max-width: 768px) {
          .volume-control { display: none !important; }
        }
        .player-bar:hover .progress-dot { opacity: 1 !important; }
      `}</style>
    </>
  );
}

function Btn({ onClick, children, color, size=16, style={} }) {
  return (
    <button onClick={onClick} style={{
      width:32, height:32, borderRadius:'50%',
      display:'flex', alignItems:'center', justifyContent:'center',
      color: color || 'var(--text-secondary)', fontSize:size,
      transition:'var(--transition)', flexShrink:0, ...style
    }}
      onMouseOver={e => { e.currentTarget.style.color = color || 'var(--text-primary)'; e.currentTarget.style.background = 'var(--surface-hover)'; }}
      onMouseOut={e => { e.currentTarget.style.color = color || 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; }}
    >{children}</button>
  );
}
