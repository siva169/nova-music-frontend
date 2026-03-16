import React, { useEffect, useState } from 'react';
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
      onMouseOut={e => { e.currentTarget.style.background='var(--bg-card)'; }}
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
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening');
    API.get('/api/trending').then(r => setTrending(r.data.items || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <div style={{animation:'fadeIn 0.4s ease'}}>
      {/* Header */}
      <div style={{marginBottom:20}}>
        <h1 style={{fontSize:22, fontWeight:800, marginBottom:2}}>
          {greeting}, {firstName} 👋
        </h1>
        <p style={{color:'var(--text-muted)', fontSize:13}}>What do you want to listen to today?</p>
      </div>

      {/* Quick picks */}
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:28}}>
        {[
          {label:'🔥 Trending', q:'trending music 2025', color:'#e13300'},
          {label:'💿 New Releases', q:'new music 2025', color:'#006450'},
          {label:'🎸 Rock', q:'rock music', color:'#1e3264'},
          {label:'🎹 Chill', q:'lofi chill music', color:'#8400e7'},
          {label:'🎤 Hip-Hop', q:'hip hop 2025', color:'#e8115b'},
          {label:'🎙 Podcasts', q:'popular podcasts', color:'#503750'},
        ].map(({label, q, color}) => (
          <button key={label} onClick={() => navigate(`/search?q=${encodeURIComponent(q)}`)}
            style={{
              background:`linear-gradient(135deg, ${color}dd, ${color}88)`,
              borderRadius:8, padding:'14px 12px',
              textAlign:'left', color:'white', fontWeight:700, fontSize:13,
              border:'none', cursor:'pointer', transition:'filter 0.2s'
            }}
            onMouseOver={e => e.currentTarget.style.filter='brightness(1.2)'}
            onMouseOut={e => e.currentTarget.style.filter='brightness(1)'}
          >{label}</button>
        ))}
      </div>

      {/* Trending section */}
      <div>
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12}}>
          <h2 style={{fontSize:18, fontWeight:700}}>🔥 Trending</h2>
          <span style={{fontSize:11, color:'var(--text-muted)'}}>Updated daily</span>
        </div>
        <div style={{
          display:'grid',
          gridTemplateColumns:'repeat(auto-fill, minmax(140px, 1fr))',
          gap:12
        }}>
          {loading
            ? Array(12).fill(0).map((_,i) => (
                <div key={i}>
                  <div className="skeleton" style={{paddingBottom:'100%', borderRadius:8, marginBottom:6}} />
                  <div className="skeleton" style={{height:12, borderRadius:4, marginBottom:4}} />
                  <div className="skeleton" style={{height:10, width:'70%', borderRadius:4}} />
                </div>
              ))
            : trending.map((t,i) => <TrackCard key={t.id} track={t} queue={trending} index={i} />)
          }
        </div>
      </div>
    </div>
  );
}
