import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoggingIn } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.email.trim()) return toast.error('Email is required');
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(formData.email.trim())) return toast.error('Please enter a valid email address');
    if (!formData.password) return toast.error('Password is required');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm() === true) {
      const result = await login(formData.email.trim(), formData.password);
      if (result.success) {
        navigate('/');
      }
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/20 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 px-4 transition-colors duration-500 overflow-hidden">
      {/* Premium Decorative Ambient Blobs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-indigo-400/20 dark:bg-indigo-950/20 rounded-full blur-3xl animate-pulse-slow"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-400/15 dark:bg-violet-950/15 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>

      <div className="max-w-md w-full p-8 rounded-2xl shadow-2xl glass relative z-10 transition-all duration-300 border border-white/50 dark:border-white/5 shadow-indigo-500/5 dark:shadow-black/40">
        
        {/* Header Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-3 animate-bounce">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">
            Welcome Back
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Sign in to check your messages and connect
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                <Mail className="w-5 h-5" />
              </div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="block w-full pl-11 pr-4 py-3 bg-white/70 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-600 outline-none text-slate-800 dark:text-white transition-all text-sm"
                placeholder="you@example.com"
                disabled={isLoggingIn}
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                <Lock className="w-5 h-5" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="block w-full pl-11 pr-11 py-3 bg-white/70 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-600 outline-none text-slate-800 dark:text-white transition-all text-sm"
                placeholder="••••••••"
                disabled={isLoggingIn}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                disabled={isLoggingIn}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoggingIn}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.01] active:scale-95 shadow-md shadow-indigo-600/20 hover:shadow-lg hover:shadow-indigo-600/30 flex items-center justify-center space-x-2 text-sm disabled:opacity-50 disabled:pointer-events-none"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Logging In...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        {/* Redirect section */}
        <div className="text-center mt-6">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline transition-colors"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
