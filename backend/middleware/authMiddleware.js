const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect routes: Requires valid JWT token in Authorization header
 */
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authorization token provided.',
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'cloudbeats_jwt_secret_dev_key_2026'
    );
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.',
      error: error.message,
    });
  }
};

/**
 * Admin check middleware: Verifies user has admin privileges
 */
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Access forbidden. Admin privileges are required.',
    });
  }
};

/**
 * Optional authentication: Attaches user if token is provided, otherwise continues as guest
 */
const optionalAuth = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'cloudbeats_jwt_secret_dev_key_2026'
      );
      req.user = await User.findById(decoded.id).select('-password');
    } catch {
      // Ignore token error for optional auth
    }
  }
  next();
};

module.exports = { protect, admin, optionalAuth };

