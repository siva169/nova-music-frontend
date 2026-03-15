import React, { useState, useEffect } from 'react';
import { useApp, API } from '../AppContext';

function getApproxSize(durationMins, format, quality) {
  const dur = parseFloat(durationMins) || 4;
  const sizes = {
    'mp3-320': dur * 2.4, 'mp3-192': dur * 1.44, 'mp3-128': dur * 0.96,
    'mp4-1080': dur * 150, 'mp4-720': dur * 80, 'mp4-480': dur * 40,
    'wav-best': dur * 10.5, 'ogg-high': dur * 1.92,
  };
  const mb = sizes[`${format}-${quality}`] || dur * 1.5;
  return mb >= 1000 ? `${(mb/1000).toFixed(1)} GB` : `~${Math.round(mb)} MB`;
}

function parseDuration(iso) {
  if (!iso) return '?';
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '?';
  const h = parseInt(match[1] || 0), m = parseInt(match[2] || 0), s = parseInt(match[3] || 0);
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  return `${m}:${String(s).padStart(2,'0')}`;
}

function formatViews(n) {
  if (!n) return '?';
  const num = parseInt(n);
  if (num >= 1e9) return `${(num/1e9).toFixed(1)}B`;
  if (num >= 1e6) return `${(num/1e6).toFixed(1)}M`;
  if (num >= 1e3) return `${(num/1e3).toFixed(1)}K`;
  return `${num}`;
}

