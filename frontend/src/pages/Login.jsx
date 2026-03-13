// frontend/src/pages/LoginPage.jsx

import React from 'react';
import { Navigate } from 'react-router-dom';
import styles from './Login.module.css';
import { useAuth } from '../contexts/AuthContext';
import { FaGithub } from 'react-icons/fa';

const Login = () => {
  // 1. Get the authentication state and login function from our global context.
  const { isAuthenticated, isLoading, login } = useAuth();

  // 2. While the app is checking for an existing session, show a loading state.
  // This prevents a "flash" of the login page for an already logged-in user.
  if (isLoading) {
    return <div className={styles.loadingScreen}>Verifying authentication...</div>;
  }

  // 3. If the user is already authenticated, redirect them to the dashboard.
  // They should never see the login page if they have a valid session.
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // 4. If not loading and not authenticated, render the login page UI.
  return (
    <div className={styles.login}>
      <div className={styles.loginCard}>
        <div className={styles.logo}>
          {/* You can place your <img src="/kairos-logo.svg" /> here if you have one */}
          <h1 className={styles.title}>Kairos</h1>
        </div>
        <p className={styles.tagline}>Seize Your Moment.</p>
        <p className={styles.description}>
          An intelligent time management partner to help you conquer your day with intention and clarity.
        </p>
        
        {/* This button calls the `login` function from AuthContext, which handles the redirect. */}
        <button className={styles.loginButton} onClick={login}>
          <FaGithub size={22} />
          <span>Login with GitHub</span>
        </button>
      </div>
    </div>
  );
};

export default Login;