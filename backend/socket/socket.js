import { Server } from 'socket.io';
import http from 'http';
import express from 'express';

const app = express();

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Map to track user IDs and their corresponding socket IDs
// Key: userId, Value: socketId
const userSocketMap = {};

/**
 * Helper to get the socket ID of a receiver if they are currently online
 */
export const getReceiverSocketId = (receiverId) => {
  return userSocketMap[receiverId];
};

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // Retrieve userId passed from frontend during connection setup
  const userId = socket.handshake.query.userId;
  
  if (userId && userId !== 'undefined') {
    userSocketMap[userId] = socket.id;
  }

  // Broadcast the list of online users to all clients
  io.emit('getOnlineUsers', Object.keys(userSocketMap));

  // Handle typing event: forward typing status to the receiver
  socket.on('typing', ({ senderId, receiverId }) => {
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('userTyping', { senderId });
    }
  });

  // Handle stopTyping event: forward stopped typing status to the receiver
  socket.on('stopTyping', ({ senderId, receiverId }) => {
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('userStoppedTyping', { senderId });
    }
  });

  // Handle socket disconnection
  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
    
    if (userId) {
      delete userSocketMap[userId];
    }
    
    // Broadcast updated online users list
    io.emit('getOnlineUsers', Object.keys(userSocketMap));
  });
});

export { app, io, server };
