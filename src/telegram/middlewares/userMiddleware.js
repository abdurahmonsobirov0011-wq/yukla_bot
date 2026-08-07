import mongoose from 'mongoose';
import User from '../../models/User.js';
import { generateRandomString } from '../../utils/formatter.js';
import logger from '../../config/logger.js';

// In-Memory store of active user IDs for broadcast fallback
export const activeUsersMemorySet = new Set();

export async function userMiddleware(ctx, next) {
  if (!ctx.from) return next();

  const { id: telegramId, username, first_name: firstName, last_name: lastName, language_code: languageCode } = ctx.from;

  // Track active user ID
  activeUsersMemorySet.add(telegramId);

  // Set default transient user state in case DB is disconnected or fails
  ctx.state.user = {
    telegramId,
    username: username || '',
    firstName: firstName || '',
    lastName: lastName || '',
    isPremium: false,
    isBanned: false,
    referralCode: generateRandomString(8)
  };

  // Skip DB query if Mongoose is not in connected state
  if (mongoose.connection.readyState !== 1) {
    return next();
  }

  try {
    let user = await User.findOne({ telegramId });

    if (!user) {
      let referredBy = null;
      if (ctx.message && ctx.message.text && ctx.message.text.startsWith('/start ref_')) {
        const refCode = ctx.message.text.split('ref_')[1]?.trim();
        if (refCode) {
          const referrer = await User.findOne({ referralCode: refCode });
          if (referrer && referrer.telegramId !== telegramId) {
            referredBy = referrer.telegramId;
            await User.findOneAndUpdate(
              { telegramId: referrer.telegramId },
              { $inc: { referralCount: 1 } }
            );
          }
        }
      }

      let uniqueRefCode = generateRandomString(8);
      while (await User.exists({ referralCode: uniqueRefCode })) {
        uniqueRefCode = generateRandomString(8);
      }

      user = await User.create({
        telegramId,
        username: username || '',
        firstName: firstName || '',
        lastName: lastName || '',
        languageCode: languageCode || 'en',
        referralCode: uniqueRefCode,
        referredBy
      });
    } else {
      user.username = username || user.username;
      user.firstName = firstName || user.firstName;
      user.lastName = lastName || user.lastName;
      user.lastActive = new Date();
      await user.save();
    }

    ctx.state.user = user;
  } catch (error) {
    logger.error(`User Middleware DB operation failed: ${error.message}`);
  }

  return next();
}
