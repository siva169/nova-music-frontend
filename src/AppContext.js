import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

const AppContext = createContext(null);

// ── FIXED: Use env variable for API base URL so it works in dev + prod ──
const API_BASE = process.env.REACT_APP_API_URL || 'https://nova-music-backend-production.up.railway.app';
const API = axios.create({ baseURL: API_BASE, withCredentials: true });

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [queue, setQueue] = useState([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  // ── FIXED: Persist volume across sessions ──────────────────────────────
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem('nova_volume');
    return saved !== null ? parseFloat(saved) : 0.8;
  });
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
  const sourceRef = useRef(null);  // FIXED: track MediaElementSourceNode to avoid re-creating
  const keepAliveRef = useRef(null);
  const wakeLockRef = useRef(null);

  // ── FIXED: Persist volume to localStorage ─────────────────────────────
  useEffect(() => {
    localStorage.setItem('nova_volume', volume.toString());
  }, [volume]);

  const toast = useCallback((msg, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);

  // ── Auth check ─────────────────────────────────────────────────────────
  useEffect(() => {
    const timeout = setTimeout(() => setAuthLoading(false), 5000);
    API.get('/auth/me')
      .then(r => {
        setUser(r.data.user);
        if (r.data.user) {
          setTheme(r.data.user.theme || 'dark');
          setAccent(r.data.user.accent || 'cyan');
        }
      })
      .catch(() => {})
      .finally(() => { clearTimeout(timeout); setAuthLoading(false); });
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-accent', accent);
  }, [theme, accent]);

  useEffect(() => {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
  }, []);

  // ── Keep-alive ping ────────────────────────────────────────────────────
  useEffect(() => {
    if (isPlaying) {
      keepAliveRef.current = setInterval(() => {
        navigator.serviceWorker?.controller?.postMessage({ type: 'KEEP_ALIVE' });
      }, 15000);
    } else clearInterval(keepAliveRef.current);
    return () => clearInterval(keepAliveRef.current);
  }, [isPlaying]);

  // ── WakeLock ───────────────────────────────────────────────────────────
  useEffect(() => {
    async function manageWakeLock() {
      if (isPlaying && 'wakeLock' in navigator) {
        try {
          if (!wakeLockRef.current || wakeLockRef.current.released)
            wakeLockRef.current = await navigator.wakeLock.request('screen');
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

  // ── Fetch playlists + liked ────────────────────────────────────────────
  const fetchPlaylists = useCallback(async () => {
    if (!user) return;
    try { const r = await API.get('/api/playlists'); setPlaylists(r.data.playlists || []); } catch {}
  }, [user]);

  const fetchLiked = useCallback(async () => {
    if (!user) return;
    try { const r = await API.get('/api/liked'); setLikedTracks(r.data.tracks || []); } catch {}
  }, [user]);

  useEffect(() => { if (user) { fetchPlaylists(); fetchLiked(); } }, [user, fetchPlaylists, fetchLiked]);

  // ── FIXED: 8D Audio — properly connects to the HTML5 audio element ─────
  // The old code tried to create a new AudioContext each time, which
  // cannot connect to the YouTube iframe. With the new HTML5 audio player
  // (PlayerBar), we connect to audioRef via a MediaElementSourceNode.

  const start8D = useCallback((audioElement) => {
    // If no audio element provided, just set state (effect triggers later)
    if (!audioElement) return;

    try {
      // Create (or reuse) AudioContext
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      // Disconnect existing source if any
      if (sourceRef.current) {
        try { sourceRef.current.disconnect(); } catch {}
      }

      // ── Create audio graph: source → panner → gain → destination ──
      // Only create MediaElementSource once per element (browser restriction)
      if (!audioElement._novaSource) {
        audioElement._novaSource = ctx.createMediaElementSource(audioElement);
      }
      sourceRef.current = audioElement._novaSource;

      const panner = ctx.createPanner();
      panner.panningModel = 'HRTF';
      panner.distanceModel = 'inverse';
      panner.refDistance = 1;
      panner.maxDistance = 10000;
      panner.rolloffFactor = 1;
      panner.coneInnerAngle = 360;
      panner.coneOuterAngle = 0;
      panner.coneOuterGain = 0;

      // Reverb (convolver) for immersion
      const convolver = ctx.createConvolver();
      const reverbLength = ctx.sampleRate * 2;
      const reverbBuffer = ctx.createBuffer(2, reverbLength, ctx.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const data = reverbBuffer.getChannelData(ch);
        for (let i = 0; i < reverbLength; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / reverbLength, 2);
        }
      }
      convolver.buffer = reverbBuffer;

      const gain = ctx.createGain();
      gain.gain.value = isMuted ? 0 : volume;

      // Dry/wet mix
      const dryGain = ctx.createGain();
      const wetGain = ctx.createGain();
      dryGain.gain.value = 0.6;
      wetGain.gain.value = 0.4;

      sourceRef.current.connect(panner);
      panner.connect(dryGain);
      panner.connect(convolver);
      convolver.connect(wetGain);
      dryGain.connect(gain);
      wetGain.connect(gain);
      gain.connect(ctx.destination);

      pannerRef.current = panner;
      gainRef.current = gain;

      // Cancel existing animation
      if (panAnimRef.current) cancelAnimationFrame(panAnimRef.current);

      // Animate the HRTF panner in a circle
      let angle = 0;
      function animatePan() {
        angle += (Math.PI * 2 * 0.4) / 60; // 0.4 Hz rotation
        const x = Math.sin(angle) * 5;
        const z = Math.cos(angle) * 5;
        if (panner.positionX) {
          panner.positionX.setTargetAtTime(x, ctx.currentTime, 0.05);
          panner.positionY.setTargetAtTime(0.5, ctx.currentTime, 0.05);
          panner.positionZ.setTargetAtTime(z, ctx.currentTime, 0.05);
        } else {
          panner.setPosition(x, 0.5, z);
        }
        panAnimRef.current = requestAnimationFrame(animatePan);
      }
      animatePan();
    } catch (err) {
      console.warn('8D audio failed:', err);
    }
  }, [volume, isMuted]);

  const stop8D = useCallback(() => {
    if (panAnimRef.current) cancelAnimationFrame(panAnimRef.current);
    panAnimRef.current = null;

    // Reconnect source directly to destination (bypass panner)
    if (sourceRef.current && audioCtxRef.current) {
      try {
        sourceRef.current.disconnect();
        const gain = audioCtxRef.current.createGain();
        gain.gain.value = isMuted ? 0 : volume;
        sourceRef.current.connect(gain);
        gain.connect(audioCtxRef.current.destination);
        gainRef.current = gain;
      } catch {}
    }

    pannerRef.current = null;
  }, [volume, isMuted]);

  // ── FIXED: Keep 8D gain node in sync with volume ──────────────────────
  useEffect(() => {
    if (gainRef.current && audioCtxRef.current) {
      gainRef.current.gain.setTargetAtTime(isMuted ? 0 : volume, audioCtxRef.current.currentTime, 0.02);
    }
  }, [volume, isMuted]);

  // ── Queue navigation ───────────────────────────────────────────────────
  const nextTrack = useCallback(() => {
    if (!queue.length) return;
    let nextIdx;
    if (isShuffled) {
      // FIXED: don't repeat current track in shuffle
      do { nextIdx = Math.floor(Math.random() * queue.length); }
      while (queue.length > 1 && nextIdx === queueIndex);
    } else {
      nextIdx = (queueIndex + 1) % queue.length;
    }
    setQueueIndex(nextIdx);
    setCurrentTrack(queue[nextIdx]);
    setIsPlaying(true);
    setProgress(0);
  }, [queue, queueIndex, isShuffled]);

  const prevTrack = useCallback(() => {
    if (!queue.length) return;
    // FIXED: if >3s in, restart; otherwise go to previous
    if (progress > 3) {
      if (playerRef.current) playerRef.current.seekTo(0);
      setProgress(0);
      return;
    }
    const prevIdx = (queueIndex - 1 + queue.length) % queue.length;
    setQueueIndex(prevIdx);
    setCurrentTrack(queue[prevIdx]);
    setIsPlaying(true);
    setProgress(0);
  }, [queue, queueIndex, progress]);

  // ── MediaSession ───────────────────────────────────────────────────────
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
      if (d.seekTime !== undefined && playerRef.current) {
        try { playerRef.current.seekTo(d.seekTime, true); } catch {}
        setProgress(d.seekTime);
      }
    });
  }, [currentTrack, nextTrack, prevTrack]);

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
  }, [isPlaying]);

  useEffect(() => {
    if (!('mediaSession' in navigator) || !duration) return;
    try {
      navigator.mediaSession.setPositionState({
        duration,
        playbackRate: 1,
        position: Math.min(progress, duration)
      });
    } catch {}
  }, [progress, duration]);

  // ── Play a track ───────────────────────────────────────────────────────
  const playTrack = useCallback((track, newQueue = null, startIndex = 0) => {
    if (newQueue) {
      setQueue(newQueue);
      setQueueIndex(startIndex);
    } else if (!queue.length) {
      setQueue([track]);
      setQueueIndex(0);
    }
    setCurrentTrack(track);
    setIsPlaying(true);
    setProgress(0);
  }, [queue]);

  const onTrackEnd = useCallback(() => {
    if (repeatMode === 'one') {
      if (playerRef.current) playerRef.current.seekTo(0);
      setProgress(0);
      setIsPlaying(true);
    } else if (repeatMode === 'all' || queueIndex < queue.length - 1) {
      nextTrack();
    } else {
      setIsPlaying(false);
    }
  }, [repeatMode, queueIndex, queue.length, nextTrack]);

  // ── Like / Playlist helpers ────────────────────────────────────────────
  const toggleLike = useCallback(async (track) => {
    if (!user) { toast('Sign in to like songs', 'warning'); return; }
    const isLiked = likedTracks.some(t => t.id === track.id);
    // FIXED: optimistic update first, then sync
    if (isLiked) {
      setLikedTracks(l => l.filter(t => t.id !== track.id));
      try { await API.delete(`/api/liked/${track.id}`); toast('Removed from liked songs'); }
      catch { setLikedTracks(l => [...l, track]); toast('Error', 'error'); }
    } else {
      setLikedTracks(l => [...l, track]);
      try { await API.post('/api/liked', { track }); toast('Added to liked songs ♥'); }
      catch { setLikedTracks(l => l.filter(t => t.id !== track.id)); toast('Error', 'error'); }
    }
  }, [user, likedTracks, toast]);

  const addToPlaylist = useCallback(async (playlistId, track) => {
    try {
      await API.post(`/api/playlists/${playlistId}/tracks`, { track });
      toast('Added to playlist ✓');
      fetchPlaylists();
    } catch { toast('Error adding to playlist', 'error'); }
  }, [toast, fetchPlaylists]);

  const createPlaylist = useCallback(async (name, description = '') => {
    if (!user) { toast('Sign in to create playlists', 'warning'); return; }
    try {
      const r = await API.post('/api/playlists', { name, description });
      setPlaylists(p => [...p, r.data.playlist]);
      toast(`Playlist "${name}" created ✓`);
      return r.data.playlist;
    } catch { toast('Error creating playlist', 'error'); }
  }, [user, toast]);

  const saveSettings = useCallback(async (newTheme, newAccent) => {
    setTheme(newTheme);
    setAccent(newAccent);
    if (user) {
      try { await API.put('/api/user/settings', { theme: newTheme, accent: newAccent }); }
      catch {}
    }
  }, [user]);

  const logout = useCallback(async () => {
    try { await API.post('/auth/logout'); } catch {}
    setUser(null);
    setPlaylists([]);
    setLikedTracks([]);
    setCurrentTrack(null);
    setQueue([]);
    setIsPlaying(false);
    toast('Signed out');
  }, [toast]);

  const value = {
    user, setUser, authLoading, logout,
    currentTrack, queue, setQueue, queueIndex, setQueueIndex,
    isPlaying, setIsPlaying,
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
    toasts, toast,
    searchQuery, setSearchQuery,
    API
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
};
export { API };
