const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  icon: {
    type: String, // e.g., 'TreePine', 'Utensils', 'Dumbbell' (Lucide icon names)
    default: 'HelpCircle',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Category', CategorySchema);
