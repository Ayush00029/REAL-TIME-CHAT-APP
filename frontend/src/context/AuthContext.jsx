import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import API from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [authUser, setAuthUser] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Check authentication on app mount (persistent login)
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const res = await API.get('/auth/check');
        if (res.data.success) {
          setAuthUser(res.data.user);
        }
      } catch (error) {
        console.log('User is not authenticated (silent check)');
        setAuthUser(null);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuthStatus();
  }, []);

  const signup = async (username, email, password) => {
    setIsRegistering(true);
    try {
      const res = await API.post('/auth/signup', { username, email, password });
      if (res.data.success) {
        setAuthUser(res.data.user);
        toast.success(`Welcome, ${res.data.user.username}! Account created.`);
        return { success: true };
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Registration failed';
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsRegistering(false);
    }
  };

  const login = async (email, password) => {
    setIsLoggingIn(true);
    try {
      const res = await API.post('/auth/login', { email, password });
      if (res.data.success) {
        setAuthUser(res.data.user);
        toast.success(`Welcome back, ${res.data.user.username}!`);
        return { success: true };
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Login failed';
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoggingIn(false);
    }
  };

  const logout = async () => {
    try {
      const res = await API.post('/auth/logout');
      if (res.data.success) {
        setAuthUser(null);
        toast.success('Logged out successfully');
      }
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to log out');
    }
  };

  const updateProfile = async (avatar) => {
    setIsUpdatingProfile(true);
    try {
      const res = await API.put('/auth/update-profile', { avatar });
      if (res.data.success) {
        setAuthUser(res.data.user);
        toast.success('Profile avatar updated successfully');
        return { success: true };
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to update profile';
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        authUser,
        isCheckingAuth,
        isLoggingIn,
        isRegistering,
        isUpdatingProfile,
        signup,
        login,
        logout,
        updateProfile,
        setAuthUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
