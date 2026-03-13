// frontend/src/components/auth/ProtectedRoute.jsx

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ProtectedRoute = () => {
  // Get the complete state from our custom hook
  const { isAuthenticated, isLoading } = useAuth();

  // --- DEBUGGING BLOCK ---
  // This will print to your browser's developer console (F12)
  console.log(`[ProtectedRoute] Status Check: isLoading=${isLoading}, isAuthenticated=${isAuthenticated}`);
  // --- END DEBUGGING BLOCK ---

  // 1. Primary case: Still loading the initial auth status.
  // Show a loading indicator to prevent any premature redirects or flashes of content.
  if (isLoading) {
    console.log("[ProtectedRoute] Decision: Showing loading screen.");
    // You can replace this with a nice spinner component later
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'var(--font-heading)' }}>Authenticating...</div>;
  }

  // 2. Secondary case: Loading is finished, and the user is authenticated.
  // Allow them to see the protected content.
  if (!isLoading && isAuthenticated) {
    console.log("[ProtectedRoute] Decision: User is authenticated. Rendering Outlet.");
    // The <Outlet /> renders the actual page (e.g., DashboardPage).
    return <Outlet />;
  }

  // 3. Fallback case: Loading is finished, and the user is NOT authenticated.
  // Redirect them to the login page.
  if (!isLoading && !isAuthenticated) {
    console.log("[ProtectedRoute] Decision: User is NOT authenticated. Redirecting to /login.");
    return <Navigate to="/login" replace />;
  }
  
  // This part should ideally never be reached, but it's good practice to have a fallback.
  return null;
};

export default ProtectedRoute;