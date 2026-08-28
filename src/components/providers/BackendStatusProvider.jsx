'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { pingHealth } from '@/lib/http/health';

const POLL_MS = 30_000;

const BackendStatusContext = createContext({
  status: 'checking',
  isReady: false,
  isWaiting: true,
  isWaking: false,
  retry: () => {},
});

export function BackendStatusProvider({ children }) {
  const [status, setStatus] = useState('checking');
  const wasDownRef = useRef(false);
  const timerRef = useRef(null);

  const runCheck = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const ok = await pingHealth({ timeoutMs: 10000 });

    if (ok) {
      if (wasDownRef.current) {
        window.location.reload();
        return;
      }
      setStatus('ready');
      return;
    }

    wasDownRef.current = true;
    setStatus('waking');
    timerRef.current = setTimeout(runCheck, POLL_MS);
  }, []);

  useEffect(() => {
    runCheck();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [runCheck]);

  const value = useMemo(
    () => ({
      status,
      isReady: status === 'ready',
      isWaiting: status !== 'ready',
      isWaking: status === 'waking' || status === 'unavailable',
      retry: runCheck,
    }),
    [status, runCheck],
  );

  return <BackendStatusContext.Provider value={value}>{children}</BackendStatusContext.Provider>;
}

export function useBackendStatus() {
  return useContext(BackendStatusContext);
}
