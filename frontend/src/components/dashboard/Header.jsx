// frontend/src/components/dashboard/Header.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Header.module.css';
import { IoNotificationsOutline, IoLogOutOutline } from 'react-icons/io5';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { useState } from 'react';

const Header = () => {
  // 2. Get auth state and functions from the AuthContext
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, clearNotifications } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);

  // 3. Get the real current date and format it
  const displayDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // 4. A simple loading state to prevent a "flash" of the guest view
  if (isLoading) {
    return (
      <header className={styles.header}>
        <div className={styles.logo}>
          <img src="/Kairos-Logo.png" alt="Kairos Logo" className={styles.logoIcon} />
          <h1>Kairos</h1>
        </div>
        <div className={styles.userSection}>
          <span>Loading...</span>
        </div>
      </header>
    );
  }

  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <img src="/Kairos-Logo.png" alt="Kairos Logo" className={styles.logoIcon} />
        <h1>Kairos</h1>
      </div>
      <div className={styles.dateDisplay}>{displayDate}</div>

      {/* 5. Conditionally render the user section based on authentication status */}
      {isAuthenticated && user ? (
        // --- LOGGED-IN VIEW ---
        <div className={styles.userSection}>
          <img src={user.avatarurl} alt={user.username} className={styles.avatar} />
          <span>{user.username}</span>

          {/* Notification Icon with Dropdown */}
          <div className={styles.notificationWrapper}>
            <button
              className={`${styles.iconButton} ${showNotifications ? styles.active : ''}`}
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <IoNotificationsOutline size={24} className={styles.icon} />
              {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
            </button>

            {showNotifications && (
              <div className={styles.notificationDropdown}>
                <div className={styles.dropdownHeader}>
                  <h3>Notifications</h3>
                  {notifications.length > 0 && (
                    <button onClick={clearNotifications} className={styles.clearBtn}>
                      Clear All
                    </button>
                  )}
                </div>
                <div className={styles.notificationList}>
                  {notifications.length === 0 ? (
                    <p className={styles.emptyState}>No new notifications</p>
                  ) : (
                    notifications.map(note => (
                      <div
                        key={note.id}
                        className={`${styles.notificationItem} ${!note.isRead ? styles.unread : ''}`}
                        onClick={() => markAsRead(note.id)}
                      >
                        <p>{note.message}</p>
                        <span className={styles.timestamp}>
                          {new Date(note.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>


          <button onClick={logout} className={styles.logoutButton} title="Logout">
            <IoLogOutOutline size={24} />
          </button>
        </div>
      ) : (
        // --- GUEST VIEW ---
        <div className={styles.userSection}>
          <Link to="/login" className={styles.loginLink}>Login</Link>
        </div>
      )}
    </header>
  );
};

export default Header;