import mongoose from 'mongoose';

const botSettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: 'main'
    },
    forcedChannels: {
      type: [String],
      default: []
    },
    subscriptionRequired: {
      type: Boolean,
      default: false
    },
    maintenanceMode: {
      type: Boolean,
      default: false
    },
    maintenanceMessage: {
      type: String,
      default: 'Botda texnik ishlar olib borilmoqda. Iltimos, keyinroq urinib ko‘ring.'
    }
  },
  {
    timestamps: true
  }
);

const BotSettings = mongoose.model('BotSettings', botSettingsSchema);
export default BotSettings;

