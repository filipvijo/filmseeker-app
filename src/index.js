import React from 'react';
import { createRoot } from 'react-dom/client';
import './variables.css';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import ErrorBoundary from './components/ErrorBoundary';

// Static HTML remains readable before JS. Mount fresh because auth, watched
// films and live recommendations may differ from the anonymous build snapshot.
createRoot(document.getElementById('root')).render(
  <React.StrictMode><ErrorBoundary><App /></ErrorBoundary></React.StrictMode>
);
reportWebVitals();
