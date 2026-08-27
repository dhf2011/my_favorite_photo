/**
 * API Origin.
 * 배포(Netlify)와 로컬 프록시에서는 빈 문자열을 쓴다.
 * 브라우저가 같은 출처로 요청하면 로그인 쿠키가 유지되고,
 * Next/Netlify가 /users, /api 등을 Render 백엔드로 넘긴다.
 *
 * 로컬 백엔드를 직접 치려면:
 * NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
 */
export const API_BASE = String(process.env.NEXT_PUBLIC_API_BASE_URL ?? '').replace(/\/$/, '');

export function apiUrl(path) {
  if (!path.startsWith('/api/')) throw new Error(`apiUrl path must start with "/api/": ${path}`);
  return `${API_BASE}${path}`;
}
