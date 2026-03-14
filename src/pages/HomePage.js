import React, { useEffect, useState } from 'react';
import { useApp, API } from '../AppContext';
import TrackCard from '../components/TrackCard';

export default function HomePage() {
  const { user, playTrack } = useApp();
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening');
    API.get('/api/trending').then(r => setTrending(r.data.items || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const firstName = user?.name?.split(' ')[0] || 'there';

  function SkeletonCard() {
    return (
      <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
        <div className="skeleton" style={{ paddingBottom: '56.25%', width: '100%' }} />
        <div style={{ padding: '10px 0 0' }}>
          <div className="skeleton" style={{ height: 14, marginBottom: 6, borderRadius: 6 }} />
          <div className="skeleton" style={{ height: 11, width: '60%', borderRadius: 6 }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>
          {greeting}, {firstName} 👋
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          What do you want to listen to today?
        </p>
      </div>

      {/* Quick Picks */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8, marginBottom: 40 }}>
        {[
          { label: '🔥 Trending', query: 'trending music 2025', color: '#ff2d55' },
          { label: '💿 New Releases', query: 'new music 2025', color: '#00d4ff' },
          { label: '🎙 Podcasts', query: 'popular podcasts', color: '#bf5af2' },
          { label: '🎸 Rock', query: 'rock music', color: '#ff9f0a' },
          { label: '🎹 Chill', query: 'chill lo-fi music', color: '#30d158' },
          { label: '🎤 Hip-Hop', query: 'hip hop music 2025', color: '#64d2ff' },
        ].map(({ label, query, color }) => (
          <button key={label} onClick={() => window.location.href = `/search?q=${encodeURIComponent(query)}`}
            style={{ background: `linear-gradient(135deg, ${color}22, ${color}08)`, border: `1px solid ${color}44`, borderRadius: 'var(--radius-sm)', padding: '14px 16px', textAlign: 'left', color: 'var(--text-primary)', fontWeight: 600, fontSize: 13, transition: 'var(--transition)' }}
            onMouseOver={e => { e.currentTarget.style.background = `linear-gradient(135deg, ${color}33, ${color}15)`; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseOut={e => { e.currentTarget.style.background = `linear-gradient(135deg, ${color}22, ${color}08)`; e.currentTarget.style.transform = ''; }}
          >{label}</button>
        ))}
      </div>

      {/* Trending */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>🔥 Trending Music</h2>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Updated daily</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
          {loading
            ? Array(12).fill(0).map((_, i) => <SkeletonCard key={i} />)
            : trending.map((t, i) => <TrackCard key={t.id} track={t} queue={trending} index={i} />)
          }
        </div>
      </div>
    </div>
  );
}
