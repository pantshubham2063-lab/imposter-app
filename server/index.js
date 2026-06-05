require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');

const authRoutes = require('./routes/auth');
const gameRoutes = require('./routes/game');
const { attachVoiceSocket } = require('./voiceSocket');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  maxHttpBufferSize: 8e6, // ~8MB for voice clips
});
attachVoiceSocket(io);

const PORT = process.env.PORT || 3001;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Imposter App Server is running 🚀',
    voice: true,
  });
});

// ─── Connect to MongoDB & Start Server ────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log(' MongoDB connected:', process.env.MONGO_URI);
    server.listen(PORT, '0.0.0.0', () => {
      console.log(` Server running on http://0.0.0.0:${PORT}`);
      console.log(`   → Local:   http://localhost:${PORT}`);
      console.log(`   → Network: Check your local IP for phone access`);
      console.log(`   → Voice:   Socket.IO on same port`);
    });
  })
  .catch((err) => {
    console.error(' MongoDB connection failed:', err.message);
    process.exit(1);
  });
