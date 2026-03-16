import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp, API } from '../AppContext';

const CATEGORIES = [
  { label: '🔥 Trending', q: 'trending music 2025', color: '#e13300' },
  { label: '🎵 New Music', q: 'new music 2025', color: '#006450' },
  { label: '🎙 Podcasts', q: 'popular podcasts', color: '#8400e7' },
  { label: '🎸 Rock', q: 'rock music', color: '#1e3264' },
  { label: '🎹 Lo-Fi', q: 'lofi chill music', color: '#056952' },
  { label: '🎤 Hip-Hop', q: 'hip hop 2025', color: '#e8115b' },
  { label: '🎻 Classical', q: 'classical music', color: '#e13300' },
  { label: '💿 Phonk', q: 'phonk music', color: '#503750' },
  { label: '😴 Sleep', q: 'sleep music', color: '#1e3264' },
  { label: '💪 Workout', q: 'workout gym music', color: '#e8115b' },
];

function TrackRow({ track, queue, index }) {
  const { playTrack, currentTrack, isPlaying, toggleLike, likedTracks, playlists, addToPlaylist, toast } = useApp();
  const isCurrentTrack = currentTrack?.id === track.id;
  const isLiked = likedTracks.some(t => t.id === track.id);
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div style={{
      display:'flex', alignItems:'center', gap:12, padding:'8px 4px',
      borderRadius:8, cursor:'pointer', transition:'background 0.15s',
      background: isCurrentTrack ? 'rgba(var(--accent-rgb),0.1)' : 'transparent'
    }}
      onClick={() => playTrack(track, queue, index)}
      onMouseOver={e => { if(!isCurrentTrack) e.currentTarget.style.background='rgba(255,255,255,0.05)'; }}
      onMouseOut={e => { if(!isCurrentTrack) e.currentTarget.style.background=isCurrentTrack?'rgba(var(--accent-rgb),0.1)':'transparent'; }}
    >
      {/* Thumbnail */}
      <div style={{position:'relative', flexShrink:0, width:46, height:46}}>
        <img src={track.thumbnail} alt="" style={{width:'100%', height:'100%', borderRadius:4, objectFit:'cover'}} />
        {isCurrentTrack && isPlaying && (
          <div style={{position:'absolute', inset:0, background:'rgba(0,0,0,0.5)', borderRadius:4, display:'flex', alignItems:'center', justifyContent:'center'}}>
            <div className="eq-bars" style={{height:14}}><span/><span/><span/></div>
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{flex:1, overflow:'hidden'}}>
        <div style={{fontSize:14, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:isCurrentTrack?'var(--accent)':'var(--text-primary)'}}>
          {track.title}
        </div>
        <div style={{fontSize:12, color:'var(--text-muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
          {track.channel}
        </div>
      </div>

      {/* Actions */}
      <div style={{display:'flex', gap:4, flexShrink:0}}>
        <button onClick={e => { e.stopPropagation(); toggleLike(track); }}
          style={{color:isLiked?'#ff2d55':'rgba(255,255,255,0.3)', fontSize:16, padding:'6px', background:'none', border:'none', cursor:'pointer'}}>♥</button>
        <button onClick={e => { e.stopPropagation(); setShowMenu(s => !s); }}
          style={{color:'rgba(255,255,255,0.3)', fontSize:18, padding:'6px', background:'none', border:'none', cursor:'pointer'}}>⋯</button>
      </div>

      {/* Quick menu */}
      {showMenu && (
        <div style={{
          position:'fixed', background:'var(--bg-elevated)', border:'1px solid var(--border)',
          borderRadius:12, padding:8, minWidth:180, zIndex:9000,
          boxShadow:'0 16px 48px rgba(0,0,0,0.6)', bottom:160, right:16
        }} onClick={e => e.stopPropagation()}>
          {playlists.map(pl => (
            <button key={pl.id} onClick={() => { addToPlaylist(pl.id, track); setShowMenu(false); toast(`Added to ${pl.name} ✓`); }}
              style={{display:'block', width:'100%', textAlign:'left', padding:'10px 14px', borderRadius:8, fontSize:13, color:'var(--text-primary)', background:'none', border:'none', cursor:'pointer'}}
              onMouseOver={e => e.currentTarget.style.background='var(--surface-hover)'}
              onMouseOut={e => e.currentTarget.style.background='none'}
            >＋ {pl.name}</button>
          ))}
          <button onClick={() => { window.open(`https://youtube.com/watch?v=${track.id}`,'_blank'); setShowMenu(false); }}
            style={{display:'block', width:'100%', textAlign:'left', padding:'10px 14px', borderRadius:8, fontSize:13, color:'var(--text-primary)', background:'none', border:'none', cursor:'pointer'}}
            onMouseOver={e => e.currentTarget.style.background='var(--surface-hover)'}
            onMouseOut={e => e.currentTarget.style.background='none'}
          >▶ View on YouTube</button>
          <button onClick={() => setShowMenu(false)} style={{display:'block', width:'100%', textAlign:'left', padding:'10px 14px', borderRadius:8, fontSize:13, color:'rgba(255,45,85,0.8)', background:'none', border:'none', cursor:'pointer'}}>✕ Close</button>
        </div>
      )}
    </div>
  );
}

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

  useEffect(() => { if (initQ) doSearch(initQ, searchType, null, true); }, [initQ]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!query.trim()) { setResults([]); setSearched(false); return; }
    debounceRef.current = setTimeout(() => doSearch(query, searchType, null, true), 300);
    return () => clearTimeout(debounceRef.current);
  }, [query, searchType]);

  async function doSearch(q, type, pageToken=null, reset=false) {
    if (!q.trim()) return;
    setLoading(true);
    if (reset) setResults([]);
    try {
      const endpoint = type==='channel' ? '/api/search/channel' : '/api/search';
      const paramKey = type==='channel' ? 'channelName' : 'q';
      const res = await API.get(endpoint, {params:{[paramKey]:q, type, pageToken}});
      const items = res.data.items || [];
      setResults(prev => reset ? items : [...prev, ...items]);
      setNextPage(res.data.nextPageToken || null);
      setSearched(true);
    } catch {} finally { setLoading(false); }
  }

  return (
    <div style={{animation:'fadeIn 0.3s ease'}}>
      {/* Search bar */}
      <div style={{position:'sticky', top:-12, background:'var(--bg-primary)', zIndex:10, paddingBottom:12, marginBottom:4, paddingTop:4}}>
        <div style={{position:'relative', marginBottom:10}}>
          <svg style={{position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', opacity:0.5}} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)}
            placeholder="What do you want to listen to?"
            style={{
              width:'100%', padding:'13px 42px 13px 44px',
              background:'white', color:'#000',
              border:'none', borderRadius:30,
              fontSize:14, outline:'none'
            }} />
          {query && (
            <button onClick={() => setQuery('')} style={{position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', color:'#333', fontSize:18, background:'none', border:'none', cursor:'pointer'}}>✕</button>
          )}
        </div>

        {/* Filter pills */}
        <div style={{display:'flex', gap:8, flexWrap:'nowrap', overflowX:'auto', paddingBottom:2}}>
          {[{id:'all',label:'All'},{id:'music',label:'Music'},{id:'channel',label:'Channel'},{id:'podcast',label:'Podcast'}].map(({id,label}) => (
            <button key={id} onClick={() => setSearchType(id)} style={{
              padding:'6px 14px', borderRadius:99, fontSize:13, fontWeight:500,
              background: searchType===id ? 'white' : 'rgba(255,255,255,0.1)',
              color: searchType===id ? '#000' : 'var(--text-primary)',
              border:'none', cursor:'pointer', flexShrink:0, transition:'all 0.2s'
            }}>{label}</button>
          ))}
        </div>
      </div>

      {/* Empty state — show categories */}
      {!searched && !loading && (
        <div>
          <div style={{fontSize:16, fontWeight:700, marginBottom:12}}>Browse categories</div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
            {CATEGORIES.map(({label, q, color}) => (
              <button key={label} onClick={() => setQuery(q)}
                style={{
                  background:color, borderRadius:10, padding:'20px 14px',
                  textAlign:'left', color:'white', fontWeight:700, fontSize:14,
                  border:'none', cursor:'pointer', transition:'filter 0.2s',
                  minHeight:70, position:'relative', overflow:'hidden'
                }}
                onMouseOver={e => e.currentTarget.style.filter='brightness(1.2)'}
                onMouseOut={e => e.currentTarget.style.filter='brightness(1)'}
              >{label}</button>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && results.length === 0 && (
        <div style={{display:'flex', flexDirection:'column', gap:10, marginTop:8}}>
          {Array(6).fill(0).map((_,i) => (
            <div key={i} style={{display:'flex', gap:12, alignItems:'center'}}>
              <div className="skeleton" style={{width:46, height:46, borderRadius:4, flexShrink:0}} />
              <div style={{flex:1}}>
                <div className="skeleton" style={{height:14, marginBottom:6, borderRadius:4}} />
                <div className="skeleton" style={{height:11, width:'60%', borderRadius:4}} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Results - Spotify list style */}
      {results.length > 0 && (
        <>
          <div style={{fontSize:12, color:'var(--text-muted)', marginBottom:8}}>
            {results.length} results for "<strong style={{color:'var(--text-primary)'}}>{query}</strong>"
          </div>
          <div style={{display:'flex', flexDirection:'column'}}>
            {results.map((t,i) => <TrackRow key={`${t.id}-${i}`} track={t} queue={results} index={i} />)}
          </div>
          {nextPage && (
            <div style={{textAlign:'center', marginTop:16}}>
              <button onClick={() => doSearch(query, searchType, nextPage, false)} className="btn-ghost" disabled={loading}>
                {loading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </>
      )}

      {searched && !loading && results.length === 0 && (
        <div style={{textAlign:'center', marginTop:60, color:'var(--text-muted)'}}>
          <div style={{fontSize:36, marginBottom:12}}>🔍</div>
          <div>No results for "<strong style={{color:'var(--text-primary)'}}>{query}</strong>"</div>
        </div>
      )}
    </div>
  );
}
