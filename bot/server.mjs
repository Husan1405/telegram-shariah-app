/**
 * Webhook server for the Telegram bot — designed for Render / Railway / Fly.
 *
 * Listens on $PORT (or 3000 locally). Telegram POSTs updates to /tg/webhook.
 * We respond 200 OK immediately so Telegram doesn't retry, and fire-and-forget
 * any outbound messages via the Bot API.
 *
 * Env vars (Render dashboard → Environment):
 *   TELEGRAM_BOT_TOKEN      — required, from @BotFather
 *   WEB_APP_URL             — required, public HTTPS URL of the Mini App
 *   TELEGRAM_WEBHOOK_SECRET — recommended, shared secret to verify the request
 *                             actually comes from Telegram (configured via
 *                             setWebhook → secret_token).
 *   PORT                    — auto-injected by Render; defaults to 3000 locally
 */

import { createServer } from 'node:http';
import process from 'node:process';
import { readFileSync } from 'node:fs';
import { URL } from 'node:url';

// Local .env loader — silently skipped in production (no .env file on Render).
try {
  const raw = readFileSync(new URL('../.env', import.meta.url), 'utf8');
  for (const line of raw.split('\n')) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
} catch {
  /* no .env — that's fine in production */
}

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEB_APP_URL = process.env.WEB_APP_URL;
const SECRET = process.env.TELEGRAM_WEBHOOK_SECRET || '';
const PORT = parseInt(process.env.PORT || '3000', 10);

if (!TOKEN || TOKEN === 'replace_me') {
  console.error('TELEGRAM_BOT_TOKEN is missing');
  process.exit(1);
}
if (!WEB_APP_URL || WEB_APP_URL === 'https://example.com') {
  console.error('WEB_APP_URL is missing');
  process.exit(1);
}

const API = `https://api.telegram.org/bot${TOKEN}`;

const WELCOME =
  '*Ассаламу алейкум!*\n\n' +
  'Это премиум-приложение для расчётов по нормам шариата:\n' +
  '• Закят (2.5% при достижении нисаба)\n' +
  '• Распределение наследства (мираc)\n\n' +
  'Нажмите кнопку ниже, чтобы открыть мини-приложение.';

const KEYBOARD = {
  inline_keyboard: [[{ text: '📿 Открыть приложение', web_app: { url: WEB_APP_URL } }]],
};

async function callTg(method, payload) {
  try {
    const res = await fetch(`${API}/${method}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const txt = await res.text();
      console.error(`Telegram ${method} ${res.status}: ${txt}`);
    }
  } catch (e) {
    console.error(`Telegram ${method} error:`, e);
  }
}

async function handleUpdate(update) {
  const msg = update.message;
  if (msg && typeof msg.text === 'string') {
    const text = msg.text.trim();
    if (text.startsWith('/start') || text.startsWith('/help')) {
      await callTg('sendMessage', {
        chat_id: msg.chat.id,
        text: WELCOME,
        parse_mode: 'Markdown',
        reply_markup: KEYBOARD,
      });
    }
  }
}

// ----------------- HTTP server -----------------

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      // 1 MB safety limit — Telegram updates are tiny anyway.
      if (body.length > 1_000_000) {
        reject(new Error('Body too large'));
        req.destroy();
      }
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

const server = createServer(async (req, res) => {
  // Health check — Render pings the root URL to verify the service is alive.
  if (req.method === 'GET' && (req.url === '/' || req.url === '/health')) {
    res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Shariah bot is alive');
    return;
  }

  if (req.method === 'POST' && req.url === '/tg/webhook') {
    if (SECRET) {
      const got = req.headers['x-telegram-bot-api-secret-token'];
      if (got !== SECRET) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }
    }

    try {
      const body = await readBody(req);
      const update = JSON.parse(body);
      // Respond first, process after — Telegram only cares about the status code.
      res.writeHead(200, { 'content-type': 'text/plain' });
      res.end('ok');
      handleUpdate(update).catch((e) => console.error('handleUpdate', e));
    } catch (e) {
      console.error('webhook parse error', e);
      if (!res.headersSent) {
        res.writeHead(400);
        res.end('bad request');
      }
    }
    return;
  }

  res.writeHead(404);
  res.end('not found');
});

server.listen(PORT, () => {
  console.log(`✓ Webhook server listening on :${PORT}`);
  console.log(`  POST /tg/webhook  →  handles Telegram updates`);
  console.log(`  GET  /            →  health check`);
});

// Graceful shutdown — Render sends SIGTERM on redeploy.
function shutdown() {
  console.log('SIGTERM received, closing server…');
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
