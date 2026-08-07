import mongoose from 'mongoose';

const favoriteSchema = new mongoose.Schema(
  {
    telegramId: {
      type: Number,
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    mediaType: {
      type: String,
      enum: ['video', 'audio', 'image'],
      default: 'video'
    },
    fileId: {
      type: String,
      default: ''
    },
    platform: {
      type: String,
      default: 'unknown'
    }
  },
  {
    timestamps: true
  }
);

favoriteSchema.index({ telegramId: 1, url: 1 }, { unique: true });

const Favorite = mongoose.model('Favorite', favoriteSchema);
export default Favorite;
