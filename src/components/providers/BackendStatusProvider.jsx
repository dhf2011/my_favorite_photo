'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { pingHealth, waitForBackend } from '@/lib/http/health';

const BackendStatusContext = createContext({
  status: 'checking',
  isReady: false,
  isWaiting: true,
  isWaking: false,
  retry: () => {},
});

export function BackendStatusProvider({ children }) {
  const [status, setStatus] = useState('checking');

  const runCheck = useCallback(async () => {
    const ok = await waitForBackend({ onStatus: setStatus });
    if (ok) return;

    const retry = async () => {
      setStatus('waking');
      const woke = await pingHealth({ timeoutMs: 10000 });
      if (woke) {
        setStatus('ready');
        return;
      }
      setTimeout(retry, 5000);
    };
    setTimeout(retry, 5000);
  }, []);

  useEffect(() => {
    runCheck();
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
