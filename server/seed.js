require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('./models/Category');
const Word = require('./models/Word');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/imposter_app';

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

async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected.');

    // Clear existing data
    console.log('Clearing existing categories and words...');
    await Category.deleteMany({});
    await Word.deleteMany({});

    console.log('Seeding data...');
    for (const data of seedData) {
      // Create Category
      const category = await Category.create({
        name: data.category,
        icon: data.icon,
      });

      // Create Words for this Category
      const wordsToInsert = data.words.map(w => ({
        ...w,
        categoryId: category._id,
      }));

      await Word.insertMany(wordsToInsert);
      console.log(`- Seeded category: ${category.name} with ${wordsToInsert.length} words`);
    }

    console.log('Database seeded successfully! 🌱');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
