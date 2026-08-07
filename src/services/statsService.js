import mongoose from 'mongoose';
import User from '../models/User.js';
import DownloadLog from '../models/DownloadLog.js';
import { getSystemMetrics } from '../utils/systemStats.js';

export async function getDashboardStats() {
  const systemMetrics = await getSystemMetrics();

  if (mongoose.connection.readyState !== 1) {
    return {
      totalUsers: 0,
      dailyActiveUsers: 0,
      downloadsToday: 0,
      downloadsThisMonth: 0,
      totalDownloads: 0,
      premiumUsersCount: 0,
      mostUsedPlatform: 'None',
      platformDistribution: {},
      system: systemMetrics
    };
  }

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalUsers,
    dailyActiveUsers,
    downloadsToday,
    downloadsThisMonth,
    totalDownloads,
    premiumUsersCount,
    platformStats
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ lastActive: { $gte: startOfToday } }),
    DownloadLog.countDocuments({ createdAt: { $gte: startOfToday }, status: 'success' }),
    DownloadLog.countDocuments({ createdAt: { $gte: startOfMonth }, status: 'success' }),
    DownloadLog.countDocuments({ status: 'success' }),
    User.countDocuments({ isPremium: true }),
    DownloadLog.aggregate([
      { $match: { status: 'success' } },
      { $group: { _id: '$platform', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ])
  ]);

  const mostUsedPlatform = platformStats.length > 0 ? platformStats[0]._id : 'None';

  return {
    totalUsers,
    dailyActiveUsers,
    downloadsToday,
    downloadsThisMonth,
    totalDownloads,
    premiumUsersCount,
    mostUsedPlatform,
    platformDistribution: platformStats.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {}),
    system: systemMetrics
  };
}

export async function getUserStats(telegramId) {
  if (mongoose.connection.readyState !== 1) {
    return {
      telegramId,
      fullName: 'User',
      username: '',
      isPremium: false,
      downloadCount: 0,
      referralCount: 0,
      referralCode: 'FREE',
      joinedAt: new Date()
    };
  }

  const user = await User.findOne({ telegramId });
  if (!user) return null;

  const userDownloads = await DownloadLog.countDocuments({ telegramId, status: 'success' });

  return {
    telegramId: user.telegramId,
    fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'User',
    username: user.username,
    isPremium: user.isPremium,
    downloadCount: userDownloads,
    referralCount: user.referralCount,
    referralCode: user.referralCode,
    joinedAt: user.createdAt
  };
}

export async function getReferralLeaderboard(limit = 10) {
  if (mongoose.connection.readyState !== 1) return [];
  return User.find()
    .sort({ referralCount: -1 })
    .limit(limit)
    .select('firstName lastName username referralCount isPremium');
}
