import mongoose from 'mongoose';

const gameSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true },
  detail: { type: Object },
  achievements: { type: Object },
  cachedAt: { type: Date, default: Date.now }
});

export default mongoose.model('Game', gameSchema);
