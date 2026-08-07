import fs from 'fs';
import path from 'path';
import logger from '../config/logger.js';

const DATA_DIR = path.resolve('./data');
const DB_FILE = path.join(DATA_DIR, 'local_db.json');

let store = {
  users: {},
  blacklists: [],
  stats: {
    totalDownloads: 0,
    downloadsToday: 0
  }
};

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadStore() {
  ensureDir();
  if (fs.existsSync(DB_FILE)) {
    try {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      store = { ...store, ...JSON.parse(data) };
    } catch (err) {
      logger.error(`Failed to load local store: ${err.message}`);
    }
  }
}

function saveStore() {
  ensureDir();
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(store, null, 2), 'utf8');
  } catch (err) {
    logger.error(`Failed to save local store: ${err.message}`);
  }
}

loadStore();

export const localStore = {
  getUser(telegramId) {
    return store.users[telegramId] || null;
  },

  saveUser(telegramId, userData) {
    store.users[telegramId] = {
      telegramId,
      ...userData,
      lastActive: new Date()
    };
    saveStore();
    return store.users[telegramId];
  },

  isBlacklisted(telegramId) {
    return store.blacklists.includes(Number(telegramId));
  },

  addBlacklist(telegramId) {
    if (!store.blacklists.includes(Number(telegramId))) {
      store.blacklists.push(Number(telegramId));
      saveStore();
    }
  },

  removeBlacklist(telegramId) {
    store.blacklists = store.blacklists.filter(id => id !== Number(telegramId));
    saveStore();
  },

  incrementDownloads() {
    store.stats.totalDownloads = (store.stats.totalDownloads || 0) + 1;
    store.stats.downloadsToday = (store.stats.downloadsToday || 0) + 1;
    saveStore();
  }
};

export default localStore;
