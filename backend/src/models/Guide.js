import mongoose from 'mongoose';

const guideSchema = new mongoose.Schema({
  gameSlug:   { type: String, required: true, index: true },
  title:      { type: String, required: true, trim: true, maxlength: 200 },
  content:    { type: String, required: true, maxlength: 50000 },
  authorId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  authorName: { type: String, required: true },
  upvotes:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  downvotes:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

guideSchema.virtual('score').get(function () {
  return this.upvotes.length - this.downvotes.length;
});

guideSchema.methods.toPublic = function (requestUserId) {
  const userId = requestUserId?.toString();
  return {
    _id:        this._id,
    gameSlug:   this.gameSlug,
    title:      this.title,
    content:    this.content,
    authorId:   this.authorId,
    authorName: this.authorName,
    upvotes:    this.upvotes.length,
    downvotes:  this.downvotes.length,
    score:      this.upvotes.length - this.downvotes.length,
    userVote:   userId
      ? this.upvotes.map(String).includes(userId) ? 1
      : this.downvotes.map(String).includes(userId) ? -1
      : 0
      : 0,
    isAuthor:   userId ? this.authorId.toString() === userId : false,
    createdAt:  this.createdAt,
    updatedAt:  this.updatedAt
  };
};

export default mongoose.model('Guide', guideSchema);
