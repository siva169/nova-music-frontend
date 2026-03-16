import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

const AppContext = createContext(null);
const API = axios.create({ baseURL: 'https://nova-music-backend-production.up.railway.app', withCredentials: true });

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [queue, setQueue] = useState([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState('none');
  const [is8D, setIs8D] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [accent, setAccent] = useState('cyan');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [likedTracks, setLikedTracks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const playerRef = useRef(null);
  const audioCtxRef = useRef(null);
  const pannerRef = useRef(null);
  const panAnimRef = useRef(null);
  const gainRef = useRef(null);
  const keepAliveRef = useRef(null);
  const wakeLockRef = useRef(null);

  const toast = useCallback((msg, type = 'info') => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => setAuthLoading(false), 5000);
    API.get('/auth/me').then(r => {
      setUser(r.data.user);
      if (r.data.user) { setTheme(r.data.user.theme || 'dark'); setAccent(r.data.user.accent || 'cyan'); }
    }).catch(() => {}).finally(() => { clearTimeout(timeout); setAuthLoading(false); });
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-accent', accent);
  }, [theme, accent]);

  useEffect(() => {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
  }, []);

  useEffect(() => {
    if (isPlaying) {
      keepAliveRef.current = setInterval(() => {
        navigator.serviceWorker?.controller?.postMessage({ type: 'KEEP_ALIVE' });
      }, 15000);
    } else clearInterval(keepAliveRef.current);
    return () => clearInterval(keepAliveRef.current);
  }, [isPlaying]);

  useEffect(() => {
    async function manageWakeLock() {
      if (isPlaying && 'wakeLock' in navigator) {
        try {
          if (!wakeLockRef.current || wakeLockRef.current.released) {
            wakeLockRef.current = await navigator.wakeLock.request('screen');
          }
        } catch {}
      } else if (wakeLockRef.current && !wakeLockRef.current.released) {
        try { await wakeLockRef.current.release(); } catch {}
      }
    }
    manageWakeLock();
  }, [isPlaying]);

  useEffect(() => {
    async function handleVisibility() {
      if (!document.hidden && isPlaying && 'wakeLock' in navigator) {
        try {
          if (!wakeLockRef.current || wakeLockRef.current.released)
            wakeLockRef.current = await navigator.wakeLock.request('screen');
        } catch {}
      }
    }
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [isPlaying]);

  const fetchPlaylists = useCallback(async () => {
    if (!user) return;
    try { const r = await API.get('/api/playlists'); setPlaylists(r.data.playlists); } catch {}
  }, [user]);

  const fetchLiked = useCallback(async () => {
    if (!user) return;
    try { const r = await API.get('/api/liked'); setLikedTracks(r.data.tracks); } catch {}
  }, [user]);

  useEffect(() => { if (user) { fetchPlaylists(); fetchLiked(); } }, [user, fetchPlaylists, fetchLiked]);

  const start8D = useCallback(() => {
    if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    const ctx = audioCtxRef.current;
    if (pannerRef.current) { pannerRef.current.disconnect(); cancelAnimationFrame(panAnimRef.current); }
    const panner = ctx.createPanner();
    panner.panningModel = 'HRTF'; panner.distanceModel = 'inverse';
    panner.refDistance = 1; panner.maxDistance = 10000; panner.rolloffFactor = 1;
    panner.coneInnerAngle = 360; panner.coneOuterAngle = 0; panner.coneOuterGain = 0;
    const gain = ctx.createGain();
    gain.gain.value = volume;
    panner.connect(gain); gain.connect(ctx.destination);
    pannerRef.current = panner; gainRef.current = gain;
    let angle = 0;
    function animatePan() {
      angle += (0.5 * Math.PI * 2) / 60;
      panner.positionX?.setValueAtTime(Math.sin(angle) * 5, ctx.currentTime);
      panner.positionY?.setValueAtTime(0.5, ctx.currentTime);
      panner.positionZ?.setValueAtTime(Math.cos(angle) * 5, ctx.currentTime);
      panAnimRef.current = requestAnimationFrame(animatePan);
    }
    animatePan();
  }, [volume]);

  const stop8D = useCallback(() => {
    if (panAnimRef.current) cancelAnimationFrame(panAnimRef.current);
    if (pannerRef.current) { pannerRef.current.disconnect(); pannerRef.current = null; }
    if (audioCtxRef.current) { audioCtxRef.current.close(); audioCtxRef.current = null; }
  }, []);

  const nextTrack = useCallback(() => {
    if (!queue.length) return;
    const nextIdx = isShuffled ? Math.floor(Math.random() * queue.length) : (queueIndex + 1) % queue.length;
    setQueueIndex(nextIdx); setCurrentTrack(queue[nextIdx]); setIsPlaying(true); setProgress(0);
  }, [queue, queueIndex, isShuffled]);

  const prevTrack = useCallback(() => {
    if (!queue.length) return;
    if (progress > 3) { if (playerRef.current) playerRef.current.seekTo(0); setProgress(0); return; }
    const prevIdx = (queueIndex - 1 + queue.length) % queue.length;
    setQueueIndex(prevIdx); setCurrentTrack(queue[prevIdx]); setIsPlaying(true); setProgress(0);
  }, [queue, queueIndex, progress]);

  useEffect(() => {
    if (!currentTrack || !('mediaSession' in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: currentTrack.channel,
      album: 'NOVA — Your Universe of Sound',
      artwork: [
        { src: currentTrack.thumbnail, sizes: '512x512', type: 'image/jpeg' },
        { src: currentTrack.thumbnail, sizes: '256x256', type: 'image/jpeg' },
      ]
    });
    navigator.mediaSession.setActionHandler('play', () => { setIsPlaying(true); try { playerRef.current?.playVideo?.(); } catch {} });
    navigator.mediaSession.setActionHandler('pause', () => { setIsPlaying(false); try { playerRef.current?.pauseVideo?.(); } catch {} });
    navigator.mediaSession.setActionHandler('previoustrack', prevTrack);
    navigator.mediaSession.setActionHandler('nexttrack', nextTrack);
    navigator.mediaSession.setActionHandler('seekto', (d) => {
      if (d.seekTime && playerRef.current) { try { playerRef.current.seekTo(d.seekTime, true); } catch {} setProgress(d.seekTime); }
    });
  }, [currentTrack, nextTrack, prevTrack]);

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
  }, [isPlaying]);

  useEffect(() => {
    if (!('mediaSession' in navigator) || !duration) return;
    try { navigator.mediaSession.setPositionState({ duration, playbackRate: 1, position: Math.min(progress, duration) }); } catch {}
  }, [progress, duration]);

  const playTrack = useCallback((track, newQueue = null, startIndex = 0) => {
    if (newQueue) { setQueue(newQueue); setQueueIndex(startIndex); }
    setCurrentTrack(track); setIsPlaying(true); setProgress(0);
    if (is8D) start8D();
  }, [is8D, start8D]);

  const onTrackEnd = useCallback(() => {
    if (repeatMode === 'one') { if (playerRef.current) playerRef.current.seekTo(0); setIsPlaying(true); }
    else if (repeatMode === 'all' || queueIndex < queue.length - 1) nextTrack();
    else setIsPlaying(false);
  }, [repeatMode, queueIndex, queue.length, nextTrack]);

  const toggleLike = useCallback(async (track) => {
    if (!user) { toast('Sign in to like songs', 'warning'); return; }
    const isLiked = likedTracks.some(t => t.id === track.id);
    try {
      if (isLiked) { await API.delete(`/api/liked/${track.id}`); setLikedTracks(l => l.filter(t => t.id !== track.id)); toast('Removed from liked songs'); }
      else { await API.post('/api/liked', { track }); setLikedTracks(l => [...l, track]); toast('Added to liked songs ♥'); }
    } catch { toast('Error updating liked songs', 'error'); }
  }, [user, likedTracks, toast]);

  const addToPlaylist = useCallback(async (playlistId, track) => {
    try { await API.post(`/api/playlists/${playlistId}/tracks`, { track }); toast('Added to playlist ✓'); fetchPlaylists(); }
    catch { toast('Error adding to playlist', 'error'); }
  }, [toast, fetchPlaylists]);

  const createPlaylist = useCallback(async (name, description = '') => {
    if (!user) { toast('Sign in to create playlists', 'warning'); return; }
    try { const r = await API.post('/api/playlists', { name, description }); setPlaylists(p => [...p, r.data.playlist]); toast(`Playlist "${name}" created ✓`); return r.data.playlist; }
    catch { toast('Error creating playlist', 'error'); }
  }, [user, toast]);

  const saveSettings = useCallback(async (newTheme, newAccent) => {
    setTheme(newTheme); setAccent(newAccent);
    if (user) { try { await API.put('/api/user/settings', { theme: newTheme, accent: newAccent }); } catch {} }
  }, [user]);

  const logout = useCallback(async () => {
    await API.post('/auth/logout'); setUser(null); setPlaylists([]); setLikedTracks([]); toast('Signed out');
  }, [toast]);

  const value = {
    user, setUser, authLoading, logout,
    currentTrack, queue, queueIndex, isPlaying, setIsPlaying,
    progress, setProgress, duration, setDuration,
    volume, setVolume, isMuted, setIsMuted,
    isShuffled, setIsShuffled, repeatMode, setRepeatMode,
    is8D, setIs8D, start8D, stop8D,
    playerRef, playerReady, setPlayerReady,
    playTrack, nextTrack, prevTrack, onTrackEnd,
    playlists, likedTracks, fetchPlaylists, fetchLiked,
    toggleLike, addToPlaylist, createPlaylist,
    theme, accent, saveSettings,
    sidebarOpen, setSidebarOpen,
    toasts, toast, searchQuery, setSearchQuery, API
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => useContext(AppContext);
export { API };
