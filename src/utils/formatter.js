/**
 * Utility function to format byte sizes to human-readable strings.
 */
export function formatBytes(bytes, decimals = 2) {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Format duration in seconds to MM:SS or HH:MM:SS format
 */
export function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return '00:00';
  const secNum = parseInt(seconds, 10);
  const hours = Math.floor(secNum / 3600);
  const minutes = Math.floor((secNum - hours * 3600) / 60);
  const secs = secNum - hours * 3600 - minutes * 60;

  const hStr = hours > 0 ? (hours < 10 ? '0' + hours : hours) + ':' : '';
  const mStr = minutes < 10 ? '0' + minutes : minutes;
  const sStr = secs < 10 ? '0' + secs : secs;
  return `${hStr}${mStr}:${sStr}`;
}

/**
 * Escape special MarkdownV2 characters for Telegram bot strings
 */
export function escapeMarkdown(text) {
  if (!text) return '';
  return String(text).replace(/[_*[\]()~`>#+-=|{}.!]/g, '\\$&');
}

/**
 * Generate random string for unique referral codes
 */
export function generateRandomString(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
