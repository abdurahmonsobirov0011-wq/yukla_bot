import mongoose from 'mongoose';

const playlistSchema = new mongoose.Schema(
  {
    telegramId: {
      type: Number,
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true
    },
    description: {
      type: String,
      default: ''
    },
    items: [
      {
        title: String,
        url: String,
        fileId: String,
        mediaType: String,
        addedAt: { type: Date, default: Date.now }
      }
    ],
    isPublic: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

const Playlist = mongoose.model('Playlist', playlistSchema);
export default Playlist;
