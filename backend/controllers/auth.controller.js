import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

// Helper to generate a deterministic initials SVG avatar data URI
const getInitialsAvatar = (username) => {
  const initials = username ? username.substring(0, 2).toUpperCase() : '?';
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899',
    '#14b8a6', '#f43f5e', '#06b6d4', '#84cc16', '#a855f7', '#6366f1'
  ];
  const color = colors[Math.abs(hash) % colors.length];

  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" fill="${encodeURIComponent(color)}"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="40" font-family="system-ui, sans-serif" font-weight="bold" fill="%23ffffff">${initials}</text></svg>`;
};

// Helper function to generate JWT token and set in cookie
const generateToken = (userId, res) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });

  res.cookie('jwt', token, {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    httpOnly: true, // Prevent cross-site scripting (XSS) attacks
    sameSite: 'strict', // CSRF protection
    secure: false, // Set to true in production with HTTPS
  });

  return token;
};

/**
 * Register a new user
 */
export const signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'Username or email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate initials SVG avatar
    const avatarUrl = getInitialsAvatar(username);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      avatar: avatarUrl,
      lastSeen: new Date(),
    });

    await newUser.save();

    // Generate JWT token
    const token = generateToken(newUser._id, res);

    // Respond with user details (excluding password)
    res.status(201).json({
      success: true,
      user: {
        _id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        avatar: newUser.avatar,
        lastSeen: newUser.lastSeen,
        createdAt: newUser.createdAt,
      },
      token,
    });
  } catch (error) {
    console.error('Error in signup controller:', error.message);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

/**
 * Login an existing user
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    // Match password
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = generateToken(user._id, res);

    // Update user lastSeen timestamp
    user.lastSeen = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        lastSeen: user.lastSeen,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (error) {
    console.error('Error in login controller:', error.message);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

/**
 * Logout the user by clearing cookie
 */
export const logout = async (req, res) => {
  try {
    res.cookie('jwt', '', { maxAge: 0 });
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Error in logout controller:', error.message);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

/**
 * Check if the user is authenticated (useful for persistent login after reload)
 */
export const checkAuth = async (req, res) => {
  try {
    // req.user is set by the protectRoute middleware
    res.status(200).json({ success: true, user: req.user });
  } catch (error) {
    console.error('Error in checkAuth controller:', error.message);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

/**
 * Update user profile (e.g. change avatar URL)
 */
export const updateProfile = async (req, res) => {
  try {
    const { avatar } = req.body;
    const userId = req.user._id;

    if (!avatar) {
      return res.status(400).json({ success: false, message: 'Avatar URL is required' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { avatar },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Error in updateProfile controller:', error.message);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
