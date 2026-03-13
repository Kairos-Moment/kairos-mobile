// frontend/src/contexts/AuthContext.jsx

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import apiClient from '../api/axios'; // Your pre-configured Axios instance

// 1. Create the context object
// This will hold the "shape" of our authentication data and functions.
const AuthContext = createContext(null);

// 2. Create the AuthProvider component
// This component will wrap our entire application and manage the auth state.
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Start as true to handle the initial check

  /**
   * Checks the user's authentication status by calling a protected endpoint.
   * This function is designed to be called once when the application loads.
   * We use `useCallback` to memoize the function, preventing unnecessary re-renders.
   */
  const checkAuthStatus = useCallback(async () => {
    try {
      // Set loading to true whenever we check, just in case we call it again later.
      setIsLoading(true);
      
      // Make the API call to our secure backend endpoint.
      // `apiClient` is already configured with `withCredentials: true` (if set up)
      // to handle sending the session cookie automatically.
      const response = await apiClient.get('/auth/login/success');
      
      // If we get a 200 OK response and our success flag is true...
      if (response.status === 200 && response.data.success) {
        // ...the user has a valid session. Update the state.
        setUser(response.data.user);
        setIsAuthenticated(true);
      } else {
        // Handle cases where the server responds 200 but auth fails (less common).
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      // Any error (especially a 401 Unauthorized) means the user is not logged in.
      console.log("Authentication check failed: User is not logged in.");
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      // IMPORTANT: Set loading to false after the check is complete.
      setIsLoading(false);
    }
  }, []);

  /**
   * The initial authentication check when the component mounts.
   * The empty dependency array `[]` ensures this effect runs only once.
   */
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  /**
   * Logs the user out by calling the backend logout endpoint.
   */
  const logout = async () => {
    try {
      // Call the secure logout endpoint.
      await apiClient.get('/auth/logout'); // Or .post depending on your route definition
      
      // Clear the user state in the frontend immediately.
      setUser(null);
      setIsAuthenticated(false);
      
      // No need for a `window.location.href` redirect. The `ProtectedRoute`
      // component will automatically detect that `isAuthenticated` is now false
      // and redirect the user to the login page. This is a cleaner, more "React-way".
    } catch (error) {
      console.error("Logout failed:", error);
      // Optionally, you could set an error state here to show a message to the user.
    }
  };
  
  // NOTE: A traditional `login` function isn't needed for OAuth redirects.
  // The login process is initiated by navigating to the backend URL, e.g.,
  // `window.location.href = 'https://kairos-backend.onrender.com/api/auth/github'`.
  // However, you could have a placeholder function if needed.
  const login = () => {
    const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';
    window.location.href = `${backendUrl}/auth/github`;
  };

  // 3. The value object that will be provided to all consuming components.
  // We bundle up our state and functions here.
  const value = {
    user,
    isAuthenticated,
    isLoading,
    checkAuthStatus,
    login, // Provide the login redirect function
    logout, // Provide the logout function
  };

  // 4. Return the Provider component.
  // It passes the `value` object to all children wrapped inside it.
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// 5. Create and export a custom hook for easy consumption of the context.
// This is a best practice to make using the context cleaner in other components.
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};