import mongoose from 'mongoose';

const blacklistSchema = new mongoose.Schema(
  {
    telegramId: {
      type: Number,
      required: true,
      unique: true,
      index: true
    },
    reason: {
      type: String,
      default: 'Violation of Terms of Service'
    },
    bannedBy: {
      type: Number,
      default: null
    }
  },
  {
    timestamps: true
  }
);

const Blacklist = mongoose.model('Blacklist', blacklistSchema);
export default Blacklist;
