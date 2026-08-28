export const USER_REFRESH_EVENT = 'favorite-photo:user-refresh';

/** Header 등 로그인 유저 정보를 다시 불러오도록 알림 (뽑기/구매 후 포인트 동기화) */
export function requestUserRefresh(detail = {}) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(USER_REFRESH_EVENT, { detail }));
}
