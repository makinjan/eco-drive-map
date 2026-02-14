import { useEffect, useRef } from 'react';

export function useWakeLock(enabled: boolean) {
  const wakeLock = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (!enabled) {
      wakeLock.current?.release().catch(() => {});
      wakeLock.current = null;
      return;
    }

    const request = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock.current = await navigator.wakeLock.request('screen');
        }
      } catch (e) {
        console.warn('Wake Lock failed:', e);
      }
    };

    request();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && enabled) request();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      wakeLock.current?.release().catch(() => {});
      wakeLock.current = null;
    };
  }, [enabled]);
}
