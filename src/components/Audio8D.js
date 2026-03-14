// ════════════════════════════════════════════════════════════════
//  NOVA — Advanced 8D Audio Engine + Download Manager
//  Save this as: frontend/src/components/Audio8D.js
// ════════════════════════════════════════════════════════════════
//
//  HOW THE REAL 8D WORKS:
//  YouTube audio can't be intercepted by Web Audio API directly
//  because of browser security. The REAL way to get true 8D is:
//
//  1. Use yt-dlp on backend to download audio stream
//  2. Process it through Web Audio API nodes:
//     - HRTF Panner (binaural head simulation)
//     - Convolver (room reverb)
//     - Tremolo LFO (volume oscillation)
//     - Bass boost EQ
//     - Stereo width enhancer
//  3. Stream processed audio to frontend
//
//  This file contains:
//  A) Instructions to set up yt-dlp backend processing
//  B) A client-side 8D visualizer/controller UI
//  C) Download manager with format selection
// ════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../AppContext';

// ── 8D Visualizer Component ──────────────────────────────────────
export function Audio8DVisualizer({ is8D, onToggle }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const angleRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width = 120;
    const H = canvas.height = 120;
    const cx = W / 2, cy = H / 2;

    function draw() {
      ctx.clearRect(0, 0, W, H);

      if (!is8D) {
        // Static circle when off
        ctx.beginPath();
        ctx.arc(cx, cy, 40, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.font = 'bold 14px Outfit';
        ctx.textAlign = 'center';
        ctx.fillText('8D', cx, cy + 5);
        return;
      }

      angleRef.current += 0.025;
      const angle = angleRef.current;

      // Outer ring
      ctx.beginPath();
      ctx.arc(cx, cy, 50, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0, 212, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Middle ring
      ctx.beginPath();
      ctx.arc(cx, cy, 35, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0, 212, 255, 0.25)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Rotating sound dot
      const dotX = cx + Math.sin(angle) * 50;
      const dotY = cy + Math.cos(angle) * 20;

      // Glow
      const grad = ctx.createRadialGradient(dotX, dotY, 0, dotX, dotY, 12);
      grad.addColorStop(0, 'rgba(0, 212, 255, 0.9)');
      grad.addColorStop(1, 'rgba(0, 212, 255, 0)');
      ctx.beginPath();
      ctx.arc(dotX, dotY, 12, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Trail
      for (let i = 1; i <= 8; i++) {
        const trailAngle = angle - i * 0.15;
        const tx = cx + Math.sin(trailAngle) * 50;
        const ty = cy + Math.cos(trailAngle) * 20;
        ctx.beginPath();
        ctx.arc(tx, ty, 4 * (1 - i / 8), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 212, 255, ${0.3 * (1 - i / 8)})`;
        ctx.fill();
      }

      // Head outline (ears)
      ctx.beginPath();
      ctx.arc(cx, cy, 18, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0, 212, 255, 0.4)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Left ear
      ctx.beginPath();
      ctx.arc(cx - 18, cy, 5, Math.PI * 0.5, Math.PI * 1.5);
      ctx.fillStyle = 'rgba(0, 212, 255, 0.5)';
      ctx.fill();

      // Right ear
      ctx.beginPath();
      ctx.arc(cx + 18, cy, 5, -Math.PI * 0.5, Math.PI * 0.5);
      ctx.fillStyle = 'rgba(0, 212, 255, 0.5)';
      ctx.fill();

      // 8D label
      ctx.fillStyle = 'rgba(0, 212, 255, 0.9)';
      ctx.font = 'bold 11px Outfit';
      ctx.textAlign = 'center';
      ctx.fillText('8D', cx, cy + 4);

      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [is8D]);

  return (
    <canvas ref={canvasRef} onClick={onToggle}
      style={{ cursor: 'pointer', borderRadius: '50%' }}
      title={is8D ? 'Disable 8D Audio' : 'Enable 8D Audio'} />
  );
}

// ── Download Manager Component ───────────────────────────────────
export function DownloadManager({ track, onClose }) {
  const [status, setStatus] = useState('idle'); // idle | checking | downloading | done | error
  const [format, setFormat] = useState('mp3');
  const [quality, setQuality] = useState('192');
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const { toast } = useApp();

  const FORMATS = [
    { id: 'mp3', label: 'MP3', icon: '🎵', desc: 'Best compatibility' },
    { id: 'mp4', label: 'MP4', icon: '🎬', desc: 'Video + Audio' },
    { id: 'webm', label: 'WebM', icon: '🌐', desc: 'Web optimized' },
    { id: 'wav', label: 'WAV', icon: '🎹', desc: 'Lossless quality' },
    { id: 'ogg', label: 'OGG', icon: '🔊', desc: 'Open format' },
  ];

  const QUALITIES = {
    mp3: [
      { id: '320', label: '320 kbps', desc: 'Best quality' },
      { id: '192', label: '192 kbps', desc: 'Recommended' },
      { id: '128', label: '128 kbps', desc: 'Smaller file' },
    ],
    mp4: [
      { id: '1080', label: '1080p', desc: 'Full HD' },
      { id: '720', label: '720p', desc: 'HD' },
      { id: '480', label: '480p', desc: 'Standard' },
    ],
    webm: [
      { id: '1080', label: '1080p', desc: 'Full HD' },
      { id: '720', label: '720p', desc: 'HD' },
    ],
    wav: [{ id: 'best', label: 'Lossless', desc: 'Original quality' }],
    ogg: [
      { id: 'high', label: 'High', desc: '~256 kbps' },
      { id: 'medium', label: 'Medium', desc: '~128 kbps' },
    ],
  };

  async function startDownload() {
    setStatus('downloading');
    setProgress(0);
    setMessage('Connecting to server...');

    try {
      // Simulate progress while backend downloads
      const interval = setInterval(() => {
        setProgress(p => {
          if (p >= 90) { clearInterval(interval); return 90; }
          return p + Math.random() * 8;
        });
      }, 400);

      const response = await fetch(
        `http://localhost:3001/api/download?videoId=${track.id}&format=${format}&quality=${quality}`,
        { credentials: 'include' }
      );

      clearInterval(interval);
      setProgress(100);

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Download failed');
      }

      // Get filename from header
      const disposition = response.headers.get('content-disposition');
      const filename = disposition
        ? disposition.split('filename=')[1]?.replace(/"/g, '')
        : `${track.title}.${format}`;

      // Trigger browser download
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setStatus('done');
      setMessage('Download complete! ✓');
      toast(`Downloaded: ${track.title} ✓`);

    } catch (err) {
      setStatus('error');
      setMessage(err.message || 'Download failed. Make sure yt-dlp is installed on backend.');
      toast('Download failed — see setup guide', 'error');
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, animation: 'fadeIn 0.2s ease'
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: 'var(--bg-elevated)', border: '1px solid var(--border-accent)',
        borderRadius: 'var(--radius-xl)', padding: 28, width: '90%', maxWidth: 480,
        boxShadow: '0 24px 80px rgba(0,0,0,0.6)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          <img src={track.thumbnail} alt={track.title} style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover' }} />
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.title}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{track.channel}</div>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)', fontSize: 20, padding: 4 }}>✕</button>
        </div>

        {status === 'idle' && <>
          {/* Format Selection */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Format</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {FORMATS.map(f => (
                <button key={f.id} onClick={() => { setFormat(f.id); setQuality(QUALITIES[f.id][0].id); }}
                  style={{
                    padding: '8px 14px', borderRadius: 10,
                    background: format === f.id ? 'var(--accent-dim)' : 'var(--surface)',
                    border: `1px solid ${format === f.id ? 'var(--border-accent)' : 'var(--border)'}`,
                    color: format === f.id ? 'var(--accent)' : 'var(--text-secondary)',
                    fontSize: 13, fontWeight: 600, transition: 'var(--transition)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2
                  }}>
                  <span>{f.icon} {f.label}</span>
                  <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--text-muted)' }}>{f.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quality Selection */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Quality</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {(QUALITIES[format] || []).map(q => (
                <button key={q.id} onClick={() => setQuality(q.id)}
                  style={{
                    padding: '8px 16px', borderRadius: 10,
                    background: quality === q.id ? 'var(--accent-dim)' : 'var(--surface)',
                    border: `1px solid ${quality === q.id ? 'var(--border-accent)' : 'var(--border)'}`,
                    color: quality === q.id ? 'var(--accent)' : 'var(--text-secondary)',
                    fontSize: 13, transition: 'var(--transition)'
                  }}>
                  <div style={{ fontWeight: 700 }}>{q.label}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{q.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Notice */}
          <div style={{ background: 'rgba(255,214,10,0.08)', border: '1px solid rgba(255,214,10,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: 'rgba(255,214,10,0.8)' }}>
            ⚠️ Requires <strong>yt-dlp</strong> installed on your backend. See setup guide below.
          </div>

          {/* YouTube link alternative */}
          <div style={{ background: 'var(--surface)', borderRadius: 10, padding: '10px 14px', marginBottom: 20, fontSize: 12, color: 'var(--text-muted)' }}>
            💡 Alternative: <a href={`https://youtube.com/watch?v=${track.id}`} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>Open on YouTube</a> and use a YouTube downloader site like <strong>y2mate.com</strong> or <strong>cobalt.tools</strong>
          </div>

          <button onClick={startDownload} className="btn-accent" style={{ width: '100%', padding: '13px', fontSize: 15 }}>
            ⬇ Download {format.toUpperCase()} {quality !== 'best' && quality !== 'high' && quality !== 'medium' ? quality : ''}
          </button>
        </>}

        {status === 'downloading' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 36, marginBottom: 16 }}>⬇️</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>{message || 'Downloading...'}</div>
            <div style={{ background: 'var(--surface)', borderRadius: 99, height: 6, overflow: 'hidden', marginBottom: 8 }}>
              <div style={{ width: `${progress}%`, height: '100%', background: 'var(--accent)', borderRadius: 99, transition: 'width 0.3s ease' }} />
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{Math.round(progress)}%</div>
          </div>
        )}

        {status === 'done' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Download Complete!</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>Check your Downloads folder</div>
            <button onClick={onClose} className="btn-accent">Done</button>
          </div>
        )}

        {status === 'error' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>❌</div>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: '#ff2d55' }}>Download Failed</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.6 }}>{message}</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setStatus('idle')} className="btn-ghost">Try Again</button>
              <button onClick={onClose} className="btn-accent">Close</button>
            </div>
          </div>
        )}

        {/* Setup Guide */}
        {status === 'idle' && (
          <details style={{ marginTop: 16 }}>
            <summary style={{ fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none' }}>
              📋 How to enable downloads (setup guide)
            </summary>
            <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.8, background: 'var(--surface)', borderRadius: 10, padding: 12 }}>
              <strong style={{ color: 'var(--text-primary)' }}>Step 1:</strong> Install yt-dlp<br />
              Open terminal and run:<br />
              <code style={{ background: 'var(--bg-primary)', padding: '2px 8px', borderRadius: 4, color: 'var(--accent)' }}>pip install yt-dlp</code><br /><br />
              <strong style={{ color: 'var(--text-primary)' }}>Step 2:</strong> Install ffmpeg<br />
              Download from <a href="https://ffmpeg.org/download.html" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>ffmpeg.org</a> and add to PATH<br /><br />
              <strong style={{ color: 'var(--text-primary)' }}>Step 3:</strong> Add download route to backend<br />
              Ask Claude to add the download endpoint to server.js
            </div>
          </details>
        )}
      </div>
    </div>
  );
}

