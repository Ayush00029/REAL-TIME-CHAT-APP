import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useChat } from '../context/ChatContext';
import {
  LogOut,
  Send,
  Search,
  ArrowLeft,
  Sun,
  Moon,
  MessageSquare,
  Users,
  Circle,
  Smile,
  X,
  UserPlus,
  Copy,
  Check,
  Trash2,
} from 'lucide-react';

// Helper to get the correct avatar source URL (with initials SVG fallback for iran.liara.run links)
const getAvatarSrc = (user) => {
  if (!user) return '';
  if (user.avatar && !user.avatar.includes('avatar.iran.liara.run')) {
    return user.avatar;
  }

  const initials = user.username ? user.username.substring(0, 2).toUpperCase() : '?';
  let hash = 0;
  for (let i = 0; i < user.username.length; i++) {
    hash = user.username.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899',
    '#14b8a6', '#f43f5e', '#06b6d4', '#84cc16', '#a855f7', '#6366f1'
  ];
  const color = colors[Math.abs(hash) % colors.length];

  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" fill="${encodeURIComponent(color)}"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-size="40" font-family="'Outfit', 'Inter', sans-serif" font-weight="bold" fill="%23ffffff">${initials}</text></svg>`;
};

const Dashboard = () => {
  const { authUser, logout, isUpdatingProfile, updateProfile } = useAuth();
  const { onlineUsers } = useSocket();
  const {
    users,
    messages,
    selectedUser,
    isUsersLoading,
    isMessagesLoading,
    isSending,
    typingUsers,
    setSelectedUser,
    getUsers,
    getMessages,
    sendMessage,
    sendTypingStatus,
    clearChat,
  } = useChat();

  const [messageText, setMessageText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // Sync avatar selection with authenticated user
  useEffect(() => {
    if (authUser) {
      setCustomAvatarUrl(authUser.avatar || '');
    }
  }, [authUser]);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const [amTyping, setAmTyping] = useState(false);

  // Load users on mount
  useEffect(() => {
    getUsers();
  }, []);

  // Fetch messages when selected user changes
  useEffect(() => {
    if (selectedUser) {
      getMessages(selectedUser._id);
      // Reset typing state on recipient switch
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      setAmTyping(false);
      sendTypingStatus(false);
    }
  }, [selectedUser]);

  // Auto scroll to bottom when messages load or arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, typingUsers]);

  // Toggle Dark Mode
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  // Send message handler
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || isSending) return;

    // Stop typing status immediately when sending
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    setAmTyping(false);
    sendTypingStatus(false);

    const success = await sendMessage(messageText.trim());
    if (success) {
      setMessageText('');
    }
  };

  // Debounced input change for typing status
  const handleInputChange = (e) => {
    setMessageText(e.target.value);

    if (!socketActive()) return;

    if (!amTyping) {
      setAmTyping(true);
      sendTypingStatus(true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setAmTyping(false);
      sendTypingStatus(false);
    }, 2000);
  };

  const socketActive = () => {
    return selectedUser !== null;
  };

  // Helper to format date timestamps
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Filter sidebar users
  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase());
    const isOnline = onlineUsers.includes(user._id);
    return showOnlineOnly ? matchesSearch && isOnline : matchesSearch;
  });

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300 overflow-hidden">
      
      {/* Top Navbar */}
      <header className="h-16 px-4 md:px-6 border-b border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-900 flex items-center justify-between z-10 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent dark:from-indigo-400">
            Chat App
          </span>
        </div>

        {/* User profile & actions */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowProfileModal(true)}
            className="flex items-center space-x-2.5 hover:opacity-85 active:scale-95 transition-all focus:outline-none"
            title="View Profile Settings"
          >
            <img
              src={getAvatarSrc(authUser)}
              alt="Avatar"
              className="w-9 h-9 rounded-full ring-2 ring-indigo-500/20 object-cover"
            />
            <span className="hidden md:inline font-medium text-sm">
              {authUser?.username}
            </span>
          </button>

          <div className="h-5 w-px bg-slate-200 dark:bg-slate-800"></div>

          {/* Theme Switcher */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
            title="Toggle theme"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Logout button */}
          <button
            onClick={logout}
            className="p-2 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-full transition-colors text-red-500 hover:text-red-600"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Layout Container */}
      <main className="flex-1 flex overflow-hidden relative">
        
        {/* Sidebar: Users list */}
        <section
          className={`w-full md:w-80 lg:w-96 border-r border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-900 flex flex-col transition-all duration-300 shrink-0 ${
            selectedUser ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* User Search & Filters */}
          <div className="p-4 space-y-3.5 border-b border-slate-100 dark:border-slate-900">
            <div className="relative">
              <Search className="w-4.5 h-4.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search chats..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-600 outline-none rounded-xl pl-10 pr-4 py-2 text-sm text-slate-800 dark:text-slate-200 transition-all"
              />
            </div>

            {/* Online Filter Switch */}
            <div className="flex items-center justify-between text-xs px-1">
              <label htmlFor="online-toggle" className="text-slate-500 dark:text-slate-400 font-medium flex items-center space-x-1.5 cursor-pointer">
                <Users className="w-3.5 h-3.5" />
                <span>Show online only</span>
              </label>
              <button
                id="online-toggle"
                onClick={() => setShowOnlineOnly(!showOnlineOnly)}
                className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
                  showOnlineOnly ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-800'
                }`}
              >
                <div
                  className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-200 ${
                    showOnlineOnly ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Invite Friends Button */}
            <button
              onClick={() => setShowInviteModal(true)}
              className="w-full py-2 px-3 bg-indigo-50/70 dark:bg-slate-800/40 hover:bg-indigo-100/70 dark:hover:bg-slate-800/85 text-indigo-650 dark:text-indigo-400 font-semibold rounded-xl text-xs flex items-center justify-center space-x-2 transition-all border border-indigo-100/40 dark:border-slate-800/50"
            >
              <UserPlus className="w-4 h-4" />
              <span>Invite Friends</span>
            </button>
          </div>

          {/* Users List Scroll Area */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-900/40">
            {isUsersLoading ? (
              <div className="flex flex-col items-center justify-center h-48 space-y-3">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm text-slate-400">Loading contacts...</span>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12 text-slate-400 px-4">
                <p className="font-medium text-sm">No contacts found</p>
                <p className="text-xs mt-1 text-slate-500">
                  {showOnlineOnly ? 'No online users right now' : 'Invite friends to start chatting'}
                </p>
              </div>
            ) : (
              filteredUsers.map((user) => {
                const isOnline = onlineUsers.includes(user._id);
                const isUserTyping = typingUsers[user._id];
                const isSelected = selectedUser?._id === user._id;

                return (
                  <button
                    key={user._id}
                    onClick={() => setSelectedUser(user)}
                    className={`w-full p-4 flex items-center space-x-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/30 text-left transition-all ${
                      isSelected ? 'bg-indigo-50/50 dark:bg-slate-800/40 border-l-4 border-indigo-600' : 'border-l-4 border-transparent'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <img
                        src={getAvatarSrc(user)}
                        alt={user.username}
                        className="w-12 h-12 rounded-full object-cover shadow-sm bg-slate-100 dark:bg-slate-800"
                      />
                      {/* Active Status Badge */}
                      <span
                        className={`absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${
                          isOnline ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                        }`}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className={`font-semibold truncate text-sm ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-200'}`}>
                          {user.username}
                        </h4>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {isOnline ? 'Active' : 'Offline'}
                        </span>
                      </div>
                      <p className="text-xs truncate mt-0.5 text-slate-500 dark:text-slate-400">
                        {isUserTyping ? (
                          <span className="text-indigo-600 dark:text-indigo-400 font-semibold animate-pulse-slow">
                            typing...
                          </span>
                        ) : (
                          user.email
                        )}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </section>

        {/* Chat Window Panel */}
        <section className={`flex-1 flex flex-col bg-slate-50 dark:bg-slate-950/70 overflow-hidden ${!selectedUser ? 'hidden md:flex' : 'flex'}`}>
          {selectedUser ? (
            <>
              {/* Chat Header */}
              <div className="h-16 px-4 md:px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-900 flex items-center justify-between shrink-0 shadow-sm">
                <div className="flex items-center space-x-3.5 min-w-0">
                  {/* Mobile Back Button */}
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full md:hidden text-slate-500 dark:text-slate-400 mr-1 transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  <div className="relative shrink-0">
                    <img
                      src={getAvatarSrc(selectedUser)}
                      alt={selectedUser.username}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <span
                      className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-900 ${
                        onlineUsers.includes(selectedUser._id) ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                      }`}
                    />
                  </div>

                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm truncate text-slate-800 dark:text-slate-100">
                      {selectedUser.username}
                    </h3>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">
                      {typingUsers[selectedUser._id] ? (
                        <span className="text-indigo-600 dark:text-indigo-400 font-semibold animate-pulse-slow">
                          typing...
                        </span>
                      ) : onlineUsers.includes(selectedUser._id) ? (
                        'Online'
                      ) : (
                        'Offline'
                      )}
                    </p>
                  </div>
                </div>

                {/* Chat Header Actions */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowClearConfirmModal(true)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-400 hover:text-red-500 dark:hover:bg-slate-800/80 focus:outline-none"
                    title="Clear Chat History"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Message History Grid */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 chat-wallpaper">
                {isMessagesLoading ? (
                  <div className="flex flex-col items-center justify-center h-full space-y-2">
                    <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs text-slate-400">Fetching messages...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-3">
                    <div className="w-14 h-14 bg-indigo-50 dark:bg-slate-900 rounded-full flex items-center justify-center shadow-inner">
                      <MessageSquare className="w-6 h-6 text-indigo-500" />
                    </div>
                    <p className="text-sm font-medium">Say hello to {selectedUser.username}!</p>
                    <p className="text-xs text-slate-500">Send a message to start conversation.</p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isSelf = message.senderId === authUser?._id;

                    return (
                      <div
                        key={message._id}
                        className={`flex w-full ${isSelf ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[75%] md:max-w-[65%] rounded-2xl px-4 py-2.5 shadow-sm text-sm break-words relative transition-all ${
                            isSelf
                              ? 'bg-indigo-600 text-white rounded-tr-none'
                              : 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none'
                          }`}
                        >
                          <p className="leading-relaxed">{message.text}</p>
                          <span
                            className={`block text-[9px] text-right mt-1.5 ${
                              isSelf ? 'text-indigo-200' : 'text-slate-400'
                            }`}
                          >
                            {formatTime(message.createdAt)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Receiver is typing indicator bubble */}
                {typingUsers[selectedUser._id] && (
                  <div className="flex w-full justify-start animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 rounded-2xl rounded-tl-none px-4 py-3 flex items-center space-x-1.5 shadow-sm">
                      <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                )}

                {/* Virtual anchor scroll target */}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Composer Box */}
              <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-900 shrink-0">
                <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={messageText}
                    onChange={handleInputChange}
                    className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:ring-indigo-600 outline-none rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-slate-200 transition-all placeholder:text-slate-400"
                    disabled={isSending}
                  />
                  <button
                    type="submit"
                    disabled={!messageText.trim() || isSending}
                    className="p-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl transition-all duration-200 shadow-md shadow-indigo-600/10 hover:shadow-lg hover:shadow-indigo-600/20 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center shrink-0"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            // Landing state before conversation is active
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center chat-wallpaper">
              <div className="max-w-md space-y-6">
                <div className="w-20 h-20 bg-indigo-50 dark:bg-slate-900 rounded-3xl flex items-center justify-center mx-auto shadow-md">
                  <MessageSquare className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                    Welcome to the Chat App!
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm max-w-sm mx-auto leading-relaxed">
                    Select a contact from the sidebar user list to fetch conversation history and start messaging in real-time.
                  </p>
                </div>
                <div className="inline-flex items-center space-x-2 bg-indigo-50 dark:bg-slate-900/60 border border-indigo-100/50 dark:border-slate-850 px-4 py-2.5 rounded-2xl text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                  <Circle className="w-2.5 h-2.5 fill-current animate-pulse text-emerald-500" />
                  <span>Real-time connection initialized</span>
                </div>
              </div>
            </div>
          )}
        </section>

      </main>

      {/* Profile Settings Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 md:p-8 relative glass">
            {/* Close Button */}
            <button
              onClick={() => setShowProfileModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            {/* Modal Header */}
            <div className="flex flex-col items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Profile Settings</h2>
              <p className="text-xs text-slate-400 mt-1">Manage your identity and avatar settings</p>
            </div>

            {/* Avatar Review */}
            <div className="flex flex-col items-center space-y-4 mb-6">
              <div className="relative">
                <img
                  src={getAvatarSrc({ ...authUser, avatar: customAvatarUrl })}
                  alt="Profile Avatar"
                  className="w-24 h-24 rounded-full object-cover border-2 border-indigo-500 shadow-md bg-slate-100 dark:bg-slate-800"
                />
              </div>
              <p className="text-xs font-semibold text-indigo-650 dark:text-indigo-400">Avatar Preview</p>
            </div>

            {/* Preset Avatars Selection */}
            <div className="mb-5">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                Choose a preset avatar
              </label>
              <div className="grid grid-cols-6 gap-2">
                {PRESET_AVATARS.map((avatar, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCustomAvatarUrl(avatar)}
                    className={`rounded-full overflow-hidden border-2 transition-transform hover:scale-105 active:scale-95 shrink-0 ${
                      customAvatarUrl === avatar ? 'border-indigo-500 scale-105 ring-2 ring-indigo-500/20' : 'border-transparent'
                    }`}
                  >
                    <img src={avatar} alt={`Preset ${idx + 1}`} className="w-10 h-10 object-cover bg-slate-100 dark:bg-slate-800" />
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Avatar Input */}
            <div className="mb-6">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                Or paste a custom avatar URL
              </label>
              <input
                type="text"
                value={customAvatarUrl}
                onChange={(e) => setCustomAvatarUrl(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-slate-200 transition-all placeholder:text-slate-455"
              />
            </div>

            {/* User Metadata */}
            <div className="bg-slate-50 dark:bg-slate-950/40 rounded-xl p-4 mb-6 text-xs space-y-2.5 border border-slate-100 dark:border-slate-900/50">
              <div className="flex justify-between">
                <span className="text-slate-400">Username:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">{authUser?.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Email Address:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">{authUser?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Member Since:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {authUser?.createdAt ? new Date(authUser.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>

            {/* Save Buttons */}
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowProfileModal(false);
                  setCustomAvatarUrl(authUser?.avatar || '');
                }}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-medium rounded-xl text-xs transition-colors"
                disabled={isUpdatingProfile}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!customAvatarUrl.trim()) return toast.error('Avatar URL cannot be empty');
                  const res = await updateProfile(customAvatarUrl.trim());
                  if (res && res.success) {
                    setShowProfileModal(false);
                  }
                }}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium rounded-xl text-xs transition-all duration-200 flex items-center justify-center space-x-1.5 disabled:opacity-50"
                disabled={isUpdatingProfile}
              >
                {isUpdatingProfile ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Friends Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 md:p-8 relative glass">
            {/* Close Button */}
            <button
              onClick={() => {
                setShowInviteModal(false);
                setCopied(false);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 transition-colors p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            {/* Modal Header */}
            <div className="flex flex-col items-center mb-6">
              <div className="w-12 h-12 bg-indigo-50 dark:bg-slate-900 rounded-full flex items-center justify-center mb-3 shadow-inner">
                <UserPlus className="w-6 h-6 text-indigo-500" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Invite Friends</h2>
              <p className="text-xs text-slate-400 mt-1.5 text-center max-w-xs leading-relaxed">
                Copy the invitation link below or share it on social media to invite your friends to start chatting!
              </p>
            </div>

            {/* Invite Link Clipboard Row */}
            <div className="mb-6">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 ml-1">
                Invitation Link
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/register?invitedBy=${encodeURIComponent(authUser?.username || '')}`}
                  className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 outline-none rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-250 font-medium select-all"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/register?invitedBy=${encodeURIComponent(authUser?.username || '')}`);
                    setCopied(true);
                    toast.success('Invite link copied to clipboard!');
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="p-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl transition-colors flex items-center justify-center shrink-0 shadow-sm"
                  title="Copy to clipboard"
                >
                  {copied ? <Check className="w-4.5 h-4.5" /> : <Copy className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>

            {/* Social Sharing Options */}
            <div className="space-y-3">
              <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1">
                Quick Share
              </span>
              <div className="grid grid-cols-2 gap-3">
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                    `Hey! Chat with me on this modern Realtime Chat App. Register here: ${window.location.origin}/register?invitedBy=${authUser?.username || ''}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center space-x-2 py-2.5 border border-emerald-500/20 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 rounded-xl text-xs font-semibold transition-colors"
                >
                  <span>WhatsApp</span>
                </a>
                <a
                  href={`mailto:?subject=Join%20me%20on%20Chat%20App&body=${encodeURIComponent(
                    `Hey!\n\nI'm using this Realtime Chat App to stay connected. Click the link to register and start chatting with me:\n\n${window.location.origin}/register?invitedBy=${authUser?.username || ''}`
                  )}`}
                  className="flex items-center justify-center space-x-2 py-2.5 border border-indigo-500/20 hover:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-semibold transition-colors"
                >
                  <span>Email</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clear Chat Confirmation Modal */}
      {showClearConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="max-w-sm w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 md:p-8 relative glass">
            {/* Close Button */}
            <button
              onClick={() => setShowClearConfirmModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            {/* Modal Header */}
            <div className="flex flex-col items-center mb-6 text-center">
              <div className="w-12 h-12 bg-red-50 dark:bg-red-950/20 rounded-full flex items-center justify-center mb-3 shadow-inner">
                <Trash2 className="w-6 h-6 text-red-500 animate-pulse-slow" />
              </div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Clear Chat History?</h2>
              <p className="text-xs text-slate-450 dark:text-slate-400 mt-1.5 leading-relaxed">
                Are you sure you want to clear your chat history with <span className="font-semibold text-slate-700 dark:text-slate-200">{selectedUser?.username}</span>? This action cannot be undone.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setShowClearConfirmModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-medium rounded-xl text-xs transition-colors focus:outline-none"
                disabled={isClearing}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setIsClearing(true);
                  await clearChat(selectedUser._id);
                  setIsClearing(false);
                  setShowClearConfirmModal(false);
                }}
                className="flex-1 py-2.5 bg-red-650 hover:bg-red-700 active:bg-red-800 text-white font-medium rounded-xl text-xs transition-all duration-200 flex items-center justify-center space-x-1.5 disabled:opacity-50 focus:outline-none"
                disabled={isClearing}
              >
                {isClearing ? 'Clearing...' : 'Clear Chat'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

const PRESET_AVATARS = [
  `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" fill="%233b82f6"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-size="50">👨‍💻</text></svg>`,
  `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" fill="%23ec4899"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-size="50">👩‍💻</text></svg>`,
  `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" fill="%2310b981"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-size="50">🦊</text></svg>`,
  `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" fill="%23f59e0b"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-size="50">🐱</text></svg>`,
  `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" fill="%238b5cf6"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-size="50">🐼</text></svg>`,
  `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" fill="%23ef4444"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-size="50">🦁</text></svg>`,
  `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" fill="%2314b8a6"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-size="50">🦄</text></svg>`,
  `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" fill="%23f43f5e"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-size="50">🐰</text></svg>`,
  `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" fill="%2306b6d4"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-size="50">🐨</text></svg>`,
  `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" fill="%2384cc16"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-size="50">🐸</text></svg>`,
  `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" fill="%23a855f7"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-size="50">🐯</text></svg>`,
  `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" fill="%236366f1"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-size="50">🤖</text></svg>`,
];

export default Dashboard;
