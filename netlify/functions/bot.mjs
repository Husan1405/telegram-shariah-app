/**
 * Telegram webhook endpoint — runs on Netlify Functions.
 *
 * Telegram POSTs every update (message, callback, etc.) to this URL.
 * We respond with 200 quickly so Telegram doesn't retry, and send any
 * outgoing message via the Bot API in the background.
 *
 * Required env vars (set in Netlify dashboard → Site settings → Environment):
 *   TELEGRAM_BOT_TOKEN   — from @BotFather
 *   WEB_APP_URL          — public HTTPS URL of the Mini App
 *   TELEGRAM_WEBHOOK_SECRET — optional, but recommended. If set, requests
 *                             without matching X-Telegram-Bot-Api-Secret-Token
 *                             are rejected.
 */

const WELCOME =
  '*Ассаламу алейкум!*\n\n' +
  'Это премиум-приложение для расчётов по нормам шариата:\n' +
  '• Закят (2.5% при достижении нисаба)\n' +
  '• Распределение наследства (мираc)\n\n' +
  'Нажмите кнопку ниже, чтобы открыть мини-приложение.';

function makeKeyboard(webAppUrl) {
  return {
    inline_keyboard: [[{ text: '📿 Открыть приложение', web_app: { url: webAppUrl } }]],
  };
}

async function callTg(token, method, payload) {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const txt = await res.text();
    console.error(`Telegram ${method} failed: ${res.status} ${txt}`);
  }
  return res;
}

export default async (req) => {
  const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const WEB_APP_URL = process.env.WEB_APP_URL;
  const SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;

  if (!TOKEN || !WEB_APP_URL) {
    return new Response('Server misconfigured: TELEGRAM_BOT_TOKEN or WEB_APP_URL missing', {
      status: 500,
    });
  }

  // Telegram always uses POST. Reject other methods so the URL is hard to probe.
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  // Optional secret-token verification — protects the webhook from being abused
  // by anyone who knows the URL.
  if (SECRET) {
    const got = req.headers.get('x-telegram-bot-api-secret-token');
    if (got !== SECRET) {
      return new Response('Forbidden', { status: 403 });
    }
  }

  let update;
  try {
    update = await req.json();
  } catch {
    return new Response('Bad Request', { status: 400 });
  }

  try {
    const msg = update.message;
    if (msg && typeof msg.text === 'string') {
      const text = msg.text.trim();
      if (text.startsWith('/start') || text.startsWith('/help')) {
        await callTg(TOKEN, 'sendMessage', {
          chat_id: msg.chat.id,
          text: WELCOME,
          parse_mode: 'Markdown',
          reply_markup: makeKeyboard(WEB_APP_URL),
        });
      }
    }
  } catch (e) {
    console.error('handler error', e);
  }

  // Always 200 — even if processing failed, we don't want Telegram to retry.
  return new Response('ok', { status: 200 });
};

export const config = {
  // Pretty URL — webhook will be https://<your-site>/tg/webhook
  path: '/tg/webhook',
};
