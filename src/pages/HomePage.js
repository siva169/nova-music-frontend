import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, API } from '../AppContext';

function TrackCard({ track, queue, index }) {
  const { playTrack, currentTrack, isPlaying, toggleLike, likedTracks } = useApp();
  const isCurrentTrack = currentTrack?.id === track.id;
  const isLiked = likedTracks.some(t => t.id === track.id);

  return (
    <div onClick={() => playTrack(track, queue, index)} style={{
      background:'var(--bg-card)', borderRadius:8,
      overflow:'hidden', cursor:'pointer', transition:'all 0.2s',
      border: isCurrentTrack ? '1px solid var(--border-accent)' : '1px solid transparent'
    }}
      onMouseOver={e => { e.currentTarget.style.background='var(--bg-elevated)'; }}
      onMouseOut={e  => { e.currentTarget.style.background='var(--bg-card)'; }}
    >
      <div style={{position:'relative', paddingBottom:'100%', overflow:'hidden'}}>
        <img src={track.thumbnail} alt="" style={{position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover'}} />
        {isCurrentTrack && isPlaying && (
          <div style={{position:'absolute', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center'}}>
            <div className="eq-bars"><span/><span/><span/></div>
          </div>
        )}
        <button onClick={e => { e.stopPropagation(); toggleLike(track); }} style={{
          position:'absolute', top:6, right:6,
          background:'rgba(0,0,0,0.6)', borderRadius:'50%',
          width:28, height:28, display:'flex', alignItems:'center', justifyContent:'center',
          color:isLiked?'#ff2d55':'rgba(255,255,255,0.7)', fontSize:13,
          border:'none', cursor:'pointer'
        }}>♥</button>
        {track.source === 'youtube' && (
          <span style={{
            position:'absolute', top:6, left:6,
            background:'#ff0000', color:'#fff',
            fontSize:8, fontWeight:800, padding:'2px 5px', borderRadius:3,
          }}>▶ YT</span>
        )}
      </div>
      <div style={{padding:'8px 10px 10px'}}>
        <div style={{fontSize:12, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:isCurrentTrack?'var(--accent)':'var(--text-primary)', marginBottom:2}}>
          {track.title}
        </div>
        <div style={{fontSize:10, color:'var(--text-muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
          {track.channel}
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { user } = useApp();
  const navigate = useNavigate();
  const [trending, setTrending]   = useState([]);
  const [romance, setRomance]     = useState([]);
  const [ytPodcasts, setYtPodcasts] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [query, setQuery]         = useState('');
  const [activeTag, setActiveTag] = useState('Podcasts');

  const tags = ['Podcasts', 'Workout', 'Relax', 'Feel good', 'Romance', 'Nostalgia'];
  const quickActions = [
    { label: 'YouTube', icon: '▶', path: '/youtube' },
    { label: 'History', icon: '◷', path: '/songs' },
    { label: 'Library', icon: '◫', path: '/library' },
    { label: 'Account', icon: '◉', path: '/settings' },
  ];

  useEffect(() => {
    Promise.all([
      API.get('/api/trending').then(r => r.data.items || []).catch(() => []),
      API.get('/api/search', { params: { q: 'romance hits' } }).then(r => r.data.items || []).catch(() => []),
      API.get('/api/youtube/category/podcasts').then(r => r.data.items || []).catch(() => []),
    ]).then(([tr, ro, yt]) => {
      setTrending(tr);
      setRomance(ro.slice(0, 20));
      setYtPodcasts(yt.slice(0, 10));
    }).finally(() => setLoading(false));
  }, []);

  const filteredTrending = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return trending;
    return trending.filter(t => `${t.title} ${t.channel}`.toLowerCase().includes(q));
  }, [query, trending]);

  return (
    <div style={{animation:'fadeIn 0.4s ease'}}>
      <div style={{display:'flex', gap:8, marginBottom:14}}>
        <button
          onClick={() => navigate(`/search?q=${encodeURIComponent(query || 'freia')}`)}
          style={{
            flex: 1, textAlign: 'left', borderRadius: 30, border: '1px solid var(--border)',
            background: 'var(--bg-card)', color: 'var(--text-secondary)', padding: '12px 14px', fontSize: 14
          }}
        >
          <span style={{fontWeight: 700, color: 'var(--text-primary)'}}>$</span>earch {query && `· ${query}`}
        </button>
        <button onClick={() => navigate('/settings')} style={{width:44, borderRadius:22, background:'var(--bg-card)', border:'1px solid var(--border)', fontSize:18}}>⚙</button>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:14}}>
        {quickActions.map(a => (
          <button key={a.label} onClick={() => navigate(a.path)} style={{background:'transparent', border:'none'}}>
            <div style={{width:44, height:44, borderRadius:22, margin:'0 auto 6px', background:'var(--bg-card)', border:'1px solid var(--border)', display:'grid', placeItems:'center', fontSize:18}}>{a.icon}</div>
            <div style={{fontSize:11, color:'var(--text-secondary)'}}>{a.label}</div>
          </button>
        ))}
      </div>

      <div style={{display:'flex', gap:8, overflowX:'auto', marginBottom:18, paddingBottom:2}}>
        {tags.map(tag => (
          <button key={tag} onClick={() => setActiveTag(tag)} style={{
            borderRadius:99, padding:'6px 14px', border:'1px solid var(--border)',
            color: activeTag === tag ? 'var(--text-primary)' : 'var(--text-secondary)',
            background: activeTag === tag ? 'var(--bg-card)' : 'transparent', whiteSpace:'nowrap'
          }}>{tag}</button>
        ))}
      </div>

      <Section title="THROWBACK TO THE OG ERAS OF MUSIC" subtitle="Brb, Being Nostalgic!">
        <Carousel tracks={filteredTrending} loading={loading} />
      </Section>

      {/* YouTube section */}
      <div style={{marginBottom:22}}>
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10}}>
          <div>
            <div style={{fontSize:11, color:'var(--text-muted)', letterSpacing:0.5, marginBottom:2}}>🎙️ YOUTUBE PODCASTS & MORE</div>
            <div style={{fontSize:30, lineHeight:1.05, fontFamily:"'Bebas Neue',sans-serif", color:'#ff4444'}}>Top Picks From YouTube</div>
          </div>
          <button onClick={() => navigate('/youtube')} style={{
            background:'linear-gradient(135deg,#ff0000,#c9000f)',
            color:'#fff', border:'none', borderRadius:20,
            padding:'8px 14px', fontSize:11, fontWeight:700, cursor:'pointer',
            whiteSpace:'nowrap',
          }}>See All ▶</button>
        </div>
        <Carousel tracks={ytPodcasts} loading={loading} />
      </div>

      <Section title="BACKGROUND SCORE TO YOUR LOVE STORY" subtitle="Romance Right Now">
        <Carousel tracks={romance} loading={loading} />
      </Section>
    </div>
  );
}

function Section({ title, subtitle, children }) {
  return (
    <div style={{marginBottom:22}}>
      <div style={{fontSize:11, color:'var(--text-muted)', letterSpacing:0.5, marginBottom:2}}>{title}</div>
      <div style={{fontSize:30, lineHeight:1.05, fontFamily:"'Bebas Neue',sans-serif", color:'#e5ab65', marginBottom:10}}>{subtitle}</div>
      {children}
    </div>
  );
}

function Carousel({ tracks, loading }) {
  return (
    <div style={{display:'flex', gap:10, overflowX:'auto', paddingBottom:4}}>
      {loading
        ? Array(6).fill(0).map((_, i) => (
          <div key={i} style={{minWidth:130}}>
            <div className="skeleton" style={{height:130, borderRadius:10, marginBottom:6}} />
            <div className="skeleton" style={{height:12, borderRadius:4, marginBottom:4}} />
            <div className="skeleton" style={{height:10, width:'70%', borderRadius:4}} />
          </div>
        ))
        : tracks.map((t, i) => (
          <div key={t.id + i} style={{minWidth:130}}>
            <TrackCard track={t} queue={tracks} index={i} />
          </div>
        ))
      }
      {!loading && tracks.length === 0 && (
        <div style={{fontSize:12, color:'var(--text-muted)', padding:'12px 0'}}>No tracks yet</div>
      )}
    </div>
  );
}
