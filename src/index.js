import React from 'react';
import { hydrateRoot, createRoot } from 'react-dom/client';
import './variables.css';           // Design system variables
import './index.css';               // Global CSS
import App from './App';
import reportWebVitals from './reportWebVitals';
import ErrorBoundary from './components/ErrorBoundary';

const rootElement = document.getElementById('root');
const fallbackElement = document.getElementById('seo-fallback');

if (rootElement.hasChildNodes() && !fallbackElement) {
  // Pre-rendered by react-snap - hydrate instead of re-render.
  hydrateRoot(
    rootElement,
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
} else {
  if (fallbackElement) {
    rootElement.textContent = '';
  }

  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
}

// Optionally keep the performance measuring if you use it
reportWebVitals();
