/** Ignore Vietnamese accents while retaining distinctions such as カ and ガ. */
export function normalizeStudySearch(value: string) {
  return value.toLowerCase().normalize('NFD')
    .replace(/([a-z])[\u0300-\u036f]+/g, '$1')
    .replace(/đ/g, 'd')
    .normalize('NFC').trim();
}
