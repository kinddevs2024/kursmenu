const crypto = require('crypto');
const { put, list } = require('@vercel/blob');

const USER_PREFIX = 'users/telegram/';

function userPath(telegramId) {
  const idHash = crypto.createHash('sha256').update(String(telegramId)).digest('hex');
  return `${USER_PREFIX}${idHash}.json`;
}

async function getTelegramUser(telegramId) {
  const pathname = userPath(telegramId);
  const { blobs } = await list({ prefix: pathname, limit: 1 });
  if (!blobs.length) return null;

  const response = await fetch(`${blobs[0].url}?v=${Date.now()}`, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Telegram user fetch failed: ${response.status}`);
  }
  return response.json();
}

async function saveTelegramUser(telegramId, updates = {}) {
  const existing = await getTelegramUser(telegramId);
  const now = new Date().toISOString();
  const definedUpdates = Object.fromEntries(
    Object.entries(updates).filter(([, value]) => value !== undefined)
  );
  const user = {
    telegramId: String(telegramId),
    username: '',
    name: '',
    photoUrl: null,
    roles: [],
    isPremium: false,
    createdAt: existing?.createdAt || now,
    ...existing,
    ...definedUpdates,
    updatedAt: now
  };

  await put(userPath(telegramId), JSON.stringify(user), {
    access: 'public',
    contentType: 'application/json',
    allowOverwrite: true,
    cacheControlMaxAge: 60
  });

  return user;
}

module.exports = {
  getTelegramUser,
  saveTelegramUser,
  userPath
};