// ── 8D Setup Guide Component ─────────────────────────────────────
export function Audio8DGuide({ onClose }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: 'var(--bg-elevated)', border: '1px solid var(--border-accent)',
        borderRadius: 'var(--radius-xl)', padding: 28, width: '90%', maxWidth: 520,
        maxHeight: '80vh', overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ fontSize: 18, fontWeight: 800 }}>🎧 True 8D Audio Setup</div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)', fontSize: 20 }}>✕</button>
        </div>

        <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.8 }}>
          <div style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 10, padding: 14, marginBottom: 16 }}>
            <strong style={{ color: 'var(--accent)' }}>Why current 8D is limited:</strong><br />
            Browsers block Web Audio API from processing YouTube's audio stream directly for security. To get truly immersive 8D, the audio must be processed on the backend.
          </div>

          <strong style={{ color: 'var(--text-primary)', fontSize: 14 }}>The Solution — Backend 8D Processing:</strong>
          <br /><br />

          <strong>Step 1 — Install yt-dlp + ffmpeg</strong><br />
          <code style={{ background: 'var(--bg-primary)', padding: '4px 10px', borderRadius: 6, color: 'var(--accent)', display: 'block', margin: '6px 0' }}>pip install yt-dlp</code>
          Download ffmpeg from ffmpeg.org and add to Windows PATH<br /><br />

          <strong>Step 2 — Install SoX (Sound effects processor)</strong><br />
          Download from <a href="https://sox.sourceforge.net" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>sox.sourceforge.net</a><br /><br />

          <strong>Step 3 — The 8D audio chain used:</strong><br />
          <div style={{ background: 'var(--bg-primary)', borderRadius: 8, padding: 12, margin: '8px 0', fontFamily: 'monospace', fontSize: 11 }}>
            YouTube Audio<br />
            → HRTF Binaural Panning (ear simulation)<br />
            → Room Reverb (concert hall effect)<br />
            → Tremolo LFO (volume wave 0.1Hz)<br />
            → Bass Boost EQ (+6dB at 60Hz)<br />
            → Stereo Widener (M/S processing)<br />
            → Output (true immersive 8D)
          </div>

          <strong>Step 4 — Add to backend server.js:</strong><br />
          <div style={{ background: 'var(--bg-primary)', borderRadius: 8, padding: 12, margin: '8px 0', fontFamily: 'monospace', fontSize: 11, color: '#00ff88' }}>
            {`app.get('/api/stream8d/:videoId', async (req, res) => {
  const { videoId } = req.params;
  // yt-dlp extracts audio stream
  // ffmpeg applies 8D chain:
  // -af "apulsator=hz=0.1,
  //      aecho=1:0.8:60:0.4,
  //      equalizer=f=60:t=o:w=2:g=6,
  //      stereotools=mlev=0.015"
  // Streams processed audio to client
})`}
          </div>

          <div style={{ background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.2)', borderRadius: 10, padding: 12, marginTop: 12 }}>
            💡 <strong style={{ color: '#00ff88' }}>Quick tip:</strong> Ask Claude to add the full 8D streaming endpoint to your server.js — just paste this guide and say "add the 8D streaming route"!
          </div>
        </div>
      </div>
    </div>
  );
}
