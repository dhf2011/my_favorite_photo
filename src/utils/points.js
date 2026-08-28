/** 포인트/가격 문자열·숫자에서 금액을 숫자로 변환 (쉼표·공백 무시) */
export function parsePointNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : NaN;
  const digits = String(value ?? '').replace(/[^\d.-]/g, '');
  if (!digits || digits === '-' || digits === '.') return NaN;
  const n = Number(digits);
  return Number.isFinite(n) ? n : NaN;
}

/** 1,000 형태의 숫자 문자열 */
export function formatPointNumber(value, { empty = '0' } = {}) {
  if (value == null || value === '') return empty;
  if (typeof value === 'string' && /no data/i.test(value.trim())) return value;
  const n = parsePointNumber(value);
  if (!Number.isFinite(n)) return empty;
  return Math.round(n).toLocaleString('en-US');
}

/** 표시용: "1,000 P" */
export function formatPoints(value, { suffix = ' P' } = {}) {
  if (typeof value === 'string' && /no data/i.test(value.trim())) return value;
  return `${formatPointNumber(value)}${suffix}`;
}

/**
 * 이미 "77777 P", "8 P (2장)", "4P에 구매"처럼 붙어 있는 문자열의
 * 첫 번째 숫자만 천 단위 쉼표로 바꿈. 나머지 텍스트는 유지.
 */
export function withPointCommas(value) {
  if (value == null || value === '') return value;
  if (typeof value === 'number') return formatPointNumber(value);
  const s = String(value);
  if (/no data/i.test(s.trim())) return s;
  return s.replace(/-?[\d,]+/, (m) => formatPointNumber(m));
}

/** 가격 입력란: 숫자만 남기고 쉼표 표시 */
export function formatPointInput(raw) {
  const digits = String(raw ?? '').replace(/\D/g, '');
  if (!digits) return '';
  return Number(digits).toLocaleString('en-US');
}
