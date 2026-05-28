import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const { authUser } = useAuth();

  useEffect(() => {
    let socketInstance;

    // Connect to Socket.io server if user is logged in
    if (authUser) {
      socketInstance = io('http://localhost:5000', {
        query: {
          userId: authUser._id,
        },
      });

      setSocket(socketInstance);

      // Listen for the online users list broadcast
      socketInstance.on('getOnlineUsers', (users) => {
        setOnlineUsers(users);
      });

      return () => {
        socketInstance.close();
        setSocket(null);
      };
    } else {
      // Disconnect socket if user logs out
      if (socket) {
        socket.close();
        setSocket(null);
      }
    }
  }, [authUser]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
