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

const Category = require('./models/Category');
const Word = require('./models/Word');

async function autoSeed() {
  try {
    const count = await Category.countDocuments();
    if (count === 0) {
      console.log('No categories found. Auto-seeding database...');
      const seedData = [
        {
          category: 'Animals & Nature',
          icon: 'Leaf',
          words: [
            { word: 'Lion', hint: 'King of the jungle', difficulty: 'Easy' },
            { word: 'Penguin', hint: 'A bird that cannot fly but swims well', difficulty: 'Easy' },
            { word: 'Elephant', hint: 'The largest living land animal', difficulty: 'Easy' },
            { word: 'Chameleon', hint: 'Known for changing its color', difficulty: 'Medium' },
            { word: 'Platypus', hint: 'A mammal that lays eggs', difficulty: 'Hard' },
          ]
        },
        {
          category: 'Food & Drinks',
          icon: 'Coffee',
          words: [
            { word: 'Pizza', hint: 'Often comes in a cardboard box, sliced in triangles', difficulty: 'Easy' },
            { word: 'Sushi', hint: 'A Japanese dish featuring vinegared rice and seafood', difficulty: 'Easy' },
            { word: 'Croissant', hint: 'A buttery, flaky, pastry of Austrian origin', difficulty: 'Medium' },
            { word: 'Kombucha', hint: 'A fermented, lightly effervescent sweetened black or green tea drink', difficulty: 'Hard' },
          ]
        },
        {
          category: 'Movies & TV Shows',
          icon: 'Film',
          words: [
            { word: 'Harry Potter', hint: 'A boy who goes to a magical school', difficulty: 'Easy' },
            { word: 'Star Wars', hint: 'Involves lightsabers and the Force', difficulty: 'Easy' },
            { word: 'Inception', hint: 'A movie about entering people\'s dreams', difficulty: 'Medium' },
            { word: 'Breaking Bad', hint: 'A chemistry teacher turns to a life of crime', difficulty: 'Medium' },
          ]
        },
        {
          category: 'Technology',
          icon: 'Cpu',
          words: [
            { word: 'Smartphone', hint: 'A device you probably use every day to communicate', difficulty: 'Easy' },
            { word: 'Artificial Intelligence', hint: 'Simulation of human intelligence in machines', difficulty: 'Medium' },
            { word: 'Blockchain', hint: 'A digital ledger of transactions, often used for crypto', difficulty: 'Hard' },
            { word: 'Virtual Reality', hint: 'A simulated experience that can be similar to or completely different from the real world', difficulty: 'Medium' },
          ]
        }
      ];

      for (const data of seedData) {
        const category = await Category.create({
          name: data.category,
          icon: data.icon,
        });

        const wordsToInsert = data.words.map(w => ({
          ...w,
          categoryId: category._id,
        }));

        await Word.insertMany(wordsToInsert);
        console.log(`- Auto-seeded category: ${category.name} with ${wordsToInsert.length} words`);
      }
      console.log('Auto-seeding complete! 🌱');
    }
  } catch (error) {
    console.error('Error auto-seeding:', error);
  }
}

// ─── Connect to MongoDB & Start Server ────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log(' MongoDB connected:', process.env.MONGO_URI);
    await autoSeed();
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
