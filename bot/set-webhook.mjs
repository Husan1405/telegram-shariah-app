/**
 * One-time setup script.
 *
 *   node bot/set-webhook.mjs
 *
 * Reads TELEGRAM_BOT_TOKEN + WEB_APP_URL (+ optional TELEGRAM_WEBHOOK_SECRET)
 * from .env, then:
 *   1. Registers the Netlify Function URL as the Telegram webhook.
 *   2. Sets the persistent chat menu button to open the Mini App.
 *
 * Run this every time you change the bot token, the deployed URL, or the
 * webhook secret. Otherwise once is enough — Telegram remembers the webhook.
 */

import { readFileSync } from 'node:fs';
import { URL } from 'node:url';
import process from 'node:process';

// ---- tiny .env loader ----
try {
  const raw = readFileSync(new URL('../.env', import.meta.url), 'utf8');
  for (const line of raw.split('\n')) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
} catch {
  /* .env is optional */
}

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEB_APP_URL = process.env.WEB_APP_URL;
// The webhook can live on a different host than the Mini App (e.g. frontend
// on GitHub Pages, webhook on Render). If WEBHOOK_BASE_URL isn't set, we
// fall back to WEB_APP_URL — useful when both are on the same domain.
const WEBHOOK_BASE_URL = process.env.WEBHOOK_BASE_URL || WEB_APP_URL;
const SECRET = process.env.TELEGRAM_WEBHOOK_SECRET || '';

if (!TOKEN || TOKEN === 'replace_me') {
  console.error('Missing TELEGRAM_BOT_TOKEN in .env');
  process.exit(1);
}
if (!WEB_APP_URL || WEB_APP_URL === 'https://example.com') {
  console.error('Missing WEB_APP_URL in .env');
  process.exit(1);
}

const API = `https://api.telegram.org/bot${TOKEN}`;

const webhookUrl = new URL('/tg/webhook', WEBHOOK_BASE_URL).toString();

async function call(method, payload) {
  const res = await fetch(`${API}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!json.ok) {
    console.error(`${method} failed:`, json);
    process.exit(1);
  }
  return json.result;
}

console.log(`→ Registering webhook: ${webhookUrl}`);
await call('setWebhook', {
  url: webhookUrl,
  secret_token: SECRET || undefined,
  drop_pending_updates: true,
  allowed_updates: ['message'],
});
console.log('✓ Webhook set');

console.log('→ Setting persistent chat menu button…');
await call('setChatMenuButton', {
  menu_button: { type: 'web_app', text: 'Открыть', web_app: { url: WEB_APP_URL } },
});
console.log('✓ Menu button set');

const info = await call('getWebhookInfo', {});
console.log('\nWebhook info:');
console.log(`  url             : ${info.url}`);
console.log(`  pending_updates : ${info.pending_update_count}`);
console.log(`  last_error      : ${info.last_error_message || '—'}`);
console.log('\nDone. Send /start to the bot to test.');
