import test from 'node:test';
import assert from 'node:assert/strict';
import { detectPlatform, extractUrlFromText } from '../../src/utils/urlDetector.js';

test('detectPlatform - Instagram Reels & Posts', () => {
  assert.equal(detectPlatform('https://www.instagram.com/reel/DZhSAL0SjpO/'), 'instagram');
  assert.equal(detectPlatform('https://instagram.com/p/C123456/'), 'instagram');
});

test('detectPlatform - YouTube Videos & Shorts', () => {
  assert.equal(detectPlatform('https://youtu.be/8cZkG1T1MBs'), 'youtube');
  assert.equal(detectPlatform('https://www.youtube.com/shorts/abcd123'), 'youtube');
});

test('detectPlatform - TikTok', () => {
  assert.equal(detectPlatform('https://vt.tiktok.com/ZS12345/'), 'tiktok');
});

test('extractUrlFromText', () => {
  const text = 'Check out this video: https://www.instagram.com/reel/DZhSAL0SjpO/ it is cool';
  assert.equal(extractUrlFromText(text), 'https://www.instagram.com/reel/DZhSAL0SjpO/');
});
