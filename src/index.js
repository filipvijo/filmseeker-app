import React from 'react';
import { createRoot } from 'react-dom/client';
import './variables.css';           // Design system variables
import './index.css';               // Global CSS
import App from './App';
import reportWebVitals from './reportWebVitals';
import ErrorBoundary from './components/ErrorBoundary';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

// Optionally keep the performance measuring if you use it
reportWebVitals();
