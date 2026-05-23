import { useEffect, useState, useCallback } from 'react';

/**
 * Telegram WebApp typings — kept minimal & local to avoid a global d.ts.
 */
type HapticStyle = 'light' | 'medium' | 'heavy' | 'rigid' | 'soft';
type HapticNotification = 'error' | 'success' | 'warning';

interface TgThemeParams {
  bg_color?: string;
  secondary_bg_color?: string;
  text_color?: string;
  hint_color?: string;
  link_color?: string;
  button_color?: string;
  button_text_color?: string;
}

interface TelegramWebApp {
  ready: () => void;
  expand: () => void;
  close: () => void;
  enableClosingConfirmation?: () => void;
  setHeaderColor?: (c: string) => void;
  setBackgroundColor?: (c: string) => void;
  colorScheme: 'light' | 'dark';
  themeParams: TgThemeParams;
  onEvent: (ev: string, cb: () => void) => void;
  offEvent: (ev: string, cb: () => void) => void;
  HapticFeedback?: {
    impactOccurred: (style: HapticStyle) => void;
    notificationOccurred: (type: HapticNotification) => void;
    selectionChanged: () => void;
  };
  BackButton?: {
    show: () => void;
    hide: () => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
  };
  MainButton?: {
    setText: (t: string) => void;
    show: () => void;
    hide: () => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
  };
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
  }
}

/**
 * Push the Telegram color scheme into our CSS variables so Tailwind classes
 * like `text-tg-text` / `bg-tg-bg` automatically follow the user's theme.
 */
/**
 * The app is locked to a black theme by design. We ignore the user's Telegram
 * color scheme and always paint a true-black backdrop with our brand palette.
 */
function applyThemeToCSS(_theme: TgThemeParams, _scheme: 'light' | 'dark') {
  const root = document.documentElement;
  const palette = {
    bg: '#000000',
    bg2: '#0a0a0d',
    text: '#ffffff',
    hint: '#8a8f9b',
    link: '#34d399',
    button: '#10b981',
    buttonText: '#ffffff',
  };

  root.style.setProperty('--tg-bg', palette.bg);
  root.style.setProperty('--tg-bg-secondary', palette.bg2);
  root.style.setProperty('--tg-text', palette.text);
  root.style.setProperty('--tg-hint', palette.hint);
  root.style.setProperty('--tg-link', palette.link);
  root.style.setProperty('--tg-button', palette.button);
  root.style.setProperty('--tg-button-text', palette.buttonText);

  root.classList.add('dark');
}

/**
 * useTelegram — wraps Telegram.WebApp with safe fallbacks for browser preview.
 */
export function useTelegram() {
  const [scheme, setScheme] = useState<'light' | 'dark'>('dark');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) {
      // Plain browser preview — apply dark theme defaults.
      applyThemeToCSS({}, 'dark');
      setIsReady(true);
      return;
    }

    tg.ready();
    tg.expand();
    tg.enableClosingConfirmation?.();

    const sync = () => {
      // App is locked to black — ignore Telegram's actual color scheme.
      setScheme('dark');
      applyThemeToCSS({}, 'dark');
      tg.setHeaderColor?.('#000000');
      tg.setBackgroundColor?.('#000000');
    };

    sync();
    tg.onEvent('themeChanged', sync);
    setIsReady(true);

    return () => {
      tg.offEvent('themeChanged', sync);
    };
  }, []);

  const haptic = useCallback((style: HapticStyle = 'light') => {
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred(style);
  }, []);

  const notify = useCallback((kind: HapticNotification = 'success') => {
    window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred(kind);
  }, []);

  const selectionChanged = useCallback(() => {
    window.Telegram?.WebApp?.HapticFeedback?.selectionChanged();
  }, []);

  return { scheme, isReady, haptic, notify, selectionChanged };
}
