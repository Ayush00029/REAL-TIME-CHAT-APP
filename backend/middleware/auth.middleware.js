import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

/**
 * Protect routes by verifying JWT tokens from cookies or Authorization header.
 */
export const protectRoute = async (req, res, next) => {
  try {
    let token;

    // Check cookies first
    if (req.cookies && req.cookies.jwt) {
      token = req.cookies.jwt;
    } 
    // Check Authorization header next
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Unauthorized - No token provided' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded) {
      return res.status(401).json({ success: false, message: 'Unauthorized - Invalid token' });
    }

    // Find user in database and exclude password field
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Set user on request
    req.user = user;

    next();
  } catch (error) {
    console.error('Error in protectRoute middleware:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Unauthorized - Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Unauthorized - Token expired' });
    }

    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
