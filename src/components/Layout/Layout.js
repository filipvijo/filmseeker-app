import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Film, MessageSquare, Heart, Users, HeartHandshake, LogIn, LogOut, User, Menu, X } from 'lucide-react';
import { useFilm } from '../../context/FilmContext';
import './Layout.css';
import logo from '../../logo.png';

const Layout = ({ children }) => {
  const location = useLocation();
  const { user, authLoading, handleLogout } = useFilm();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const navItems = [
    { icon: Film, label: 'Recommendations', path: '/' },
    { icon: Users, label: 'Sync & Swipe', path: '/swipe' },
    { icon: HeartHandshake, label: 'Movie Match', path: '/match' },
    { icon: Heart, label: 'Watched', path: '/watched' },
    { icon: MessageSquare, label: 'Dr. FilmBot', path: '/chat' },
  ];

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Close menu on outside tap
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuOpen && menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [menuOpen]);

  return (
    <div className="app-layout">
      {/* Mobile hamburger button */}
      <button 
        className="mobile-menu-btn" 
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
      >
        {menuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay */}
      <div className={`menu-overlay ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(false)} />

      {/* Sidebar */}
      <nav className={`sidebar ${menuOpen ? 'mobile-open' : ''}`} ref={menuRef}>
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
                to={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
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
      </main>
    </div>
  );
};

export default Layout;
