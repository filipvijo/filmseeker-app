import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';               // If you have global CSS
import App from './App';
import FilmDetail from './FilmDetail'; // Import your new component
import reportWebVitals from './reportWebVitals';

// 1) Import BrowserRouter, Routes, and Route
import { BrowserRouter, Routes, Route } from 'react-router-dom';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    {/* 2) Wrap everything in BrowserRouter */}
    <BrowserRouter>
      <Routes>
        {/* 3) The homepage at path="/" loads your App component */}
        <Route path="/" element={<App />} />
        
        {/* 4) The film detail page at path="/movie/:id" loads your FilmDetail component */}
        <Route path="/movie/:id" element={<FilmDetail />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);

// Optionally keep the performance measuring if you use it
reportWebVitals();
