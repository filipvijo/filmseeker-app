import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { FilmProvider, useFilm } from './context/FilmContext';
import Layout from './components/Layout/Layout';

// Components
import VisualFilter from './components/VisualFilter/VisualFilter';
import BentoGrid from './components/BentoGrid/BentoGrid';
import SwipeSession from './components/SwipeMatch/SwipeSession';
import MatchSession from './components/SwipeMatch/MatchSession';
import ChatView from './components/ChatView';
import WatchedView from './components/WatchedView';
import FilmDetail from './FilmDetail';
import TrendingSection from './components/TrendingSection/TrendingSection';
import PreferencesFilter from './components/PreferencesFilter/PreferencesFilter';

import './App.css';

// Search Button Component
const SearchTrigger = () => {
  const { getRecommendations, isSearching, getSurpriseFilm } = useFilm();
  const navigate = useNavigate(); // Need router context

  const handleSurprise = async () => {
    const film = await getSurpriseFilm();
    if (film) {
      navigate(`/movie/${film.id}`);
    }
  };

  return (
    <div style={{ margin: '32px 0 48px', textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '20px' }}>
      <button
        onClick={() => getRecommendations()}
        disabled={isSearching}
        style={{
          background: 'var(--color-primary)',
          color: '#000',
          border: 'none',
          padding: '16px 40px',
          borderRadius: '24px',
          fontSize: '1.1rem',
          fontWeight: '800',
          letterSpacing: '1px',
          textTransform: 'uppercase',
          cursor: isSearching ? 'not-allowed' : 'pointer',
          boxShadow: '0 0 20px rgba(0, 229, 255, 0.4)',
          transition: 'all 0.3s ease',
          opacity: isSearching ? 0.7 : 1
        }}
      >
        {isSearching ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            Curating...
          </span>
        ) : 'Find My Movie'}
      </button>

      <button
        onClick={handleSurprise}
        style={{
          background: 'rgba(255,255,255,0.1)',
          color: '#fff',
          border: '1px solid rgba(255,255,255,0.2)',
          padding: '16px 30px',
          borderRadius: '24px',
          fontSize: '1.1rem',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 0.3s ease'
        }}
      >
        Surprise Me! 🎲
      </button>
    </div>
  );
};

// Internal Layout wrapper to use useFilm hook
const AppContent = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={
            <div className="page-container">
              <header className="page-header" style={{ marginBottom: '40px' }}>
                <h1 style={{
                  fontSize: '3rem',
                  background: 'linear-gradient(to right, #fff, #94a3b8)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  marginBottom: '16px'
                }}>Discover Cinema</h1>
                <p className="subtitle" style={{ color: 'var(--color-text-secondary)', fontSize: '1.2rem' }}>
                  Find your next favorite film through visual vibes.
                </p>
              </header>
              <TrendingSection />
              <PreferencesFilter />
              <VisualFilter />
              <SearchTrigger />
              <BentoGrid />
            </div>
          } />

          <Route path="/swipe" element={<SwipeSession />} />
          <Route path="/chat" element={<ChatView />} />
          <Route path="/watched" element={<WatchedView />} />
          <Route path="/movie/:id" element={<FilmDetail />} />
          <Route path="/match" element={<MatchSession />} />
          <Route path="/match/:sessionId" element={<MatchSession />} />

        </Routes>
      </Layout>
    </Router>
  );
};

function App() {
  return (
    <FilmProvider>
      <AppContent />
    </FilmProvider>
  );
}

export default App;