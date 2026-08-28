import { API_BASE } from '@/lib/http/baseUrl';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Render 무료 플랜 콜드 스타트용 /health 핑 */
export async function pingHealth({ timeoutMs = 8000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_BASE}/health`, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export async function waitForBackend({
  onStatus,
  wakingAfterMs = 2500,
  maxWaitMs = 90_000,
} = {}) {
  const started = Date.now();
  onStatus?.('checking');

  while (true) {
    const ok = await pingHealth();
    if (ok) {
      onStatus?.('ready');
      return true;
    }

    const elapsed = Date.now() - started;
    onStatus?.(elapsed >= wakingAfterMs ? 'waking' : 'checking');

    if (elapsed >= maxWaitMs) {
      onStatus?.('unavailable');
      return false;
    }

    await sleep(elapsed > 30_000 ? 4000 : 2000);
  }
}
