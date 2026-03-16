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
    toggleLike, likedTracks, playlists, addToPlaylist, toast
  } = useApp();

  const progressInterval = useRef(null);
  const [ytKey, setYtKey] = useState(0);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [showAddTo, setShowAddTo] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const isLiked = currentTrack ? likedTracks.some(t => t.id === currentTrack.id) : false;

  useEffect(() => {
    setYtKey(k => k+1); setProgress(0); setDuration(0); setPlayerReady(false);
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
    try { if (isPlaying) playerRef.current.playVideo?.(); else playerRef.current.pauseVideo?.(); } catch {}
  }, [isPlaying]);

  useEffect(() => {
    if (!playerRef.current) return;
    try { playerRef.current.setVolume?.((isMuted ? 0 : volume) * 100); } catch {}
  }, [volume, isMuted]);

  useEffect(() => { if (is8D) start8D(); else stop8D(); }, [is8D]);

  function onReady(e) {
    playerRef.current = e.target; setPlayerReady(true);
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
    const t = Math.max(0, Math.min(duration, pct * duration));
    setProgress(t); try { playerRef.current?.seekTo?.(t, true); } catch {}
  }
  function fmtTime(s) {
    if (!s || isNaN(s)) return '0:00';
    return `${Math.floor(s/60)}:${Math.floor(s%60).toString().padStart(2,'0')}`;
  }
  const pct = duration > 0 ? Math.min(100, (progress/duration)*100) : 0;

  return (
    <>
      {/* Hidden YouTube */}
      {currentTrack && (
        <div style={{position:'fixed',top:-9999,left:-9999,width:1,height:1,overflow:'hidden',pointerEvents:'none'}}>
          <YouTube key={`${currentTrack.id}-${ytKey}`} videoId={currentTrack.id}
            opts={{playerVars:{autoplay:isPlaying?1:0,controls:0,modestbranding:1,rel:0,playsinline:1,origin:window.location.origin}}}
            onReady={onReady} onStateChange={onStateChange} onEnd={onTrackEnd} />
        </div>
      )}

      {/* ── Spotify-style Mini Player ── */}
      <div className="player-bar-wrap" style={{background:'var(--bg-secondary)', borderTop:'1px solid var(--border)'}}>
        {/* Progress line */}
        <div onClick={seek} style={{height:2, background:'rgba(255,255,255,0.1)', cursor:'pointer', position:'relative'}}
          onMouseOver={e => e.currentTarget.style.height='4px'}
          onMouseOut={e => e.currentTarget.style.height='2px'}>
          <div style={{width:`${pct}%`, height:'100%', background:'var(--accent)', transition:'width 0.1s linear'}} />
        </div>

        <div style={{display:'flex', alignItems:'center', padding:'8px 12px', gap:10, height:72}}>
          {/* Album art + info - tap to open fullscreen */}
          <div onClick={() => setShowFullscreen(true)} style={{display:'flex', alignItems:'center', gap:10, flex:1, minWidth:0, cursor:'pointer'}}>
            <div style={{position:'relative', flexShrink:0}}>
              <img src={currentTrack?.thumbnail} alt="" style={{width:46, height:46, borderRadius:6, objectFit:'cover', border: isPlaying ? '2px solid var(--accent)' : '2px solid transparent'}} />
              {isPlaying && (
                <div style={{position:'absolute',bottom:2,right:2,background:'rgba(0,0,0,0.7)',borderRadius:3,padding:'1px 3px'}}>
                  <div className="eq-bars" style={{height:8}}><span/><span/><span/></div>
                </div>
              )}
            </div>
            <div style={{overflow:'hidden', flex:1}}>
              <div style={{fontSize:13, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:isPlaying?'var(--accent)':'var(--text-primary)'}}>
                {currentTrack?.title}
              </div>
              <div style={{fontSize:11, color:'var(--text-muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
                {currentTrack?.channel}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div style={{display:'flex', alignItems:'center', gap:4, flexShrink:0}}>
            <button onClick={() => toggleLike(currentTrack)} style={{color:isLiked?'#ff2d55':'rgba(255,255,255,0.5)', fontSize:18, padding:'6px', background:'none', border:'none', cursor:'pointer'}}>♥</button>
            <button onClick={prevTrack} style={{color:'rgba(255,255,255,0.7)', fontSize:22, padding:'6px', background:'none', border:'none', cursor:'pointer'}}>⏮</button>
            <button onClick={() => setIsPlaying(p => !p)} style={{
              width:40, height:40, borderRadius:'50%',
              background:'white', color:'#000',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:16, border:'none', cursor:'pointer',
              boxShadow:'0 4px 15px rgba(0,0,0,0.3)'
            }}>{isPlaying ? '⏸' : '▶'}</button>
            <button onClick={nextTrack} style={{color:'rgba(255,255,255,0.7)', fontSize:22, padding:'6px', background:'none', border:'none', cursor:'pointer'}}>⏭</button>
          </div>
        </div>
      </div>

      {/* ── Fullscreen Player (Spotify-style) ── */}
      {showFullscreen && (
        <div style={{
          position:'fixed', inset:0, zIndex:500,
          display:'flex', flexDirection:'column',
          animation:'slideUp 0.3s ease'
        }}>
          {/* Blurred BG */}
          <div style={{position:'absolute', inset:0, backgroundImage:`url(${currentTrack?.thumbnail})`, backgroundSize:'cover', backgroundPosition:'center', filter:'blur(60px) brightness(0.25) saturate(1.5)', transform:'scale(1.2)', zIndex:-1}} />
          <div style={{position:'absolute', inset:0, background:'rgba(0,0,0,0.5)', zIndex:-1}} />

          {/* Header */}
          <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', paddingTop:'env(safe-area-inset-top,16px)'}}>
            <button onClick={() => setShowFullscreen(false)} style={{color:'rgba(255,255,255,0.8)', fontSize:26, lineHeight:1, background:'none', border:'none', cursor:'pointer'}}>⌄</button>
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:11, fontWeight:700, letterSpacing:2, color:'rgba(255,255,255,0.6)', textTransform:'uppercase'}}>Now Playing</div>
              <div style={{fontSize:12, color:'rgba(255,255,255,0.4)'}}>{currentTrack?.channel}</div>
            </div>
            <button onClick={() => { setShowInfo(true); }} style={{color:'rgba(255,255,255,0.8)', fontSize:20, background:'none', border:'none', cursor:'pointer'}}>⋯</button>
          </div>

          {/* Album Art */}
          <div style={{flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px 30px'}}>
            <img src={currentTrack?.thumbnail} alt="" style={{
              width:'min(80vw,320px)', height:'min(80vw,320px)',
              borderRadius:12, objectFit:'cover',
              boxShadow:'0 40px 100px rgba(0,0,0,0.8)',
              transform:isPlaying?'scale(1)':'scale(0.9)',
              transition:'transform 0.4s ease'
            }} />
          </div>

          {/* Track info + like */}
          <div style={{padding:'0 24px 12px', display:'flex', alignItems:'center', justifyContent:'space-between'}}>
            <div style={{flex:1, overflow:'hidden'}}>
              <div style={{fontSize:22, fontWeight:800, color:'#fff', marginBottom:4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{currentTrack?.title}</div>
              <div style={{fontSize:14, color:'rgba(255,255,255,0.5)'}}>{currentTrack?.channel}</div>
            </div>
            <button onClick={() => toggleLike(currentTrack)} style={{color:isLiked?'#ff2d55':'rgba(255,255,255,0.5)', fontSize:26, marginLeft:16, background:'none', border:'none', cursor:'pointer'}}>{isLiked?'♥':'♡'}</button>
          </div>

          {/* Progress */}
          <div style={{padding:'0 24px 8px'}}>
            <div onClick={seek} style={{height:4, background:'rgba(255,255,255,0.2)', borderRadius:99, cursor:'pointer', marginBottom:6, position:'relative'}}>
              <div style={{width:`${pct}%`, height:'100%', background:'#fff', borderRadius:99, transition:'width 0.1s linear'}} />
              <div style={{position:'absolute', top:'50%', left:`${pct}%`, transform:'translate(-50%,-50%)', width:14, height:14, borderRadius:'50%', background:'#fff'}} />
            </div>
            <div style={{display:'flex', justifyContent:'space-between', fontSize:11, color:'rgba(255,255,255,0.4)'}}>
              <span>{fmtTime(progress)}</span><span>{fmtTime(duration)}</span>
            </div>
          </div>

          {/* Main Controls */}
          <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 32px 16px'}}>
            <button onClick={() => setIsShuffled(s => !s)} style={{color:isShuffled?'var(--accent)':'rgba(255,255,255,0.5)', fontSize:22, background:'none', border:'none', cursor:'pointer'}}>⇄</button>
            <button onClick={prevTrack} style={{color:'#fff', fontSize:38, background:'none', border:'none', cursor:'pointer', lineHeight:1}}>⏮</button>
            <button onClick={() => setIsPlaying(p => !p)} style={{
              width:66, height:66, borderRadius:'50%', background:'#fff', color:'#000',
              fontSize:28, display:'flex', alignItems:'center', justifyContent:'center',
              border:'none', cursor:'pointer', boxShadow:'0 8px 30px rgba(0,0,0,0.5)'
            }}>{isPlaying?'⏸':'▶'}</button>
            <button onClick={nextTrack} style={{color:'#fff', fontSize:38, background:'none', border:'none', cursor:'pointer', lineHeight:1}}>⏭</button>
            <button onClick={() => setRepeatMode(m => m==='none'?'all':m==='all'?'one':'none')} style={{color:repeatMode!=='none'?'var(--accent)':'rgba(255,255,255,0.5)', fontSize:22, background:'none', border:'none', cursor:'pointer'}}>
              {repeatMode==='one'?'🔂':'🔁'}
            </button>
          </div>

          {/* Volume + extras */}
          <div style={{padding:'0 24px 12px', display:'flex', alignItems:'center', gap:10}}>
            <span style={{color:'rgba(255,255,255,0.4)', fontSize:14}}>🔉</span>
            <input type="range" min={0} max={1} step={0.01} value={isMuted?0:volume}
              onChange={e => { setVolume(parseFloat(e.target.value)); setIsMuted(false); }}
              style={{flex:1, accentColor:'#fff'}} />
            <span style={{color:'rgba(255,255,255,0.4)', fontSize:14}}>🔊</span>
          </div>

          {/* 8D + Add to playlist */}
          <div style={{display:'flex', gap:10, justifyContent:'center', padding:'0 24px', marginBottom:'env(safe-area-inset-bottom,20px)'}}>
            <button onClick={() => setIs8D(d => !d)} style={{
              padding:'8px 20px', borderRadius:99,
              background:is8D?'rgba(255,255,255,0.2)':'rgba(255,255,255,0.08)',
              color:'#fff', fontSize:13, fontWeight:700,
              border:'1px solid rgba(255,255,255,0.2)', cursor:'pointer'
            }}>🎧 {is8D?'8D ON':'8D OFF'}</button>
            <button onClick={() => window.open(`https://youtube.com/watch?v=${currentTrack?.id}`,'_blank')}
              style={{padding:'8px 20px', borderRadius:99, background:'rgba(255,255,255,0.08)', color:'#fff', fontSize:13, fontWeight:700, border:'1px solid rgba(255,255,255,0.2)', cursor:'pointer'}}>
              ▶ YouTube
            </button>
            <div style={{position:'relative'}}>
              <button onClick={() => setShowAddTo(s => !s)}
                style={{padding:'8px 20px', borderRadius:99, background:'rgba(255,255,255,0.08)', color:'#fff', fontSize:13, fontWeight:700, border:'1px solid rgba(255,255,255,0.2)', cursor:'pointer'}}>
                ＋ Playlist
              </button>
              {showAddTo && (
                <div style={{position:'absolute', bottom:'100%', right:0, marginBottom:8, background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:12, padding:8, minWidth:180, boxShadow:'0 8px 32px rgba(0,0,0,0.5)', zIndex:10}}>
                  {playlists.map(pl => (
                    <button key={pl.id} onClick={() => { addToPlaylist(pl.id, currentTrack); setShowAddTo(false); }}
                      style={{display:'block', width:'100%', textAlign:'left', padding:'8px 12px', borderRadius:8, fontSize:13, color:'var(--text-primary)', cursor:'pointer', background:'none', border:'none'}}
                      onMouseOver={e => e.currentTarget.style.background='var(--surface-hover)'}
                      onMouseOut={e => e.currentTarget.style.background='none'}
                    >{pl.name}</button>
                  ))}
                  {!playlists.length && <div style={{padding:'8px 12px', fontSize:12, color:'var(--text-muted)'}}>No playlists yet</div>}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showInfo && <TrackInfoModal track={currentTrack} onClose={() => setShowInfo(false)} />}
    </>
  );
}
