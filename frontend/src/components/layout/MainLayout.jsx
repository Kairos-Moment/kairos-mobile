// frontend/src/components/layout/MainLayout.jsx

import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../dashboard/Header';
import BottomNav from '../dashboard/BottomNav';

// A simple CSS for the layout structure
const layoutStyle = {
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  backgroundColor: '#f4f7fa',
};

const mainContentStyle = {
  flexGrow: 1,
  overflowY: 'auto', // Allows the page content to scroll
};

const MainLayout = () => {
  return (
    <div style={layoutStyle}>
      <Header />
      <main style={mainContentStyle}>
        {/* The <Outlet /> is the placeholder where the actual page
            (e.g., DashboardPage, GoalsPage) will be rendered. */}
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
};

export default MainLayout;