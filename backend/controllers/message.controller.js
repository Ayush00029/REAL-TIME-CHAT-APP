import Message from '../models/message.model.js';
import { getReceiverSocketId, io } from '../socket/socket.js';

/**
 * Fetch message history between the logged-in user and another user
 */
export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const senderId = req.user._id;

    // Find messages where:
    // (sender is me and receiver is userToChat) OR (sender is userToChat and receiver is me)
    const messages = await Message.find({
      $or: [
        { senderId: senderId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: senderId },
      ],
    }).sort({ createdAt: 1 }); // Sort by time ascending

    res.status(200).json({ success: true, messages });
  } catch (error) {
    console.error('Error in getMessages controller:', error.message);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

/**
 * Send a message to another user
 */
export const sendMessage = async (req, res) => {
  try {
    const { text } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    if (!text || text.trim() === '') {
      return res.status(400).json({ success: false, message: 'Message text cannot be empty' });
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text: text.trim(),
    });

    await newMessage.save();

    // Socket.io real-time delivery
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      // Send message to the specific socket ID
      io.to(receiverSocketId).emit('newMessage', newMessage);
    }

    res.status(201).json({ success: true, message: newMessage });
  } catch (error) {
    console.error('Error in sendMessage controller:', error.message);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
