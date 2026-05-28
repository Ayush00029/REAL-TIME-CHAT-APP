import User from '../models/user.model.js';

/**
 * Fetch all users for the sidebar (excluding the current logged-in user)
 */
export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    // Find all users except current logged-in user, and select properties we need
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select('-password');

    res.status(200).json({ success: true, users: filteredUsers });
  } catch (error) {
    console.error('Error in getUsersForSidebar controller:', error.message);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
