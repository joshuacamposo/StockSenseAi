// Text helpers shared by the local rule-based chatbot engine.
// Everything here is deterministic and runs entirely in the browser (or in Node during tests).

export function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenize(value) {
  const normalized = normalizeText(value);
  return normalized ? normalized.split(' ') : [];
}

export function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function includesPhrase(text, phrase) {
  const normalized = normalizeText(text);
  const target = normalizeText(phrase);
  if (!normalized || !target) return false;
  if (target.includes(' ')) return normalized.includes(target);
  return new RegExp(`\\b${escapeRegExp(target)}\\b`).test(normalized);
}

export function includesAny(text, phrases = []) {
  return phrases.some((phrase) => includesPhrase(text, phrase));
}

export function titleCase(value) {
  return String(value || '')
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
