const LOCAL_BE_ORIGIN = 'http://localhost:3000';
const DEPLOYED_BE_ORIGIN = 'https://my-favorite-photo-bf.onrender.com';

export const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  (process.env.NODE_ENV === 'development' ? LOCAL_BE_ORIGIN : DEPLOYED_BE_ORIGIN)
).replace(/\/$/, '');

export function apiUrl(path) {
  if (!API_BASE) throw new Error('NEXT_PUBLIC_API_BASE_URL is missing');
  if (!path.startsWith('/api/')) throw new Error(`apiUrl path must start with "/api/": ${path}`);
  return `${API_BASE}${path}`;
}
