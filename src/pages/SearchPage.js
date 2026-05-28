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

const SOURCE_BADGE = {
  youtube: { label: 'YT', bg: '#ff0000', color: '#fff' },
  jiosaavn: { label: 'JS', bg: '#2bc5b4', color: '#fff' },
};

function TrackRow({ track, queue, index }) {
  const { playTrack, currentTrack, isPlaying, toggleLike, likedTracks, playlists, addToPlaylist, toast } = useApp();
  const isCurrentTrack = currentTrack?.id === track.id;
  const isLiked = likedTracks.some(t => t.id === track.id);
  const [showMenu, setShowMenu] = useState(false);
  const badge = SOURCE_BADGE[track.source];
  const actionItems = [
    'Start radio', 'Add to queue', 'Add to playlist',
    'Download', 'Add to library', 'View artist',
    'View album', 'Share', 'Toggle lyrics',
    'Details', 'Sleep timer', 'Equalizer',
    'Advanced'
  ];

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
        {badge && (
          <div style={{position:'absolute', bottom:2, left:2, background:badge.bg, color:badge.color, fontSize:8, fontWeight:700, padding:'1px 4px', borderRadius:3, lineHeight:'12px'}}>{badge.label}</div>
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
        <div style={{position:'fixed', inset:0, zIndex:9000, background:'rgba(0,0,0,0.6)'}} onClick={() => setShowMenu(false)}>
          <div
            style={{
              position:'absolute', left:0, right:0, bottom:0, borderTopLeftRadius:20, borderTopRightRadius:20,
              padding:'14px 16px 24px', background:'var(--bg-secondary)', borderTop:'1px solid var(--border)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:12}}>
              <img src={track.thumbnail} alt="" style={{width:56, height:56, borderRadius:8, objectFit:'cover'}} />
              <div style={{flex:1, minWidth:0}}>
                <div style={{fontSize:14, fontWeight:700, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{track.title}</div>
                <div style={{fontSize:12, color:'var(--text-muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{track.channel}</div>
              </div>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12}}>
              {actionItems.map(item => (
                <button
                  key={item}
                  onClick={() => {
                    if (item === 'Add to playlist' && playlists[0]) addToPlaylist(playlists[0].id, track);
                    if (item === 'Share') navigator.share?.({ title: track.title, text: track.channel }).catch(() => {});
                    if (item === 'View artist') window.open(`https://www.jiosaavn.com/search/${encodeURIComponent(track.channel)}`, '_blank');
                    if (item === 'View album') window.open(`https://www.jiosaavn.com/search/${encodeURIComponent(track.description || track.title)}`, '_blank');
                    toast(`${item} ready`);
                    setShowMenu(false);
                  }}
                  style={{display:'grid', placeItems:'center', gap:4, minHeight:62, background:'transparent', border:'none'}}
                >
                  <span style={{fontSize:18}}>◌</span>
                  <span style={{fontSize:11, color:'var(--text-secondary)', textAlign:'center'}}>{item}</span>
                </button>
              ))}
            </div>
          </div>
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
  const [musicSource, setMusicSource] = useState('all');
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [nextPage, setNextPage] = useState(null);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef(null);
  const inputRef = useRef(null);
  const [recentQueries, setRecentQueries] = useState(() => {
    try { return JSON.parse(localStorage.getItem('nova_recent_queries') || '[]'); } catch { return []; }
  });

  useEffect(() => { if (initQ) doSearch(initQ, searchType, null, true); }, [initQ]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!query.trim()) { setResults([]); setSearched(false); return; }
    debounceRef.current = setTimeout(() => doSearch(query, searchType, null, true), 300);
    return () => clearTimeout(debounceRef.current);
  }, [query, searchType, musicSource]);

  async function doSearch(q, type, pageToken=null, reset=false) {
    if (!q.trim()) return;
    setLoading(true);
    if (reset) setResults([]);
    try {
      const endpoint = type==='channel' ? '/api/search/channel' : '/api/search';
      const paramKey = type==='channel' ? 'channelName' : 'q';
      const sourceParam = musicSource === 'all' ? undefined : musicSource;
      const res = await API.get(endpoint, {params:{[paramKey]:q, type, pageToken, source: sourceParam}});
      const items = res.data.items || [];
      setResults(prev => reset ? items : [...prev, ...items]);
      if (reset) {
        const nextRecent = [q, ...recentQueries.filter(x => x.toLowerCase() !== q.toLowerCase())].slice(0, 5);
        setRecentQueries(nextRecent);
        localStorage.setItem('nova_recent_queries', JSON.stringify(nextRecent));
      }
      setNextPage(res.data.nextPageToken || null);
      setSearched(true);
    } catch {} finally { setLoading(false); }
  }

  useEffect(() => {
    if (!query.trim()) { setSuggestions([]); return; }
    const fromRecent = recentQueries
      .filter(x => x.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 3)
      .map(x => ({ type: 'recent', value: x }));
    const fromResults = results.slice(0, 4).map(x => ({ type: 'track', value: x.title, track: x }));
    setSuggestions([...fromRecent, ...fromResults]);
  }, [query, recentQueries, results]);

  return (
    <div style={{animation:'fadeIn 0.3s ease', position:'relative'}}>
      <div style={{position:'fixed', inset:0, background:'radial-gradient(circle at top, rgba(190,100,255,0.2), transparent 55%)', filter:'blur(16px)', zIndex:-1}} />
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
          {!!suggestions.length && (
            <div style={{position:'absolute', top:'calc(100% + 8px)', left:0, right:0, background:'rgba(10,10,20,0.95)', border:'1px solid var(--border)', borderRadius:14, padding:8}}>
              {suggestions.map((s, i) => (
                <button
                  key={`${s.value}-${i}`}
                  onClick={() => {
                    setQuery(s.value);
                    if (s.track) {
                      setResults(prev => [s.track, ...prev.filter(x => x.id !== s.track.id)]);
                    }
                    doSearch(s.value, searchType, null, true);
                  }}
                  style={{display:'flex', width:'100%', justifyContent:'space-between', alignItems:'center', padding:'8px 10px', borderRadius:8}}
                >
                  <span style={{fontSize:13, color:'var(--text-secondary)'}}>{s.type === 'recent' ? '⌕' : '♫'} {s.value}</span>
                  <span style={{fontSize:12, color:'var(--text-muted)'}}>↗</span>
                </button>
              ))}
            </div>
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

        {/* Source toggle */}
        <div style={{display:'flex', gap:6, marginTop:8, flexWrap:'nowrap', overflowX:'auto', paddingBottom:2}}>
          {[
            {id:'all', label:'All Sources', icon:'🌐'},
            {id:'jiosaavn', label:'JioSaavn', icon:'🎵'},
            {id:'youtube', label:'YouTube', icon:'▶'}
          ].map(({id, label, icon}) => (
            <button key={id} onClick={() => setMusicSource(id)} style={{
              padding:'5px 12px', borderRadius:99, fontSize:12, fontWeight:500,
              background: musicSource===id ? (id==='youtube' ? '#ff0000' : id==='jiosaavn' ? '#2bc5b4' : 'var(--accent)') : 'rgba(255,255,255,0.06)',
              color: musicSource===id ? '#fff' : 'var(--text-secondary)',
              border: musicSource===id ? 'none' : '1px solid rgba(255,255,255,0.1)',
              cursor:'pointer', flexShrink:0, transition:'all 0.2s'
            }}>{icon} {label}</button>
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
            {results.length} results for <strong style={{color:'var(--text-primary)'}}>{query}</strong>
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
          <div>No results for <strong style={{color:'var(--text-primary)'}}>{query}</strong></div>
        </div>
      )}
    </div>
  );
}
