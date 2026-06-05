const mongoose = require('mongoose');

const WordSchema = new mongoose.Schema({
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  word: {
    type: String,
    required: true,
    trim: true,
  },
  hint: {
    type: String,
    required: true,
    trim: true,
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Medium',
  },
}, { timestamps: true });

// Prevent duplicate words in the same category
WordSchema.index({ categoryId: 1, word: 1 }, { unique: true });

module.exports = mongoose.model('Word', WordSchema);
