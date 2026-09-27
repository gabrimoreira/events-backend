/** Lowercases and strips accents, so "São Paulo" matches a search for "sao paulo". */
export function normalize(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
}
