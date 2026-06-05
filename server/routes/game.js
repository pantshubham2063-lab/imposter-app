const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const Word = require('../models/Word');
const ActiveRoom = require('../models/ActiveRoom');

// ─── GET /api/game/categories ──────────────────────────────────────────────────
// Returns all active categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    console.error('[Get Categories Error]', error);
    res.status(500).json({ message: 'Server error fetching categories.' });
  }
});

// ─── GET /api/game/word/:categoryId ────────────────────────────────────────────
// Returns a random word from the specified category
router.get('/word/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    
    // Find all words in this category
    const words = await Word.find({ categoryId });
    
    if (!words || words.length === 0) {
      return res.status(404).json({ message: 'No words found for this category.' });
    }

    // Pick a random word
    const randomIndex = Math.floor(Math.random() * words.length);
    const randomWord = words[randomIndex];

    // Return the word and hint
    res.json({
      word: randomWord.word,
      hint: randomWord.hint,
      difficulty: randomWord.difficulty,
    });
  } catch (error) {
    console.error('[Get Random Word Error]', error);
    res.status(500).json({ message: 'Server error fetching a random word.' });
  }
});

// ─── POST /api/game/room ────────────────────────────────────────────────────────
// Registers a new room with initial state on the server
router.post('/room', async (req, res) => {
  try {
    const {
      roomCode,
      hostId,
      categoryId,
      categoryName,
      secretWord,
      hint,
      players,
      settings,
      gameState,
      messages,
    } = req.body;
    if (!roomCode || roomCode.trim().length !== 6) {
      return res.status(400).json({ message: 'Valid 6-character room code required.' });
    }

    const normalizedCode = roomCode.trim().toUpperCase();

    // Create or update room entry with the complete state
    let room = await ActiveRoom.findOne({ roomCode: normalizedCode });
    if (!room) {
      room = new ActiveRoom({
        roomCode: normalizedCode,
        hostId: hostId || null,
        categoryId: categoryId || null,
        categoryName: categoryName || null,
        secretWord: secretWord || null,
        hint: hint || null,
        players: players || [],
        settings: settings || {},
        gameState: gameState || { phase: 'Lobby' },
        messages: messages || [],
      });
    } else {
      if (hostId !== undefined) room.hostId = hostId;
      if (categoryId !== undefined) room.categoryId = categoryId;
      if (categoryName !== undefined) room.categoryName = categoryName;
      if (secretWord !== undefined) room.secretWord = secretWord;
      if (hint !== undefined) room.hint = hint;
      room.players = players || room.players;
      room.settings = settings || room.settings;
      room.gameState = gameState || room.gameState;
      room.messages = messages || room.messages;
    }
    await room.save();

    res.json({ success: true, room });
  } catch (error) {
    console.error('[Register Room Code Error]', error);
    res.status(500).json({ message: 'Server error registering room.' });
  }
});

// ─── GET /api/game/room/:code ──────────────────────────────────────────────────
// Returns the full live state of a room
router.get('/room/:code', async (req, res) => {
  try {
    const { code } = req.params;
    if (!code || code.trim().length !== 6) {
      return res.status(400).json({ message: 'Valid 6-character code required.' });
    }

    const normalizedCode = code.trim().toUpperCase();
    const room = await ActiveRoom.findOne({ roomCode: normalizedCode });

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room code not found.' });
    }

    res.json({ success: true, room });
  } catch (error) {
    console.error('[Verify Room Code Error]', error);
    res.status(500).json({ message: 'Server error verifying room code.' });
  }
});

// ─── PUT /api/game/room/:code ──────────────────────────────────────────────────
// Updates the live state of an active room
router.put('/room/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const {
      hostId,
      categoryId,
      categoryName,
      secretWord,
      hint,
      players,
      settings,
      gameState,
      messages,
    } = req.body;
    if (!code || code.trim().length !== 6) {
      return res.status(400).json({ message: 'Valid 6-character code required.' });
    }

    const normalizedCode = code.trim().toUpperCase();
    const room = await ActiveRoom.findOne({ roomCode: normalizedCode });

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found.' });
    }

    if (hostId !== undefined) room.hostId = hostId;
    if (categoryId !== undefined) room.categoryId = categoryId;
    if (categoryName !== undefined) room.categoryName = categoryName;
    if (secretWord !== undefined) room.secretWord = secretWord;
    if (hint !== undefined) room.hint = hint;
    if (players !== undefined) room.players = players;
    if (settings !== undefined) room.settings = settings;
    if (gameState !== undefined) room.gameState = gameState;
    if (messages !== undefined) room.messages = messages;

    await room.save();
    res.json({ success: true, room });
  } catch (error) {
    console.error('[Update Room Error]', error);
    res.status(500).json({ message: 'Server error updating room.' });
  }
});

module.exports = router;


