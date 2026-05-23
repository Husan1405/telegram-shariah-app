import { useEffect } from 'react';

/**
 * Shows the Telegram BackButton while a callback is active. Hides on unmount.
 * If Telegram is not available, the hook is a no-op.
 */
export function useBackButton(active: boolean, onClick: () => void) {
  useEffect(() => {
    const bb = window.Telegram?.WebApp?.BackButton;
    if (!bb) return;
    if (!active) {
      bb.hide();
      return;
    }
    bb.show();
    bb.onClick(onClick);
    return () => {
      bb.offClick(onClick);
      bb.hide();
    };
  }, [active, onClick]);
}
