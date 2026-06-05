const mongoose = require('mongoose');

const ActiveRoomSchema = new mongoose.Schema({
  roomCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  hostId: {
    type: String,
    default: null,
  },
  categoryId: { type: String, default: null },
  categoryName: { type: String, default: null },
  secretWord: { type: String, default: null },
  hint: { type: String, default: null },
  players: {
    type: Array,
    default: [],
  },
  settings: {
    type: Object,
    default: {},
  },
  gameState: {
    type: Object,
    default: { phase: 'Lobby' },
  },
  messages: {
    type: Array,
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400, // Automatically remove room codes after 24 hours
  },
});

module.exports = mongoose.model('ActiveRoom', ActiveRoomSchema);
