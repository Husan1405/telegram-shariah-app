# Shariah Finance · Telegram Mini App

Премиальный Telegram Mini App с двумя инструментами:

- **Калькулятор закята** — расчёт 2.5% от чистых активов с учётом нисаба, поддержка USD / EUR / TRY / RUB / AED.
- **Калькулятор наследства (мираc)** — распределение долей по нормам шариата (фард + асаба) с предупреждениями для сложных случаев.

Стек: **React + TypeScript + Vite + TailwindCSS + Framer Motion + lucide-react** + Telegram WebApp SDK.

## Быстрый старт

```bash
npm install
npm run dev   # http://localhost:5173 — для preview в обычном браузере
npm run build # production-сборка в dist/
```

> ⚠️ Бот-токен, который вы получили от @BotFather, **никогда не должен попадать в репозиторий**.
> Если он уже был опубликован в чате — обязательно отзовите его в @BotFather командой `/revoke` и сгенерируйте новый.

## Деплой Mini App

1. Соберите фронтенд: `npm run build` → получите папку `dist/`.
2. Опубликуйте её по HTTPS (Vercel, Netlify, GitHub Pages, свой сервер — на выбор).
3. Сохраните публичный URL в переменную `WEB_APP_URL`.

## Запуск бота

```bash
cp .env.example .env
# заполните TELEGRAM_BOT_TOKEN и WEB_APP_URL
npm run bot
```

Бот:
- На `/start` отправляет inline-кнопку, открывающую Mini App.
- Устанавливает постоянную кнопку меню чата, которая ведёт в Mini App.

## Структура проекта

```
src/
├── components/      # переиспользуемые UI-блоки (Card, Button, Input, …)
│   └── ui/
├── pages/           # экраны: Home, ZakatCalculator, InheritanceCalculator
├── hooks/           # useTelegram, useBackButton
├── services/        # currencyService (готов к подключению live-курсов)
├── utils/           # zakat.ts, inheritance.ts, format.ts
├── types/           # общие TS-типы
└── constants/
```

## Что внутри

- Telegram WebApp API: `expand`, тема, BackButton, HapticFeedback, MainButton-ready, safe-area insets.
- Светлая / тёмная тема — автоматическое отслеживание `themeChanged`.
- Glassmorphism, плавные анимации, page transitions, анимированные цифры и круговые диаграммы.
- Подключение реальных курсов валют — один файл (`src/services/currencyService.ts`), точка входа уже асинхронная.

## Disclaimer

Этот калькулятор — справочный инструмент. Для шариатских вопросов и сложных случаев распределения наследства всегда обращайтесь к квалифицированному учёному.
