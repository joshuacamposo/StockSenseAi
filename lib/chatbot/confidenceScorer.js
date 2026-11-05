// Transparent confidence scoring for the deterministic assistant.
//
// This is NOT a machine-learning probability. It is a small, explainable heuristic used to decide
// whether the assistant should answer directly or ask a clarifying question. The score is exposed
// in response metadata so the behavior can be inspected during the demonstration.

const INTENT_BASE = {
  empty: 0.2,
  language: 0.98,
  clear_chat: 0.98,
  greeting: 0.95,
  thanks: 0.95,
  navigate: 0.94,
  tour: 0.93,
  tour_list: 0.9,
  safety_action: 0.92,
  product_location: 0.9,
  product_history: 0.88,
  element_location: 0.88,
  product_stock: 0.92,
  product_price: 0.92,
  product_supplier: 0.9,
  product_reorder_level: 0.9,
  product_target: 0.9,
  product_recommendation: 0.9,
  product_status: 0.9,
  product_details: 0.72,
  product_lookup: 0.6,
  product_ambiguous: 0.2,
  product_unknown: 0.25,
  list_low_stock: 0.92,
  list_out_of_stock: 0.92,
  list_recommendations: 0.92,
  inventory_summary: 0.9,
  forecast: 0.88,
  help: 0.85,
  unknown: 0.12,
};

const ATTRIBUTE_INTENTS = new Set([
  'product_stock',
  'product_price',
  'product_supplier',
  'product_reorder_level',
  'product_target',
  'product_recommendation',
  'product_status',
  'product_details',
  'product_location',
  'product_history',
  'forecast',
]);

function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

export function scoreIntentConfidence(classification = {}) {
  const intent = classification.intent || 'unknown';
  let score = INTENT_BASE[intent] ?? 0.3;
  const reasons = [];

  if (classification.explicitLanguage) {
    score = clamp(score + 0.02);
    reasons.push('explicit language request');
  }

  if (classification.hasLanguageMarkers) {
    reasons.push('language markers detected');
  }

  if (ATTRIBUTE_INTENTS.has(intent)) {
    if (classification.product) {
      score = clamp(score + 0.04);
      reasons.push('product resolved');
    } else if (intent !== 'product_details') {
      score = clamp(score - 0.18);
      reasons.push('no product resolved');
    }

    const resolution = classification.productResolution || {};
    if (resolution.ambiguous) {
      score = clamp(score - 0.45);
      reasons.push('ambiguous product reference');
    }
  }

  if (intent === 'product_details' && classification.product && !classification.productResolution?.ambiguous) {
    // A bare product mention is answered with details, but the user may have wanted something else.
    score = clamp(score - 0.04);
  }

  if (intent === 'unknown') {
    const tokens = String(classification.normalized || '').split(' ').filter(Boolean);
    if (tokens.length <= 2) score = clamp(score - 0.03);
    reasons.push('no rule matched');
  }

  const level = score >= 0.8 ? 'high' : score >= 0.55 ? 'medium' : 'low';
  return {
    score: Number(score.toFixed(2)),
    level,
    reasons,
    needsClarification: level === 'low' && intent !== 'empty',
  };
}

/**
 * True when the classifier could plausibly mean two unrelated things. The current rules never guess
 * between unrelated intents, so this mainly guards future additions.
 */
export function hasCompetingIntents(candidates = []) {
  const unique = Array.from(new Set(candidates.filter(Boolean)));
  return unique.length > 1;
}
