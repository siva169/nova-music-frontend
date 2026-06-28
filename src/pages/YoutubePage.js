import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useApp, API } from '../AppContext';

// ── Category config ──────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: 'all',          label: 'All',           emoji: '🌐' },
  { id: 'podcasts',     label: 'Podcasts',      emoji: '🎙️' },
  { id: 'education',   label: 'Education',     emoji: '📚' },
  { id: 'technology',  label: 'Technology',    emoji: '💻' },
  { id: 'motivation',  label: 'Motivation',    emoji: '🔥' },
  { id: 'news',        label: 'News',          emoji: '📰' },
  { id: 'comedy',      label: 'Comedy',        emoji: '😂' },
  { id: 'spirituality',label: 'Spirituality',  emoji: '🧘' },
  { id: 'entertainment',label: 'Entertainment',emoji: '🎬' },
];

// ── Format helpers ────────────────────────────────────────────────────────────
function fmtDuration(secs) {
  if (!secs) return '';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  return `${m}:${String(s).padStart(2,'0')}`;
}

// ── Video Card ────────────────────────────────────────────────────────────────
function VideoCard({ track, queue, index }) {
  const { playTrack, currentTrack, isPlaying, toggleLike, likedTracks, playlists, addToPlaylist } = useApp();
  const isActive = currentTrack?.id === track.id;
  const isLiked  = likedTracks.some(t => t.id === track.id);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!showMenu) return;
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMenu]);

  return (
    <div style={{
      background: isActive ? 'rgba(255,255,255,0.06)' : 'var(--bg-card)',
      borderRadius: 12,
      overflow: 'hidden',
      cursor: 'pointer',
      border: isActive ? '1px solid var(--accent)' : '1px solid var(--border)',
      transition: 'all 0.2s',
    }}
      onMouseOver={e => { if (!isActive) e.currentTarget.style.background = 'var(--bg-elevated)'; }}
      onMouseOut={e  => { if (!isActive) e.currentTarget.style.background = 'var(--bg-card)'; }}
    >
      {/* Thumbnail */}
      <div onClick={() => playTrack(track, queue, index)}
        style={{ position: 'relative', paddingBottom: '56.25%', overflow: 'hidden' }}>
        <img src={track.thumbnail} alt="" style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover'
        }} />
        {/* Duration badge */}
        {track.duration > 0 && (
          <span style={{
            position: 'absolute', bottom: 6, right: 6,
            background: 'rgba(0,0,0,0.85)', color: '#fff',
            fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
          }}>{fmtDuration(track.duration)}</span>
        )}
        {/* Playing overlay */}
        {isActive && isPlaying && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div className="eq-bars"><span/><span/><span/></div>
          </div>
        )}
        {/* YouTube logo badge */}
        <span style={{
          position: 'absolute', top: 6, left: 6,
          background: '#ff0000', color: '#fff',
          fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 4,
          letterSpacing: 0.5,
        }}>▶ YT</span>
      </div>

      {/* Info + actions */}
      <div style={{ padding: '10px 10px 8px', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <div onClick={() => playTrack(track, queue, index)} style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 12, fontWeight: 600, lineHeight: 1.3,
            color: isActive ? 'var(--accent)' : 'var(--text-primary)',
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
            marginBottom: 3,
          }}>{track.title}</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {track.channel}
          </div>
        </div>
        {/* Action buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0, position: 'relative' }} ref={menuRef}>
          <button onClick={e => { e.stopPropagation(); toggleLike(track); }} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: isLiked ? '#ff2d55' : 'rgba(255,255,255,0.4)', fontSize: 14, padding: 2,
          }}>♥</button>
          <button onClick={e => { e.stopPropagation(); setShowMenu(v => !v); }} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'rgba(255,255,255,0.4)', fontSize: 16, padding: 2, lineHeight: 1,
          }}>⋮</button>
          {showMenu && (
            <div style={{
              position: 'absolute', top: 32, right: 0, zIndex: 999,
              background: 'var(--bg-elevated)', border: '1px solid var(--border)',
              borderRadius: 10, minWidth: 150, boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
              overflow: 'hidden',
            }}>
              {(playlists || []).map(pl => (
                <button key={pl.id} onClick={e => {
                  e.stopPropagation();
                  addToPlaylist(pl.id, track);
                  setShowMenu(false);
                }} style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '10px 14px', background: 'none', border: 'none',
                  color: 'var(--text-primary)', fontSize: 12, cursor: 'pointer',
                  borderBottom: '1px solid var(--border)',
                }}>
                  ➕ {pl.name}
                </button>
              ))}
              {(!playlists || playlists.length === 0) && (
                <div style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-muted)' }}>
                  No playlists yet
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Skeleton Loader ───────────────────────────────────────────────────────────
function VideoSkeleton() {
  return (
    <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
      <div className="skeleton" style={{ paddingBottom: '56.25%' }} />
      <div style={{ padding: 10 }}>
        <div className="skeleton" style={{ height: 12, borderRadius: 4, marginBottom: 6 }} />
        <div className="skeleton" style={{ height: 10, width: '60%', borderRadius: 4 }} />
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function YoutubePage() {
  const [activeCategory, setActiveCategory] = useState('podcasts');
  const [searchQuery, setSearchQuery]       = useState('');
  const [pasteUrl, setPasteUrl]             = useState('');
  const [items, setItems]                   = useState([]);
  const [loading, setLoading]               = useState(false);
  const [resolving, setResolving]           = useState(false);
  const [resolvedTrack, setResolvedTrack]   = useState(null);
  const [error, setError]                   = useState('');
  const [activeTab, setActiveTab]           = useState('discover'); // 'discover' | 'search'
  const searchTimeout = useRef(null);
  const { playTrack } = useApp();

  // Load category content
  const loadCategory = useCallback(async (cat) => {
    if (cat === 'all') cat = 'entertainment';
    setLoading(true);
    setError('');
    try {
      const r = await API.get(`/api/youtube/category/${cat}`);
      setItems(r.data.items || []);
    } catch {
      setError('Failed to load content. Try again.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'discover') loadCategory(activeCategory);
  }, [activeCategory, activeTab, loadCategory]);

  // Search with debounce
  const handleSearch = (q) => {
    setSearchQuery(q);
    clearTimeout(searchTimeout.current);
    if (!q.trim()) { setItems([]); return; }
    searchTimeout.current = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await API.get('/api/youtube/search', { params: { q } });
        setItems(r.data.items || []);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    }, 600);
  };

  // Resolve YouTube URL
  const handleResolveUrl = async () => {
    if (!pasteUrl.trim()) return;
    setResolving(true);
    setResolvedTrack(null);
    setError('');
    try {
      const r = await API.get('/api/youtube/resolve', { params: { url: pasteUrl.trim() } });
      setResolvedTrack(r.data);
    } catch {
      setError('Could not find that video. Check the URL and try again.');
    } finally {
      setResolving(false);
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.35s ease', paddingBottom: 80 }}>

      {/* ── Header ── */}
      <div style={{
        background: 'linear-gradient(135deg, #ff0000 0%, #c9000f 40%, #1a0000 100%)',
        borderRadius: 16, padding: '20px 18px', marginBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <span style={{ fontSize: 28 }}>▶</span>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: -0.5 }}>
              YouTube Audio
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)' }}>
              Podcasts · Education · News · Entertainment
            </div>
          </div>
        </div>

        {/* Paste YouTube URL */}
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <input
            value={pasteUrl}
            onChange={e => setPasteUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleResolveUrl()}
            placeholder="Paste any YouTube URL or video ID..."
            style={{
              flex: 1, background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 25, padding: '10px 16px', fontSize: 13,
              color: '#fff', outline: 'none',
            }}
          />
          <button onClick={handleResolveUrl} disabled={resolving} style={{
            background: '#fff', color: '#c9000f',
            border: 'none', borderRadius: 25, padding: '10px 18px',
            fontWeight: 800, fontSize: 13, cursor: 'pointer',
            opacity: resolving ? 0.7 : 1,
          }}>
            {resolving ? '...' : '▶ Play'}
          </button>
        </div>
      </div>

      {/* Resolved URL track card */}
      {resolvedTrack && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(255,0,0,0.12), rgba(255,0,0,0.04))',
          border: '1px solid rgba(255,0,0,0.3)',
          borderRadius: 14, padding: 14, marginBottom: 16,
          display: 'flex', gap: 12, alignItems: 'center',
        }}>
          <img src={resolvedTrack.thumbnail} alt="" style={{
            width: 80, height: 56, objectFit: 'cover', borderRadius: 8, flexShrink: 0,
          }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 3,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {resolvedTrack.title}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{resolvedTrack.channel}</div>
          </div>
          <button onClick={() => {
            playTrack(resolvedTrack, [resolvedTrack], 0);
            setPasteUrl('');
            setResolvedTrack(null);
          }} style={{
            background: 'var(--accent)', color: '#000',
            border: 'none', borderRadius: 25, padding: '8px 18px',
            fontWeight: 700, fontSize: 12, cursor: 'pointer', flexShrink: 0,
          }}>
            ▶ Play
          </button>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div style={{
          background: 'rgba(255,45,85,0.1)', border: '1px solid rgba(255,45,85,0.3)',
          borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#ff2d55', marginBottom: 14,
        }}>⚠️ {error}</div>
      )}

      {/* ── Tabs: Discover / Search ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {['discover', 'search'].map(tab => (
          <button key={tab} onClick={() => {
            setActiveTab(tab);
            if (tab === 'discover') { setItems([]); loadCategory(activeCategory); }
            else setItems([]);
          }} style={{
            flex: 1, padding: '10px 0', borderRadius: 25,
            border: '1px solid var(--border)',
            background: activeTab === tab ? 'var(--accent)' : 'transparent',
            color: activeTab === tab ? '#000' : 'var(--text-secondary)',
            fontWeight: 700, fontSize: 13, cursor: 'pointer',
            transition: 'all 0.2s',
          }}>
            {tab === 'discover' ? '🌐 Discover' : '🔍 Search'}
          </button>
        ))}
      </div>

      {/* ── Search Tab ── */}
      {activeTab === 'search' && (
        <div style={{ marginBottom: 14 }}>
          <input
            autoFocus
            value={searchQuery}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Search podcasts, lectures, documentaries..."
            style={{
              width: '100%', background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 25, padding: '12px 18px', fontSize: 14,
              color: 'var(--text-primary)', outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
      )}

      {/* ── Discover Tab: Category pills ── */}
      {activeTab === 'discover' && (
        <div style={{
          display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 16,
          paddingBottom: 4, scrollbarWidth: 'none',
        }}>
          {CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)} style={{
              borderRadius: 99, padding: '7px 14px',
              border: '1px solid var(--border)',
              background: activeCategory === cat.id
                ? 'linear-gradient(135deg,#ff0000,#c9000f)'
                : 'var(--bg-card)',
              color: activeCategory === cat.id ? '#fff' : 'var(--text-secondary)',
              fontWeight: activeCategory === cat.id ? 700 : 400,
              fontSize: 12, whiteSpace: 'nowrap', cursor: 'pointer',
              transition: 'all 0.2s',
            }}>
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Section title ── */}
      {activeTab === 'discover' && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 }}>
            Featured Content
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>
            {CATEGORIES.find(c => c.id === activeCategory)?.emoji}{' '}
            {CATEGORIES.find(c => c.id === activeCategory)?.label}
          </div>
        </div>
      )}

      {/* ── Grid ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))',
        gap: 12,
      }}>
        {loading
          ? Array(8).fill(0).map((_, i) => <VideoSkeleton key={i} />)
          : items.map((t, i) => (
            <VideoCard key={t.id + i} track={t} queue={items} index={i} />
          ))
        }
        {!loading && items.length === 0 && activeTab === 'search' && searchQuery && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            No results for "{searchQuery}"
          </div>
        )}
        {!loading && items.length === 0 && activeTab === 'discover' && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            Loading content...
          </div>
        )}
      </div>
    </div>
  );
}
