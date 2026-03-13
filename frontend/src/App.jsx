// frontend/src/App.jsx

import { Routes, Route } from 'react-router-dom';

// Import Layouts and ProtectedRoute
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Import Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import WeeklyReport from './pages/WeeklyReport';
import FocusSession from './pages/FocusSession';
import Habits from './pages/Habits';
import Settings from './pages/Settings';

function App() {
  return (
    <Routes>
      {/* --- Public Route --- */}
      <Route path="/login" element={<Login />} />

      {/* --- Protected Routes with Main Layout --- */}
      {/* 
        This is a nested routing structure. 
        1. The ProtectedRoute checks if the user is logged in.
        2. If logged in, the MainLayout is rendered (Header, Footer, and an Outlet).
        3. The specific child route (e.g., DashboardPage) is then rendered inside the MainLayout's <Outlet />.
      */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/report" element={<WeeklyReport />} />
          <Route path="/focus-sessions" element={<FocusSession />} />
          <Route path="/habits" element={<Habits />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>

      {/* <Route path="*" element={<NotFoundPage />} /> */}
    </Routes>
  );
}

export default App;