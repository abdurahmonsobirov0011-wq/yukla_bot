import { isDbConnected } from '../../config/database.js';
import localStore from '../../utils/localStore.js';
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

  // Fallback / Local Store check
  if (!isDbConnected()) {
    let localUser = localStore.getUser(telegramId);
    if (!localUser) {
      localUser = localStore.saveUser(telegramId, {
        username: username || '',
        firstName: firstName || '',
        lastName: lastName || '',
        languageCode: languageCode || 'uz',
        isPremium: false,
        isBanned: false,
        referralCode: generateRandomString(8)
      });
    } else {
      localUser.username = username || localUser.username;
      localUser.firstName = firstName || localUser.firstName;
      localUser.lastName = lastName || localUser.lastName;
      localStore.saveUser(telegramId, localUser);
    }
    ctx.state.user = localUser;
    return next();
  }

  // Mongoose DB Path
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

