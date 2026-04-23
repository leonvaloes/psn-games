import mongoose from 'mongoose';

const userAchievementSchema = new mongoose.Schema({
  userId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  gameSlug:      { type: String, required: true },
  achievementId: { type: Number, required: true },
  completedAt:   { type: Date, default: Date.now }
});

userAchievementSchema.index({ userId: 1, gameSlug: 1, achievementId: 1 }, { unique: true });

export default mongoose.model('UserAchievement', userAchievementSchema);
