import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp, API } from '../AppContext';
import TrackCard from '../components/TrackCard';

export default function SearchPage() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const initQ = params.get('q') || '';

  const [query, setQuery] = useState(initQ);
  const [searchType, setSearchType] = useState('all');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [nextPage, setNextPage] = useState(null);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    if (initQ) doSearch(initQ, searchType, null, true);
  }, [initQ]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!query.trim()) { setResults([]); setSearched(false); return; }
    debounceRef.current = setTimeout(() => {
      doSearch(query, searchType, null, true);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query, searchType]);

  async function doSearch(q, type, pageToken = null, reset = false) {
    if (!q.trim()) return;
    setLoading(true);
    if (reset) setResults([]);
    try {
      const endpoint = type === 'channel' ? '/api/search/channel' : '/api/search';
      const paramKey = type === 'channel' ? 'channelName' : 'q';
      const res = await API.get(endpoint, { params: { [paramKey]: q, type, pageToken } });
      const items = res.data.items || [];
      setResults(prev => reset ? items : [...prev, ...items]);
      setNextPage(res.data.nextPageToken || null);
      setSearched(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function loadMore() {
    if (nextPage && !loading) doSearch(query, searchType, nextPage, false);
  }

  const TYPES = [
    { id: 'all', label: '✦ All' },
    { id: 'music', label: '🎵 Music' },
    { id: 'channel', label: '📺 Channel' },
    { id: 'podcast', label: '🎙 Podcast' },
  ];

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>

      {/* ── Search Input (single, no duplicate) ── */}
      <div style={{
        position: 'sticky', top: 0,
        background: 'var(--bg-primary)',
        zIndex: 10, paddingBottom: 12,
        paddingTop: 12, marginBottom: 4,
        borderBottom: '1px solid var(--border)',
        marginLeft: -24, marginRight: -24,
        paddingLeft: 16, paddingRight: 16,
      }}>
        <div style={{ position: 'relative', marginBottom: 10 }}>
          <span style={{
            position: 'absolute', left: 14, top: '50%',
            transform: 'translateY(-50%)', fontSize: 18,
            color: 'var(--text-muted)', pointerEvents: 'none'
          }}>⌕</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search songs, artists, channels, podcasts..."
            style={{
              width: '100%', padding: '12px 44px 12px 44px',
              background: 'var(--bg-card)',
              border: '1.5px solid var(--border)',
              borderRadius: 99, fontSize: 15,
              color: 'var(--text-primary)',
              outline: 'none', boxSizing: 'border-box',
            }}
            onFocus={e => {
              e.target.style.borderColor = 'var(--border-accent)';
              e.target.style.boxShadow = '0 0 0 3px rgba(var(--accent-rgb), 0.12)';
            }}
            onBlur={e => {
              e.target.style.borderColor = 'var(--border)';
              e.target.style.boxShadow = 'none';
            }}
          />
          {loading && (
            <div style={{
              position: 'absolute', right: query ? 44 : 14,
              top: '50%', transform: 'translateY(-50%)',
              width: 16, height: 16,
              border: '2px solid var(--border)',
              borderTop: '2px solid var(--accent)',
              borderRadius: '50%', animation: 'spin 0.6s linear infinite'
            }} />
          )}
          {query && !loading && (
            <button
              onClick={() => { setQuery(''); inputRef.current?.focus(); }}
              style={{
                position: 'absolute', right: 14, top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)', fontSize: 16,
                background: 'none', border: 'none', cursor: 'pointer',
              }}
            >✕</button>
          )}
        </div>

        {/* Filter chips */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
          {TYPES.map(({ id, label }) => (
            <button key={id} onClick={() => setSearchType(id)} style={{
              padding: '6px 14px', borderRadius: 99, fontSize: 13,
              fontWeight: 500, whiteSpace: 'nowrap', flexShrink: 0,
              background: searchType === id ? 'var(--accent)' : 'var(--surface)',
              color: searchType === id ? '#000' : 'var(--text-secondary)',
              border: `1px solid ${searchType === id ? 'transparent' : 'var(--border)'}`,
              transition: 'var(--transition)',
            }}>{label}</button>
          ))}
        </div>
      </div>

      {/* ── Empty state ── */}
      {!searched && !loading && (
        <div style={{ textAlign: 'center', marginTop: 80, color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>⌕</div>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: 'var(--text-secondary)' }}>
            Search anything
          </div>
          <div style={{ fontSize: 13 }}>
            Songs, artists, channels, podcasts — all of YouTube is here
          </div>
        </div>
      )}

      {/* ── No results ── */}
      {searched && !loading && results.length === 0 && (
        <div style={{ textAlign: 'center', marginTop: 60, color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>😕</div>
          <div style={{ fontSize: 16 }}>
            No results for "<strong style={{ color: 'var(--text-primary)' }}>{query}</strong>"
          </div>
          <div style={{ fontSize: 13, marginTop: 8 }}>Try a different search term</div>
        </div>
      )}

      {/* ── Results grid ── */}
      {results.length > 0 && (
        <>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, marginTop: 16 }}>
            {results.length} results for "<strong style={{ color: 'var(--text-primary)' }}>{query}</strong>"
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))',
            gap: 12,
          }}>
            {results.map((t, i) => (
              <TrackCard key={`${t.id}-${i}`} track={t} queue={results} index={i} />
            ))}
          </div>

          {nextPage && (
            <div style={{ textAlign: 'center', marginTop: 24, marginBottom: 16 }}>
              <button onClick={loadMore} className="btn-ghost" disabled={loading}>
                {loading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
