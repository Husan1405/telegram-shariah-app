/**
 * Minimal Telegram bot launcher for the Mini App.
 *
 *  Usage:
 *    1. Host the built `dist/` folder somewhere over HTTPS
 *       (Vercel / Netlify / GitHub Pages / your own server).
 *    2. Put your bot token and the public WebApp URL into `.env`.
 *    3. Run `npm run bot`.
 *
 * The bot just replies to /start with a button that opens the WebApp.
 * It uses long polling so there's nothing to deploy server-side beyond
 * keeping this process alive (or wire it up as a webhook in production).
 */

import process from 'node:process';
import { readFileSync } from 'node:fs';
import { URL } from 'node:url';

// Tiny .env loader — avoids pulling a dependency for this single use.
try {
  const envPath = new URL('../.env', import.meta.url);
  const raw = readFileSync(envPath, 'utf8');
  for (const line of raw.split('\n')) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
} catch {
  /* .env is optional */
}

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEB_APP_URL = process.env.WEB_APP_URL;

if (!TOKEN || TOKEN === 'replace_me') {
  console.error('TELEGRAM_BOT_TOKEN is not set in .env');
  process.exit(1);
}
if (!WEB_APP_URL || WEB_APP_URL === 'https://example.com') {
  console.error('WEB_APP_URL is not set in .env — must be a public HTTPS URL of your Mini App');
  process.exit(1);
}

const API = `https://api.telegram.org/bot${TOKEN}`;

async function call(method, payload) {
  const res = await fetch(`${API}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

const KEYBOARD = {
  inline_keyboard: [
    [{ text: '📿 Открыть приложение', web_app: { url: WEB_APP_URL } }],
  ],
};

const WELCOME =
  '*Ассаламу алейкум!*\n\n' +
  'Это премиум-приложение для расчётов по нормам шариата:\n' +
  '• Закят (2.5% при достижении нисаба)\n' +
  '• Распределение наследства (мираc)\n\n' +
  'Нажмите кнопку ниже, чтобы открыть мини-приложение.';

async function handleUpdate(update) {
  const msg = update.message;
  if (!msg) return;
  const chatId = msg.chat.id;
  const text = msg.text || '';
  if (text.startsWith('/start') || text.startsWith('/help')) {
    await call('sendMessage', {
      chat_id: chatId,
      text: WELCOME,
      parse_mode: 'Markdown',
      reply_markup: KEYBOARD,
    });
  }
}

async function main() {
  // Set the persistent menu button to open the WebApp directly.
  await call('setChatMenuButton', {
    menu_button: { type: 'web_app', text: 'Открыть', web_app: { url: WEB_APP_URL } },
  });

  console.log(`Bot started. Polling ${API}…`);
  let offset = 0;
  // Long polling loop
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const res = await fetch(`${API}/getUpdates?timeout=30&offset=${offset}`);
      const json = await res.json();
      if (json.ok && json.result?.length) {
        for (const upd of json.result) {
          offset = upd.update_id + 1;
          handleUpdate(upd).catch((e) => console.error('handleUpdate', e));
        }
      }
    } catch (e) {
      console.error('poll error', e);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

main();
