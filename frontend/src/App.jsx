import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ChatProvider } from './context/ChatContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import { Toaster } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

/**
 * Route protection wrapper for authenticated pages
 */
const ProtectedRoute = ({ children }) => {
  const { authUser, isCheckingAuth } = useAuth();

  if (isCheckingAuth) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-slate-500 dark:text-slate-400 mt-4 text-sm font-medium animate-pulse">
          Securing session, please wait...
        </p>
      </div>
    );
  }

  if (!authUser) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

/**
 * Route protection wrapper for guest-only pages (login, register)
 */
const GuestRoute = ({ children }) => {
  const { authUser, isCheckingAuth } = useAuth();

  if (isCheckingAuth) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-slate-500 dark:text-slate-400 mt-4 text-sm font-medium animate-pulse">
          Loading layout...
        </p>
      </div>
    );
  }

  if (authUser) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const AppContent = () => {
  return (
    <Router>
      <Routes>
        {/* Private Protected Dashboard */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Guest Routes */}
        <Route
          path="/login"
          element={
            <GuestRoute>
              <Login />
            </GuestRoute>
          }
        />
        <Route
          path="/register"
          element={
            <GuestRoute>
              <Register />
            </GuestRoute>
          }
        />

        {/* Fallback Catch-all Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      
      {/* Toast Notification Provider */}
      <Toaster position="top-center" reverseOrder={false} />
    </Router>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <SocketProvider>
        <ChatProvider>
          <AppContent />
        </ChatProvider>
      </SocketProvider>
    </AuthProvider>
  );
};

export default App;
