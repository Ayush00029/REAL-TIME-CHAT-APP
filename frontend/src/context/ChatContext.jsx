import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import API from '../services/api';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';

const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState({}); // key: userId, value: boolean

  const { socket } = useSocket();
  const { authUser } = useAuth();

  // Ref to access selectedUser inside socket listener closure without stale references
  const selectedUserRef = useRef(selectedUser);
  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);

  // Dynamically play a modern, subtle synth beep sound using browser's Web Audio API
  const playNotificationSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.3);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch (e) {
      console.warn('Audio feedback failed', e);
    }
  };

  // Fetch all users for the sidebar
  const getUsers = async () => {
    setIsUsersLoading(true);
    try {
      const res = await API.get('/users');
      if (res.data.success) {
        setUsers(res.data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsUsersLoading(false);
    }
  };

  // Fetch message history for a user
  const getMessages = async (userId) => {
    setIsMessagesLoading(true);
    try {
      const res = await API.get(`/messages/${userId}`);
      if (res.data.success) {
        setMessages(res.data.messages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsMessagesLoading(false);
    }
  };

  // Send a message
  const sendMessage = async (text) => {
    if (!selectedUser) return;
    setIsSending(true);
    try {
      const res = await API.post(`/messages/send/${selectedUser._id}`, { text });
      if (res.data.success) {
        setMessages((prev) => [...prev, res.data.message]);
      }
      return { success: true };
    } catch (error) {
      console.error('Error sending message:', error);
      return { success: false };
    } finally {
      setIsSending(false);
    }
  };

  // Emit typing status
  const sendTypingStatus = (isTyping) => {
    if (!socket || !selectedUser || !authUser) return;
    const event = isTyping ? 'typing' : 'stopTyping';
    socket.emit(event, {
      senderId: authUser._id,
      receiverId: selectedUser._id,
    });
  };

  // Socket event listeners for real-time interactions
  useEffect(() => {
    if (!socket) return;

    // Listen for new incoming messages
    socket.on('newMessage', (message) => {
      const currentSelected = selectedUserRef.current;
      
      // If the incoming message is from the user we are currently chatting with
      if (currentSelected && message.senderId === currentSelected._id) {
        setMessages((prev) => [...prev, message]);
      } else {
        // Play notification sound if the message is from another user
        playNotificationSound();
      }
    });

    // Listen for typing events
    socket.on('userTyping', ({ senderId }) => {
      setTypingUsers((prev) => ({ ...prev, [senderId]: true }));
    });

    // Listen for stop typing events
    socket.on('userStoppedTyping', ({ senderId }) => {
      setTypingUsers((prev) => ({ ...prev, [senderId]: false }));
    });

    return () => {
      socket.off('newMessage');
      socket.off('userTyping');
      socket.off('userStoppedTyping');
    };
  }, [socket]);

  return (
    <ChatContext.Provider
      value={{
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
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
