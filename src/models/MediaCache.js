import mongoose from 'mongoose';

const mediaCacheSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    platform: {
      type: String,
      required: true
    },
    mediaType: {
      type: String,
      required: true // 'video', 'audio', 'image'
    },
    fileId: {
      type: String,
      required: true
    },
    title: {
      type: String,
      default: ''
    },
    expireAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Auto-expire after 7 days
      expires: 0 // MongoDB TTL index
    }
  },
  {
    timestamps: true
  }
);

const MediaCache = mongoose.model('MediaCache', mediaCacheSchema);
export default MediaCache;
