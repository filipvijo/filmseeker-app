import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Film, MessageSquare, Heart, Users, HeartHandshake } from 'lucide-react';
import './Layout.css';
import logo from '../../logo.png'; // Assuming logo is in src/logo.png

const Layout = ({ children }) => {
  const location = useLocation();

  const navItems = [
    { icon: Film, label: 'Recommendations', path: '/' },
    { icon: Users, label: 'Sync & Swipe', path: '/swipe' },
    { icon: HeartHandshake, label: 'Movie Match', path: '/match' },
    { icon: Heart, label: 'Watched', path: '/watched' },
    { icon: MessageSquare, label: 'Dr. FilmBot', path: '/chat' },
    // { icon: User, label: 'Profile', path: '/profile' }, // Future
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
