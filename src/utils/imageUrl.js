import { API_BASE } from '@/lib/http/baseUrl';

/**
 * BE 이미지 경로를 브라우저가 요청할 수 있는 URL로 변환한다.
 * DB에는 `/public/users/...` 형태로 저장되고, Express도 `/public`으로 서빙하므로
 * `/public`을 제거하면 안 된다.
 */
export function normalizeImageUrl(url) {
  if (url == null) return null;
  const raw = String(url).trim();
  if (!raw) return null;

  if (/^https?:\/\//i.test(raw)) return raw;

  const path = raw.startsWith('/') ? raw : `/${raw}`;
  return API_BASE ? `${API_BASE}${path}` : path;
}
