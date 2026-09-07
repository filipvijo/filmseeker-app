import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Film, MessageSquare, Heart, Users, HeartHandshake, LogIn, LogOut, User, Sparkles } from 'lucide-react';
import { useFilm } from '../../context/FilmContext';
import './Layout.css';
import logo from '../../logo.webp';

const Layout = ({ children }) => {
  const location = useLocation();
  useEffect(() => { if (location.pathname !== '/tonight') window.scrollTo(0, 0); }, [location.pathname]);
  const { user, authLoading, handleLogout } = useFilm();

  const navItems = [
    { icon: Film, label: 'Discover', path: '/' },
    { icon: Sparkles, label: 'Tonight Mode', path: '/tonight' },
    { icon: Users, label: 'Swipe Picks', path: '/swipe' },
    { icon: HeartHandshake, label: 'Match Friend', path: '/match' },
    { icon: Heart, label: 'Watched', path: '/watched' },
    { icon: MessageSquare, label: 'Dr. FilmBot', path: '/chat' },
  ];

  return (
    <div className="app-layout">
      <nav className="sidebar">
        <div className="sidebar-header">
          <img src={logo} alt="FilmSeeker" className="sidebar-logo" />
          <span className="sidebar-brand">FilmSeeker</span>
        </div>

        <div className="nav-links">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                aria-label={item.label}
                to={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={20} />
                <span className="nav-label-full">{item.label}</span><span className="nav-label-short">{{'/tonight': 'Tonight', '/swipe': 'Swipe', '/match': 'Match', '/chat': 'FilmBot'}[item.path] || item.label}</span>
                {isActive && <div className="active-indicator" />}
              </Link>
            );
          })}
        </div>

        <div className="sidebar-footer">
          {!authLoading && (
            user ? (
              <div className="sidebar-user">
                <div className="sidebar-user-info">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="" className="sidebar-user-avatar" />
                  ) : (
                    <User size={16} />
                  )}
                  <span className="sidebar-user-name">{user.displayName || user.email}</span>
                </div>
                <button className="sidebar-auth-btn" onClick={handleLogout} title="Sign out">
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <Link to="/login" className="sidebar-auth-btn sidebar-login-btn">
                <LogIn size={16} />
                <span>Sign In</span>
              </Link>
            )
          )}
          <p className="copyright">© 2026 FilmSeeker</p>
        </div>
      </nav>

      <main className="main-content">
        {children}
        <footer className="site-footer"><Link to="/movie-guides">Movie guides</Link><Link to="/chat">AI movie recommendations</Link><span>Movie data provided by <a href="https://www.themoviedb.org/" target="_blank" rel="noreferrer">TMDb</a>. This product uses the TMDb API but is not endorsed or certified by TMDb.</span></footer>
      </main>
    </div>
  );
};

export default Layout;
