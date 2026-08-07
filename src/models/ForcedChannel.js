import mongoose from 'mongoose';

const forcedChannelSchema = new mongoose.Schema({
  channelId: { type: String, required: true, unique: true },
  channelTitle: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  addedAt: { type: Date, default: Date.now }
});

const ForcedChannel = mongoose.model('ForcedChannel', forcedChannelSchema);

export default ForcedChannel;
