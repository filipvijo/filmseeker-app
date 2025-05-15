import React, { useState } from 'react';
import { auth, googleProvider } from './firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail
} from 'firebase/auth';
import './App.css';
import logo from './logo.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resetSent, setResetSent] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);

  const handleEmailChange = (e) => setEmail(e.target.value);
  const handlePasswordChange = (e) => setPassword(e.target.value);

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error) {
      console.error(`Error ${isSignUp ? 'signing up' : 'signing in'}:`, error);

      // Provide user-friendly error messages
      if (error.code === 'auth/invalid-email') {
        setError('Invalid email address format');
      } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        setError('Invalid email or password');
      } else if (error.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters');
      } else if (error.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please sign in instead.');
      } else {
        setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);

    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Error signing in with Google:', error);
      setError('Failed to sign in with Google. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
    } catch (error) {
      console.error('Error sending password reset:', error);
      if (error.code === 'auth/invalid-email') {
        setError('Invalid email address format');
      } else if (error.code === 'auth/user-not-found') {
        setError('No account found with this email');
      } else {
        setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError(null);
  };

  const toggleResetForm = () => {
    setShowResetForm(!showResetForm);
    setResetSent(false);
    setError(null);
  };

  return (
    <div className="login-container">
      <div className="login-content">
        <img src={logo} alt="FilmSeeker Logo" className="login-logo" />
        <h1 className="login-title">Welcome to FilmSeeker</h1>
        <p className="login-description">
          Your personal guide to discovering great films.
        </p>

        {showResetForm ? (
          <div className="login-form-container">
            <h2 className="login-subtitle">Reset Password</h2>
            {resetSent ? (
              <div className="login-success">
                <p>Password reset email sent! Check your inbox.</p>
                <button
                  className="login-back-button"
                  onClick={toggleResetForm}
                >
                  Back to Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="login-form">
                <div className="login-input-group">
                  <label htmlFor="reset-email">Email</label>
                  <input
                    id="reset-email"
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    placeholder="Enter your email"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="login-button"
                  disabled={loading}
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>

                <button
                  type="button"
                  className="login-back-button"
                  onClick={toggleResetForm}
                >
                  Back to Login
                </button>
              </form>
            )}
          </div>
        ) : (
          <div className="login-form-container">
            <h2 className="login-subtitle">{isSignUp ? 'Create Account' : 'Sign In'}</h2>
            <form onSubmit={handleEmailAuth} className="login-form">
              <div className="login-input-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className="login-input-group">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="Enter your password"
                  required
                />
              </div>

              <button
                type="submit"
                className="login-button"
                disabled={loading}
              >
                {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
              </button>
            </form>

            <div className="login-divider">
              <span>OR</span>
            </div>

            <button
              className="login-google-button"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                <g transform="matrix(1, 0, 0, 1, 0, 0)">
                  <path d="M21.35,11.1H12v3.2h5.59c-0.56,2.68-2.96,4.7-5.59,4.7c-3.35,0-6.07-2.72-6.07-6.07 s2.72-6.07,6.07-6.07c1.53,0,2.92,0.57,3.98,1.51l2.24-2.24C16.54,4.6,14.39,3.8,12,3.8c-4.69,0-8.5,3.81-8.5,8.5 s3.81,8.5,8.5,8.5c4.26,0,8.1-3.1,8.1-8.5C20.1,11.84,20.01,11.46,21.35,11.1z" fill="#4285F4"></path>
                  <path d="M6.11,13.14v-2.28H3.88c0.12,0.78,0.36,1.52,0.71,2.19L6.11,13.14z" fill="#34A853"></path>
                  <path d="M3.88,9.14h2.23v-2.28L4.59,6.77C4.24,7.44,4,8.18,3.88,9.14z" fill="#FBBC05"></path>
                  <path d="M12,17.5c-1.53,0-2.92-0.57-3.98-1.51L5.78,18.24C7.46,19.8,9.61,20.6,12,20.6 c2.39,0,4.54-0.8,6.22-2.36l-2.24-2.24C14.92,16.93,13.53,17.5,12,17.5z" fill="#EA4335"></path>
                </g>
              </svg>
              Continue with Google
            </button>

            <div className="login-options">
              {!isSignUp && (
                <button
                  type="button"
                  className="login-text-button"
                  onClick={toggleResetForm}
                >
                  Forgot password?
                </button>
              )}
              <button
                type="button"
                className="login-text-button"
                onClick={toggleMode}
              >
                {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
              </button>
            </div>
          </div>
        )}

        {error && <p className="login-error">{error}</p>}

        <p className="login-footer">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
};

export default Login;
