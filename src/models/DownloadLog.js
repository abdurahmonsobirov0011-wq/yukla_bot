import mongoose from 'mongoose';

const downloadLogSchema = new mongoose.Schema(
  {
    telegramId: {
      type: Number,
      required: true,
      index: true
    },
    platform: {
      type: String,
      required: true,
      enum: ['youtube', 'instagram', 'tiktok', 'facebook', 'pinterest', 'snapchat', 'unknown'],
      index: true
    },
    url: {
      type: String,
      required: true
    },
    mediaType: {
      type: String,
      default: 'video' // 'video', 'audio', 'image'
    },
    fileSize: {
      type: Number,
      default: 0 // In bytes
    },
    status: {
      type: String,
      enum: ['success', 'failed'],
      default: 'success'
    },
    errorMessage: {
      type: String,
      default: ''
    },
    processingTimeMs: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

const DownloadLog = mongoose.model('DownloadLog', downloadLogSchema);
export default DownloadLog;
