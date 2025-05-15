import React from 'react';
import { auth, googleProvider } from './firebase';
import { signInWithPopup, signInWithEmailAndPassword } from 'firebase/auth';

const Login = () => {
  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      console.log('User signed in with Google');
    } catch (error) {
      console.error('Error signing in with Google', error);
    }
  };

  const handleEmailSignIn = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log('User signed in with email');
    } catch (error) {
      console.error('Error signing in with email', error);
    }
  };

  return (
    <div>
      <button onClick={handleGoogleSignIn}>Sign in with Google</button>
      <form onSubmit={(e) => {
        e.preventDefault();
        const email = e.target.elements.email.value;
        const password = e.target.elements.password.value;
        handleEmailSignIn(email, password);
      }}>
        <input type="email" name="email" placeholder="Email" required />
        <input type="password" name="password" placeholder="Password" required />
        <button type="submit">Sign in with Email</button>
      </form>
    </div>
  );
};

export default Login;
