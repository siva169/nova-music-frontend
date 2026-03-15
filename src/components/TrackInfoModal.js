import React, { useState, useEffect } from 'react';
import { useApp, API } from '../AppContext';

function parseDuration(iso) {
  if (!iso) return '?';
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return '?';
  const h = parseInt(m[1]||0), mn = parseInt(m[2]||0), s = parseInt(m[3]||0);
  if (h > 0) return `${h}:${String(mn).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  return `${mn}:${String(s).padStart(2,'0')}`;
}

function formatNum(n) {
  if (!n) return '?';
  const num = parseInt(n);
  if (num >= 1e9) return `${(num/1e9).toFixed(1)}B`;
  if (num >= 1e6) return `${(num/1e6).toFixed(1)}M`;
  if (num >= 1e3) return `${(num/1e3).toFixed(1)}K`;
  return `${num}`;
}

function getDurMins(iso) {
  if (!iso) return 4;
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 4;
  return parseInt(m[1]||0)*60 + parseInt(m[2]||0) + parseInt(m[3]||0)/60;
}

// ── Download Panel ────────────────────────────────────────────────────
function DownloadPanel({ track, details }) {
  const { toast } = useApp();
  const dur = getDurMins(details?.duration);
  const ytUrl = `https://www.youtube.com/watch?v=${track.id}`;
  const enc = encodeURIComponent(ytUrl);

  const SERVICES = [
    { name: 'SnapSave', icon: '⚡', desc: 'Most reliable', color: '#00d4ff', url: `https://snapsave.app/result?url=${enc}` },
    { name: 'SSYouTube', icon: '🎵', desc: 'Direct MP3', color: '#00ff88', url: `https://www.ssyoutube.com/watch?v=${track.id}` },
    { name: 'SaveFrom', icon: '📥', desc: 'All formats', color: '#bf5af2', url: `https://en.savefrom.net/1-youtube-video-downloader/?url=${ytUrl}` },
    { name: 'Y2Mate', icon: '🎬', desc: 'Video & audio', color: '#ff9f0a', url: `https://www.y2mate.com/youtube/${track.id}` },
  ];

  const FORMATS = [
    { label: `🎵 MP3 Best Quality (~${Math.round(dur*2.4)} MB)`, url: `https://www.ssyoutube.com/watch?v=${track.id}` },
    { label: `🎵 MP3 Standard (~${Math.round(dur*1.44)} MB)`, url: `https://snapsave.app/result?url=${enc}` },
    { label: `🎬 MP4 1080p (~${Math.round(dur*150)} MB)`, url: `https://snapsave.app/result?url=${enc}` },
    { label: `🎬 MP4 720p (~${Math.round(dur*80)} MB)`, url: `https://en.savefrom.net/1-youtube-video-downloader/?url=${ytUrl}` },
    { label: `🎬 MP4 480p (~${Math.round(dur*40)} MB)`, url: `https://www.y2mate.com/youtube/${track.id}` },
  ];

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 }}>Quick Download</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {SERVICES.map(({ name, icon, desc, color, url }) => (
            <button key={name} onClick={() => { window.open(url, '_blank'); toast(`Opening ${name}...`); }}
              style={{ padding: '12px', borderRadius: 12, textAlign: 'left', cursor: 'pointer', background: `${color}12`, border: `1px solid ${color}33`, transition: 'all 0.2s' }}
              onMouseOver={e => { e.currentTarget.style.background = `${color}22`; e.currentTarget.style.borderColor = `${color}66`; }}
              onMouseOut={e => { e.currentTarget.style.background = `${color}12`; e.currentTarget.style.borderColor = `${color}33`; }}
            >
              <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: color }}>{name}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{desc}</div>
            </button>
          ))}
        </div>
      </div>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 }}>By Format & Size</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {FORMATS.map(({ label, url }) => (
            <button key={label} onClick={() => { window.open(url, '_blank'); toast('Opening download...'); }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 10, cursor: 'pointer', background: 'var(--bg-card)', border: '1px solid var(--border)', transition: 'all 0.2s', textAlign: 'left' }}
              onMouseOver={e => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.borderColor = 'var(--border-accent)'; }}
              onMouseOut={e => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
            >
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{label}</span>
              <span style={{ color: 'var(--accent)', fontSize: 18, marginLeft: 8 }}>⬇</span>
            </button>
          ))}
        </div>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', padding: '10px 12px', background: 'var(--surface)', borderRadius: 10, lineHeight: 1.7, marginTop: 12 }}>
        💡 Click any button → site opens → click download → file saves to your device
      </div>
    </div>
  );
}


// ── Main Modal ────────────────────────────────────────────────────────
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
                {details.viewCount && <span style={{ fontSize: 11, background: 'var(--surface)', padding: '3px 8px', borderRadius: 6, color: 'var(--text-muted)' }}>👁 {formatNum(details.viewCount)}</span>}
                {details.likeCount && <span style={{ fontSize: 11, background: 'var(--surface)', padding: '3px 8px', borderRadius: 6, color: 'var(--text-muted)' }}>👍 {formatNum(details.likeCount)}</span>}
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
          <button onClick={() => toggleLike(track)} style={{ padding: '10px 16px', borderRadius: 99, background: isLiked ? 'rgba(255,45,85,0.15)' : 'var(--surface)', border: `1px solid ${isLiked ? '#ff2d55' : 'var(--border)'}`, color: isLiked ? '#ff2d55' : 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
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
              transition: 'all 0.2s', marginBottom: -1, cursor: 'pointer', background: 'none', border: 'none',
              borderBottom: tab === t.id ? '2px solid var(--accent)' : '2px solid transparent',
            }}>{t.label}</button>
          ))}
        </div>

        {/* Content */}
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
                      { label: 'Views', value: formatNum(details?.viewCount) },
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

          {tab === 'download' && <DownloadPanel track={track} details={details} />}

          {tab === 'playlist' && (
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>Add to your playlists:</div>
              {playlists.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)', fontSize: 13 }}>No playlists yet!</div>
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
