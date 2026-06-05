const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ─── Helper: generate JWT ───────────────────────────────────────────────────
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// ─── Helper: format user for response (strip passwordHash) ──────────────────
const formatUser = (user) => ({
  id: user._id.toString(),
  username: user.username,
  email: user.email,
  avatarUrl: user.avatarUrl,
  level: user.level,
  xp: user.xp,
  gamesPlayed: user.gamesPlayed,
  wins: user.wins,
  losses: user.losses,
  coins: user.coins,
});

// ─── POST /api/auth/register ─────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    // Check if email already exists
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    // Check if username already exists
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(409).json({ message: 'This username is already taken.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const user = new User({
      username,
      email: email.toLowerCase(),
      passwordHash,
    });

    await user.save();

    // Return token + user
    const token = generateToken(user._id);
    return res.status(201).json({ token, user: formatUser(user) });
  } catch (err) {
    console.error('[Register Error]', err);
    return res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'No account found with this email.' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect password. Try again.' });
    }

    // Return token + user
    const token = generateToken(user._id);
    return res.status(200).json({ token, user: formatUser(user) });
  } catch (err) {
    console.error('[Login Error]', err);
    return res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
// Used on app startup to auto-login with stored JWT token
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    return res.status(200).json({ user: formatUser(user) });
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Invalid or expired token.' });
    }
    console.error('[Me Error]', err);
    return res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// ─── PATCH /api/auth/stats ────────────────────────────────────────────────────
// Updates user game stats (wins, losses, xp, coins, gamesPlayed)
router.patch('/stats', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { gamesPlayed, wins, losses, xp, coins } = req.body;

    const user = await User.findByIdAndUpdate(
      decoded.id,
      { $set: { gamesPlayed, wins, losses, xp, coins } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    return res.status(200).json({ user: formatUser(user) });
  } catch (err) {
    console.error('[Stats Error]', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