// ── Download using cobalt.tools (no server needed) ────────────────────
async function downloadViaCobalt(videoId, format, quality, title, toast) {
  const url = `https://www.youtube.com/watch?v=${videoId}`;
  toast('Preparing download...', 'info');

  try {
    const isAudio = ['mp3', 'wav', 'ogg'].includes(format);
    const body = {
      url,
      videoQuality: quality === '1080' ? '1080' : quality === '720' ? '720' : '480',
      audioFormat: format === 'wav' ? 'wav' : format === 'ogg' ? 'ogg' : 'mp3',
      audioBitrate: quality === '320' ? '320' : quality === '128' ? '128' : '192',
      downloadMode: isAudio ? 'audio' : 'auto',
      filenameStyle: 'basic',
    };

    const res = await fetch('https://api.cobalt.tools/v1/json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await res.json();

    if (data.status === 'redirect' || data.status === 'stream' || data.status === 'tunnel') {
      const link = document.createElement('a');
      link.href = data.url;
      link.download = `${title}.${format}`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast(`Download started! Check your downloads folder ✓`);
      return true;
    } else if (data.status === 'picker') {
      window.open(data.picker?.[0]?.url || url, '_blank');
      toast('Opening download link...');
      return true;
    } else {
      throw new Error(data.error?.code || 'Download failed');
    }
  } catch (err) {
    // Fallback — open y2mate
    window.open(`https://www.y2mate.com/youtube/${videoId}`, '_blank');
    toast('Opened download page in new tab!', 'info');
    return false;
  }
}

// ── Download Panel ────────────────────────────────────────────────────
function DownloadPanel({ track, durationMins }) {
  const [done, setDone] = useState(null);
  const { toast } = useApp();

  const FORMATS = [
    {
      id: 'audio', label: '🎵 Audio Only',
      options: [
        { format: 'mp3', quality: '320', label: 'MP3 — 320 kbps', desc: 'Best quality' },
        { format: 'mp3', quality: '192', label: 'MP3 — 192 kbps', desc: 'Recommended' },
        { format: 'mp3', quality: '128', label: 'MP3 — 128 kbps', desc: 'Smaller file' },
        { format: 'wav', quality: 'best', label: 'WAV — Lossless', desc: 'Studio quality' },
        { format: 'ogg', quality: 'high', label: 'OGG — High', desc: 'Open format' },
      ]
    },
    {
      id: 'video', label: '🎬 Video + Audio',
      options: [
        { format: 'mp4', quality: '1080', label: 'MP4 — 1080p Full HD', desc: 'Best video quality' },
        { format: 'mp4', quality: '720', label: 'MP4 — 720p HD', desc: 'Recommended' },
        { format: 'mp4', quality: '480', label: 'MP4 — 480p', desc: 'Smaller file' },
      ]
    }
  ];

  function handleDownload(format, quality) {
    const key = `${format}-${quality}`;
    const videoUrl = `https://www.youtube.com/watch?v=${track.id}`;
    const isAudio = ['mp3', 'wav', 'ogg'].includes(format);
    // Open cobalt.tools - best free downloader, no ads, works in browser
    window.open(`https://cobalt.tools/?u=${encodeURIComponent(videoUrl)}`, '_blank');
    setDone(key);
    toast(`Opening download for: ${track.title} — select ${format.toUpperCase()} in the page`);
    setTimeout(() => setDone(null), 5000);
  }

  return (
    <div>
      {FORMATS.map(group => (
        <div key={group.id} style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>
            {group.label}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {group.options.map(({ format, quality, label, desc }) => {
              const key = `${format}-${quality}`;
              const isDown = false;
              const isDone = done === key;
              const size = getApproxSize(durationMins, format, quality);
              return (
                <button key={key} onClick={() => handleDownload(format, quality)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 16px', borderRadius: 12, textAlign: 'left',
                    background: isDone ? 'rgba(0,255,136,0.08)' : 'var(--bg-card)',
                    border: `1px solid ${isDone ? 'rgba(0,255,136,0.3)' : 'var(--border)'}`,
                    cursor: 'pointer', transition: 'all 0.2s'
                  }}
                  onMouseOver={e => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.borderColor = 'var(--border-accent)'; }}
                  onMouseOut={e => { e.currentTarget.style.background = isDone ? 'rgba(0,255,136,0.08)' : 'var(--bg-card)'; e.currentTarget.style.borderColor = isDone ? 'rgba(0,255,136,0.3)' : 'var(--border)'; }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2, color: isDone ? '#00ff88' : 'var(--text-primary)' }}>
                      {isDone ? '✓ Opening download!' : label}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{desc}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, marginLeft: 12 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--surface)', padding: '3px 8px', borderRadius: 6, whiteSpace: 'nowrap' }}>
                      {size}
                    </span>
                    {isDown
                      ? <div style={{ width: 16, height: 16, border: '2px solid var(--border)', borderTop: '2px solid var(--accent)', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                      : isDone
                        ? <span style={{ color: '#00ff88' }}>✓</span>
                        : <span style={{ color: 'var(--accent)', fontSize: 16 }}>⬇</span>
                    }
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <div style={{ fontSize: 11, color: 'var(--text-muted)', padding: '10px 14px', background: 'var(--surface)', borderRadius: 10, lineHeight: 1.6 }}>
        💡 Downloads powered by <strong>cobalt.tools</strong> — free, fast, no account needed.
        If a format fails, try <a href={`https://cobalt.tools/?url=https://youtube.com/watch?v=${track.id}`} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>cobalt.tools directly</a>
      </div>
    </div>
  );
}

// ── Main Track Info Modal ─────────────────────────────────────────────
export default function TrackInfoModal({ track, onClose }) {
  const { playTrack, currentTrack, isPlaying, toggleLike, likedTracks, playlists, addToPlaylist, toast } = useApp();
  const [tab, setTab] = useState('info');
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  const isCurrentTrack = currentTrack?.id === track.id;
  const isLiked = likedTracks.some(t => t.id === track.id);

  useEffect(() => {
    API.get(`/api/video/${track.id}`).then(r => setDetails(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [track.id]);

  const durationMins = details?.duration
    ? (() => {
        const m = details.duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        if (!m) return 4;
        return (parseInt(m[1]||0)*60 + parseInt(m[2]||0) + parseInt(m[3]||0)/60);
      })()
    : 4;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      zIndex: 9999, animation: 'fadeIn 0.2s ease'
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: 'var(--bg-elevated)', borderRadius: '20px 20px 0 0',
        width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto',
        animation: 'slideUp 0.3s ease', border: '1px solid var(--border-accent)'
      }}>
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
          <div style={{ width: 40, height: 4, borderRadius: 99, background: 'var(--border)' }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', gap: 14, padding: '16px 20px', alignItems: 'center' }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <img src={track.thumbnail} alt={track.title}
              style={{ width: 70, height: 70, borderRadius: 12, objectFit: 'cover', border: isCurrentTrack ? '2px solid var(--accent)' : '2px solid var(--border)' }} />
            {isCurrentTrack && isPlaying && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="eq-bars"><span /><span /><span /></div>
              </div>
            )}
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.title}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>{track.channel}</div>
            {!loading && details && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {details.duration && <span style={{ fontSize: 11, background: 'var(--surface)', padding: '3px 8px', borderRadius: 6, color: 'var(--text-muted)' }}>⏱ {parseDuration(details.duration)}</span>}
                {details.viewCount && <span style={{ fontSize: 11, background: 'var(--surface)', padding: '3px 8px', borderRadius: 6, color: 'var(--text-muted)' }}>👁 {formatViews(details.viewCount)}</span>}
                {details.likeCount && <span style={{ fontSize: 11, background: 'var(--surface)', padding: '3px 8px', borderRadius: 6, color: 'var(--text-muted)' }}>👍 {formatViews(details.likeCount)}</span>}
              </div>
            )}
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)', fontSize: 20, padding: 4, flexShrink: 0 }}>✕</button>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8, padding: '0 20px 16px', flexWrap: 'wrap' }}>
          <button onClick={() => { playTrack(track, [track], 0); onClose(); }} className="btn-accent" style={{ flex: 1, padding: 10, fontSize: 13 }}>
            {isCurrentTrack && isPlaying ? '⏸ Pause' : '▶ Play'}
          </button>
          <button onClick={() => toggleLike(track)} style={{ padding: '10px 16px', borderRadius: 99, background: isLiked ? 'rgba(255,45,85,0.15)' : 'var(--surface)', border: `1px solid ${isLiked ? '#ff2d55' : 'var(--border)'}`, color: isLiked ? '#ff2d55' : 'var(--text-secondary)', fontSize: 13, fontWeight: 600 }}>
            {isLiked ? '♥ Liked' : '♡ Like'}
          </button>
          <a href={`https://youtube.com/watch?v=${track.id}`} target="_blank" rel="noreferrer"
            style={{ padding: '10px 16px', borderRadius: 99, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
            ▶ YT
          </a>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 20px' }}>
          {[{ id: 'info', label: 'ℹ Info' }, { id: 'download', label: '⬇ Download' }, { id: 'playlist', label: '＋ Add to' }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '10px 16px', fontSize: 13, fontWeight: tab === t.id ? 700 : 400,
              color: tab === t.id ? 'var(--accent)' : 'var(--text-muted)',
              borderBottom: tab === t.id ? '2px solid var(--accent)' : '2px solid transparent',
              transition: 'all 0.2s', marginBottom: -1
            }}>{t.label}</button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ padding: 20 }}>
          {tab === 'info' && (
            <div>
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 16, borderRadius: 6 }} />)}
                </div>
              ) : (
                <>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 16 }}>
                    {details?.description ? details.description.slice(0, 300) + (details.description.length > 300 ? '...' : '') : 'No description available.'}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {[
                      { label: 'Channel', value: details?.channel || track.channel },
                      { label: 'Duration', value: parseDuration(details?.duration) },
                      { label: 'Views', value: formatViews(details?.viewCount) },
                      { label: 'Published', value: details?.publishedAt ? new Date(details.publishedAt).toLocaleDateString() : '?' },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ background: 'var(--surface)', borderRadius: 10, padding: '10px 14px' }}>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{label}</div>
                        <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {tab === 'download' && <DownloadPanel track={track} durationMins={durationMins} />}

          {tab === 'playlist' && (
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>Add to your playlists:</div>
              {playlists.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)', fontSize: 13 }}>No playlists yet — create one from the sidebar!</div>
              ) : playlists.map(pl => (
                <button key={pl.id} onClick={() => { addToPlaylist(pl.id, track); toast(`Added to ${pl.name} ✓`); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '12px 14px', borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)', marginBottom: 8, cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseOver={e => { e.currentTarget.style.background = 'var(--surface-hover)'; e.currentTarget.style.borderColor = 'var(--border-accent)'; }}
                  onMouseOut={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: pl.coverColor || 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>♫</div>
                  <div style={{ textAlign: 'left', flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{pl.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{pl.tracks?.length || 0} songs</div>
                  </div>
                  <span style={{ color: 'var(--accent)', fontSize: 18 }}>⊕</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div style={{ height: 20 }} />
      </div>
      <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
    </div>
  );
}
