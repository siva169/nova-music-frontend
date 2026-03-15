// ── NOVA Audio Player ─────────────────────────────────────────────────
// Uses YouTube iframe for video + a silent HTML5 audio element trick
// to register with the browser's media session (lock screen controls)

import { useEffect, useRef } from 'react';
import { useApp } from '../AppContext';

// Silent audio file (1 second of silence) as base64
// This keeps the audio session alive and registers media session
const SILENT_AUDIO = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAABIADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV6urq6urq6urq6urq6urq6urq6urq6urq6v////////////////////////////////8AAAAATGF2YzU4LjU0AAAAAAAAAAAAAAAAJAAAAAAAAAAAASDs90hvAAAAAAAAAAAAAAAAAAAA//OEZAAABpABpAAAAGkAKgAAAAATEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';

export default function AudioPlayer() {
  const {
    currentTrack, isPlaying, setIsPlaying,
    nextTrack, prevTrack, playerRef,
    progress, duration
  } = useApp();

  const audioRef = useRef(null);
  const intervalRef = useRef(null);

  // Create hidden audio element on mount
  useEffect(() => {
    if (!audioRef.current) {
      const audio = new Audio(SILENT_AUDIO);
      audio.loop = true;
      audio.volume = 0.001; // nearly silent
      audioRef.current = audio;
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // When playing state changes — start/stop silent audio to keep session alive
  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  // Update media session whenever track changes
  useEffect(() => {
    if (!currentTrack || !('mediaSession' in navigator)) return;

    // Set metadata
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: currentTrack.channel,
      album: 'NOVA Music',
      artwork: [
        { src: currentTrack.thumbnail, sizes: '512x512', type: 'image/jpeg' },
        { src: currentTrack.thumbnail, sizes: '256x256', type: 'image/jpeg' },
        { src: currentTrack.thumbnail, sizes: '128x128', type: 'image/jpeg' },
      ]
    });

    // Action handlers
    navigator.mediaSession.setActionHandler('play', () => {
      setIsPlaying(true);
      playerRef.current?.playVideo?.();
      audioRef.current?.play().catch(() => {});
      navigator.mediaSession.playbackState = 'playing';
    });

    navigator.mediaSession.setActionHandler('pause', () => {
      setIsPlaying(false);
      playerRef.current?.pauseVideo?.();
      audioRef.current?.pause();
      navigator.mediaSession.playbackState = 'paused';
    });

    navigator.mediaSession.setActionHandler('nexttrack', () => {
      nextTrack();
    });

    navigator.mediaSession.setActionHandler('previoustrack', () => {
      prevTrack();
    });

    navigator.mediaSession.setActionHandler('stop', () => {
      setIsPlaying(false);
      playerRef.current?.pauseVideo?.();
    });

    navigator.mediaSession.setActionHandler('seekbackward', (d) => {
      const skip = d.seekOffset || 10;
      const newTime = Math.max(0, (playerRef.current?.getCurrentTime?.() || 0) - skip);
      playerRef.current?.seekTo?.(newTime, true);
    });

    navigator.mediaSession.setActionHandler('seekforward', (d) => {
      const skip = d.seekOffset || 10;
      const newTime = Math.min(duration, (playerRef.current?.getCurrentTime?.() || 0) + skip);
      playerRef.current?.seekTo?.(newTime, true);
    });

  }, [currentTrack]);

  // Keep playback state in sync
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
  }, [isPlaying]);

  // Update position state for lock screen progress bar
  useEffect(() => {
    if (!('mediaSession' in navigator) || !duration) return;
    try {
      navigator.mediaSession.setPositionState({
        duration: duration,
        playbackRate: 1,
        position: Math.min(progress, duration)
      });
    } catch {}
  }, [progress, duration]);

  return null; // This component renders nothing visible
}
