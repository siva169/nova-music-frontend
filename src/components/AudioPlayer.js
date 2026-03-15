import { useEffect, useRef } from 'react';
import { useApp } from '../AppContext';

export default function AudioPlayer() {
  const {
    currentTrack, isPlaying, setIsPlaying,
    nextTrack, prevTrack, playerRef,
    progress, setProgress, duration, setDuration
  } = useApp();

  const audioRef = useRef(null);
  const keepAliveRef = useRef(null);

  // Create silent audio element on mount
  useEffect(() => {
    // Create a proper audio context with silence
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    gainNode.gain.value = 0.00001; // Nearly silent
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.start();

    audioRef.current = { ctx, oscillator, gainNode };

    // Keep service worker alive with periodic pings
    if ('serviceWorker' in navigator) {
      keepAliveRef.current = setInterval(() => {
        navigator.serviceWorker.ready.then(reg => {
          reg.active?.postMessage({ type: 'KEEP_ALIVE' });
        });
      }, 20000); // Ping every 20 seconds
    }

    return () => {
      oscillator.stop();
      ctx.close();
      clearInterval(keepAliveRef.current);
    };
  }, []);

  // Resume audio context on play (required by browsers)
  useEffect(() => {
    if (isPlaying && audioRef.current?.ctx?.state === 'suspended') {
      audioRef.current.ctx.resume();
    }
  }, [isPlaying]);

  // Media Session API - Lock Screen Controls
  useEffect(() => {
    if (!currentTrack || !('mediaSession' in navigator)) return;

    // Set lock screen metadata
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: currentTrack.channel,
      album: 'NOVA Music',
      artwork: [
        { src: currentTrack.thumbnail, sizes: '96x96',   type: 'image/jpeg' },
        { src: currentTrack.thumbnail, sizes: '256x256', type: 'image/jpeg' },
        { src: currentTrack.thumbnail, sizes: '512x512', type: 'image/jpeg' },
      ]
    });

    // Lock screen button handlers
    const handlers = {
      'play': () => {
        setIsPlaying(true);
        playerRef.current?.playVideo?.();
        if (audioRef.current?.ctx?.state === 'suspended') {
          audioRef.current.ctx.resume();
        }
        navigator.mediaSession.playbackState = 'playing';
      },
      'pause': () => {
        setIsPlaying(false);
        playerRef.current?.pauseVideo?.();
        navigator.mediaSession.playbackState = 'paused';
      },
      'nexttrack': () => nextTrack(),
      'previoustrack': () => prevTrack(),
      'seekbackward': (d) => {
        const t = Math.max(0, (playerRef.current?.getCurrentTime?.() || 0) - (d.seekOffset || 10));
        playerRef.current?.seekTo?.(t, true);
        setProgress(t);
      },
      'seekforward': (d) => {
        const t = Math.min(duration, (playerRef.current?.getCurrentTime?.() || 0) + (d.seekOffset || 10));
        playerRef.current?.seekTo?.(t, true);
        setProgress(t);
      },
      'stop': () => {
        setIsPlaying(false);
        playerRef.current?.pauseVideo?.();
      }
    };

    Object.entries(handlers).forEach(([action, handler]) => {
      try { navigator.mediaSession.setActionHandler(action, handler); } catch {}
    });

  }, [currentTrack, duration]);

  // Sync playback state with lock screen
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
  }, [isPlaying]);

  // Update lock screen progress bar
  useEffect(() => {
    if (!('mediaSession' in navigator) || !duration || duration <= 0) return;
    try {
      navigator.mediaSession.setPositionState({
        duration: duration,
        playbackRate: 1,
        position: Math.min(Math.max(0, progress), duration)
      });
    } catch {}
  }, [progress, duration]);

  return null;
}
