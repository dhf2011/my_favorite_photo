/** API/DB 등급값을 카드·필터 표시용으로 맞춤 (common → COMMON, superrare → SUPER RARE) */
export function toDisplayGrade(value) {
  const key = String(value ?? '')
    .trim()
    .toUpperCase()
    .replace(/[\s_-]+/g, '');
  if (key === 'SUPERRARE') return 'SUPER RARE';
  if (key === 'RARE') return 'RARE';
  if (key === 'LEGENDARY') return 'LEGENDARY';
  return 'COMMON';
}

/** 필터 값을 listings API grade 파라미터로 맞춤 */
export function toApiGrade(value) {
  if (!value || value === 'all' || value === 'ALL') return null;
  const key = String(value)
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '');
  if (key === 'common' || key === 'rare' || key === 'superrare' || key === 'legendary') {
    return key;
  }
  return null;
}
