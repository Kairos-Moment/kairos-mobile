// frontend/src/components/dashboard/BottomNav.jsx
import React from 'react';
import styles from './BottomNav.module.css';
import { IoGridOutline, IoHourglassOutline, IoSyncOutline, IoBarChartOutline, IoSettingsOutline } from 'react-icons/io5';
import { Link, useLocation } from 'react-router-dom';

const navItems = [
    { icon: <IoGridOutline />, label: 'Today', path: '/' },
    { icon: <IoHourglassOutline />, label: 'Focus', path: '/focus-sessions' },
    { icon: <IoSyncOutline />, label: 'Habits', path: '/habits' },
    { icon: <IoBarChartOutline />, label: 'Insights', path: '/report' },
    { icon: <IoSettingsOutline />, label: 'Settings', path: '/settings' },
];

const BottomNav = () => {
    const location = useLocation(); // Hook to get the current path

    return (
        <nav className={styles.bottomNav}>
            {navItems.map((item) => (
                <Link to={item.path} key={item.label} className={`${styles.navItem} ${location.pathname === item.path ? styles.active : ''}`}>
                    {item.icon}
                    <span>{item.label}</span>
                </Link>
            ))}
        </nav>
    );
};

export default BottomNav;