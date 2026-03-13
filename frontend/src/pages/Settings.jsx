// frontend/src/pages/SettingsPage.jsx

import React from 'react';
import styles from './Settings.module.css';
import { useAuth } from '../contexts/AuthContext';
import { IoLogOutOutline } from 'react-icons/io5';

const Settings = () => {
  const { user, logout } = useAuth();

  if (!user) {
    return <div className={styles.loading}>Loading user settings...</div>;
  }

  return (
    <div className={styles.settings}>
      <header className={styles.header}>
        <h1>Settings</h1>
      </header>
      
      <div className={styles.profileCard}>
        <img src={user.avatarurl} alt={user.username} className={styles.avatar} />
        <h2>{user.username}</h2>
        <p>GitHub ID: {user.githubid}</p>
        <button onClick={logout} className={styles.logoutButton}>
          <IoLogOutOutline /> Logout
        </button>
      </div>
    </div>
  );
};

export default Settings;