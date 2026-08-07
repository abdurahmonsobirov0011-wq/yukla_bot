import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    telegramId: {
      type: Number,
      required: true,
      unique: true,
      index: true
    },
    username: {
      type: String,
      default: ''
    },
    firstName: {
      type: String,
      default: ''
    },
    lastName: {
      type: String,
      default: ''
    },
    languageCode: {
      type: String,
      default: 'uz' // 'uz', 'en', 'ru'
    },
    country: {
      type: String,
      default: 'UZ'
    },
    isPremium: {
      type: Boolean,
      default: false
    },
    premiumExpireAt: {
      type: Date,
      default: null
    },
    downloadCount: {
      type: Number,
      default: 0
    },
    recognizedSongsCount: {
      type: Number,
      default: 0
    },
    storageUsedBytes: {
      type: Number,
      default: 0
    },
    referralCode: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    referredBy: {
      type: Number,
      default: null
    },
    referralCount: {
      type: Number,
      default: 0
    },
    isBanned: {
      type: Boolean,
      default: false
    },
    banReason: {
      type: String,
      default: ''
    },
    lastActive: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

userSchema.virtual('fullName').get(function () {
  return `${this.firstName || ''} ${this.lastName || ''}`.trim() || this.username || 'Anonymous User';
});

const User = mongoose.model('User', userSchema);
export default User;
