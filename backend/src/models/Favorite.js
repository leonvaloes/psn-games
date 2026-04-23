import mongoose from 'mongoose';

const favoriteSchema = new mongoose.Schema({
  userId:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  slug:            { type: String, required: true },
  name:            { type: String, required: true },
  backgroundImage: { type: String, default: null },
  metacritic:      { type: Number, default: null },
  released:        { type: String, default: null }
}, { timestamps: true });

favoriteSchema.index({ userId: 1, slug: 1 }, { unique: true });

export default mongoose.model('Favorite', favoriteSchema);
