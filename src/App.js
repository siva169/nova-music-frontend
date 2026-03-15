import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './AppContext';
import './styles/global.css';

import Sidebar from './components/Sidebar';
import PlayerBar from './components/PlayerBar';
import MobileNav from './components/MobileNav';
import MobileHeader from './components/MobileHeader';
import ToastContainer from './components/Toast';
import AudioPlayer from './components/AudioPlayer';
import { NovaLogoFull } from './components/NovaLogo';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import { LibraryPage, LikedPage, PlaylistPage, SharedPage, SettingsPage } from './pages/Pages';

function LoadingScreen() {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100dvh', background:'#050510', flexDirection:'column', gap:0 }}>
      <NovaLogoFull size={150} />
      <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:44, letterSpacing:12, marginTop:-8,
        background:'linear-gradient(135deg,#ffffff 0%,#00d4ff 50%,#bf5af2 100%)',
        WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>NOVA</div>
      <div style={{ fontSize:11, color:'rgba(180,220,255,0.35)', letterSpacing:4, marginTop:8, textTransform:'uppercase' }}>
        Loading your universe...
      </div>
      <div style={{ width:120, height:2, background:'rgba(255,255,255,0.08)', borderRadius:99, marginTop:24, overflow:'hidden' }}>
        <div style={{ height:'100%', background:'linear-gradient(90deg,#00d4ff,#bf5af2)', borderRadius:99, animation:'loadBar 1.5s ease-in-out infinite' }} />
      </div>
    </div>
  );
}

function AppShell() {
  const { user, authLoading, currentTrack, sidebarOpen, setSidebarOpen } = useApp();

  if (authLoading) return <LoadingScreen />;

  if (!user) return (
    <Routes>
      <Route path="/shared/:shareId" element={<SharedPage />} />
      <Route path="*" element={<LoginPage />} />
    </Routes>
  );

  return (
    <div className="app-layout">
      <Sidebar />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,0.7)',
          zIndex:299, backdropFilter:'blur(4px)'
        }} />
      )}

      {/* Mobile header */}
      <MobileHeader />

      <div className="main-content" id="main-scroll">
        <Routes>
          <Route path="/" element={<Navigate to="/home" />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/liked" element={<LikedPage />} />
          <Route path="/playlist/:id" element={<PlaylistPage />} />
          <Route path="/shared/:shareId" element={<SharedPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/home" />} />
        </Routes>
      </div>

      {currentTrack && <PlayerBar />}
      <MobileNav />
      <AudioPlayer />
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </AppProvider>
  );
}
