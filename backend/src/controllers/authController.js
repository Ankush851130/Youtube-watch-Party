import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'watchtogether_jwt_secret_key_2026_super_safe';

// Fallback in-memory user store if MongoDB is offline
const inMemoryUsers = new Map();

const generateToken = (userId, email, username) => {
  return jwt.sign(
    { userId, email, username },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body || {};

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, error: 'Username, email, and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim();

    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters long.' });
    }

    let existingUser = null;
    try {
      existingUser = await User.findOne({ $or: [{ email: cleanEmail }, { username: cleanUsername }] });
    } catch (e) {
      // In-memory fallback
      for (const u of inMemoryUsers.values()) {
        if (u.email === cleanEmail || u.username === cleanUsername) {
          existingUser = u;
          break;
        }
      }
    }

    if (existingUser) {
      const isEmail = existingUser.email === cleanEmail;
      return res.status(400).json({ 
        success: false, 
        error: isEmail ? 'Email is already registered. Please login.' : 'Username is already taken. Please choose another.' 
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanUsername)}`;

    let newUserObj;
    let userId;

    try {
      const createdUser = await User.create({
        username: cleanUsername,
        email: cleanEmail,
        password: hashedPassword,
        avatar
      });
      userId = createdUser._id.toString();
      newUserObj = {
        userId,
        username: createdUser.username,
        email: createdUser.email,
        avatar: createdUser.avatar
      };
    } catch (dbErr) {
      // MongoDB offline fallback
      userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      newUserObj = {
        userId,
        username: cleanUsername,
        email: cleanEmail,
        password: hashedPassword,
        avatar
      };
      inMemoryUsers.set(userId, newUserObj);
    }

    const token = generateToken(userId, cleanEmail, cleanUsername);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: {
        userId,
        username: cleanUsername,
        email: cleanEmail,
        avatar
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ success: false, error: 'Failed to create account. Please try again.' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    let user = null;
    try {
      user = await User.findOne({ email: cleanEmail });
    } catch (e) {
      for (const u of inMemoryUsers.values()) {
        if (u.email === cleanEmail) {
          user = u;
          break;
        }
      }
    }

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    const userId = user._id ? user._id.toString() : user.userId;
    const avatar = user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.username)}`;
    const token = generateToken(userId, user.email, user.username);

    return res.json({
      success: true,
      message: 'Logged in successfully!',
      token,
      user: {
        userId,
        username: user.username,
        email: user.email,
        avatar
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, error: 'Login failed. Please try again.' });
  }
};

export const getMe = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'No authorization token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    let user = null;
    try {
      user = await User.findById(decoded.userId).select('-password');
    } catch (e) {
      user = inMemoryUsers.get(decoded.userId);
    }

    if (!user && decoded.userId) {
      // Create user response from token if memory restarted
      user = {
        userId: decoded.userId,
        username: decoded.username,
        email: decoded.email,
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(decoded.username)}`
      };
    }

    const userId = user._id ? user._id.toString() : user.userId;
    const avatar = user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.username)}`;

    return res.json({
      success: true,
      user: {
        userId,
        username: user.username,
        email: user.email,
        avatar
      }
    });
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Invalid or expired token.' });
  }
};
