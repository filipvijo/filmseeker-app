import React, { useState } from 'react';
import { auth } from './firebase';
import { signInAnonymously } from 'firebase/auth';
import './App.css';
import logo from './logo.png';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAnonymousLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInAnonymously(auth);
      // Successfully signed in anonymously
    } catch (error) {
      console.error('Error signing in anonymously:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-content">
        <img src={logo} alt="FilmSeeker Logo" className="login-logo" />
        <h1 className="login-title">Welcome to FilmSeeker</h1>
        <p className="login-description">
          Your personal guide to discovering great films. No sign-up required.
        </p>
        <button 
          className="login-button" 
          onClick={handleAnonymousLogin}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Enter as Guest'}
        </button>
        {error && <p className="login-error">{error}</p>}
        <p className="login-footer">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
};

export default Login;
