/**
 * Detect social media platform from input URL string
 */
export function detectPlatform(url) {
  if (!url || typeof url !== 'string') return null;

  const cleanUrl = url.trim();

  // YouTube / Shorts Regex
  if (/(?:youtube\.com\/(?:watch|shorts|v|embed)|youtu\.be\/)/i.test(cleanUrl)) {
    return 'youtube';
  }

  // Instagram Reels / Posts / Stories Regex
  if (/(?:instagram\.com\/(?:p|reel|reels|stories|tv)\/)/i.test(cleanUrl)) {
    return 'instagram';
  }

  // TikTok Regex
  if (/(?:tiktok\.com\/|vt\.tiktok\.com\/|vm\.tiktok\.com\/)/i.test(cleanUrl)) {
    return 'tiktok';
  }

  // Facebook Regex
  if (/(?:facebook\.com|fb\.watch|fb\.com)\/(?:watch|reel|reels|videos|share|[^\/]+\/videos)/i.test(cleanUrl)) {
    return 'facebook';
  }

  // Pinterest Regex
  if (/(?:pinterest\.com|pin\.it)/i.test(cleanUrl)) {
    return 'pinterest';
  }

  // Snapchat Regex
  if (/(?:snapchat\.com|story\.snapchat\.com)/i.test(cleanUrl)) {
    return 'snapchat';
  }

  return null;
}

/**
 * Extracts first valid URL from a text message
 */
export function extractUrlFromText(text) {
  if (!text) return null;
  const match = text.match(/https?:\/\/[^\s]+/i);
  return match ? match[0] : null;
}
