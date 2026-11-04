// Deterministic intent classifier for the StockSense AI assistant.
// The rules are intentionally transparent: keyword and phrase matching, not a learned model.

import {
  detectExplicitLanguageRequest,
  detectLanguageWithScore,
} from './languageDictionary';
import { resolveProduct, hasProductPronoun } from './productResolver';
import { resolveNavigation } from './navigationHandler';
import { findWalkthroughByText } from './walkthroughConfig';
import { includesAny, normalizeText } from './text';

const GREETING_WORDS = [
  'hello',
  'hi',
  'hey',
  'good morning',
  'good afternoon',
  'good evening',
  'kumusta',
  'kamusta',
  'maayong buntag',
  'maayong hapon',
  'maayong gabii',
];

const THANKS_WORDS = ['thank you', 'thanks', 'thank', 'salamat', 'maraming salamat', 'daghang salamat'];

const EXPLANATION_MARKERS = [
  'explain',
  'what is',
  'what are',
  'what does',
  'why',
  'meaning',
  'define',
  'how does',
  'how do',
  'how is',
  'difference',
  'ipaliwanag',
  'paliwanag',
  'ipasabot',
  'pasabta',
  'unsa ang',
  'ngano',
  'bakit',
  'gumagana',
  'works',
  'work',
  'tungkol',
  'about',
];

const HOW_TO_MARKERS = [
  'how to',
  'how do i',
  'how can i',
  'how would i',
  'paano',
  'paano mag',
  'unsaon',
  'unsa-on',
  'steps',
  'step by step',
  'tutorial',
  'walkthrough',
  'walk through',
  'guide me',
  'guide through',
  'show me how',
  'teach me',
  'gabayan',
  'giyahan',
];

const TOUR_MARKERS = [
  'walkthrough',
  'walk through',
  'tour',
  'tutorial',
  'guide me',
  'guide through',
  'show me how',
  'teach me',
  'step by step',
  'gabayan',
  'giyahan',
  'ipakita kung paano',
];

const LOW_STOCK_WORDS = [
  'low stock',
  'low on stock',
  'low-stock',
  'low inventory',
  'almost out',
  'running out',
  'nearly empty',
  'below reorder',
  'reorder soon',
  'restock needed',
  'needs restocking',
  'mababa ang stock',
  'kulang ang stock',
  'kulang',
  'ubos na',
  'gamay na lang',
  'hapit na mahurot',
];

const OUT_OF_STOCK_WORDS = [
  'out of stock',
  'out-of-stock',
  'no stock',
  'zero stock',
  'without stock',
  'wala nang stock',
  'wala nay stock',
  'naubos',
  'nahurot',
  'zero units',
];

const PENDING_RECOMMENDATION_WORDS = [
  'pending recommendation',
  'pending recommendations',
  'reorder list',
  'what should i order',
  'what to order',
  'what do i order',
  'what should we order',
  'which products should we reorder',
  'needs reordering',
  'reorder recommendations',
  'reorder suggestions',
  'list recommendations',
  'show recommendations',
];

const PRODUCT_STOCK_WORDS = [
  'stock',
  'stocks',
  'on hand',
  'how many',
  'how much stock',
  'quantity',
  'remaining',
  'available',
  'left',
  'ilan',
  'ilang',
  'natitira',
  'natitirang',
  'pila',
  'nahabilin',
  'nahabilang',
  'pila ka',
];

const PRODUCT_PRICE_WORDS = [
  'price',
  'unit price',
  'cost',
  'how much is',
  'how much does',
  'magkano',
  'presyo',
  'pila ang presyo',
  'tagpila',
];

const PRODUCT_SUPPLIER_WORDS = [
  'supplier',
  'vendor',
  'supplied by',
  'who supplies',
  'from which supplier',
  'tagasuplay',
  'tigsuplay',
  'sino ang supplier',
];

const PRODUCT_REORDER_WORDS = [
  'reorder level',
  'reorder point',
  'reorder threshold',
  'when to reorder',
  'when should we reorder',
  'threshold',
  'kailan mag reorder',
  'kanus-a mag reorder',
];

const PRODUCT_TARGET_WORDS = ['target stock', 'target level', 'target quantity', 'target'];

const PRODUCT_RECOMMENDATION_WORDS = [
  'recommended quantity',
  'recommendation',
  'recommendations',
  'how many should we order',
  'how many to order',
  'suggested order',
  'reorder quantity',
  'recommended reorder',
  'rekomendasyon',
  'rekomendasyon',
];

const PRODUCT_STATUS_WORDS = [
  'status',
  'low',
  'low stock',
  'out of stock',
  'why',
  'bakit',
  'ngano',
  'explain the status',
  'is it low',
  'is it out',
];

const PRODUCT_DETAILS_WORDS = [
  'details',
  'information',
  'info',
  'tell me about',
  'describe',
  'show me',
  'about',
  'ipakita',
  'tan-awa',
  'mahitungod',
];

const SUMMARY_WORDS = [
  'inventory summary',
  'stock summary',
  'overall summary',
  'how many products',
  'how many active products',
  'total products',
  'total stock',
  'total inventory',
  'inventory value',
  'dashboard summary',
  'overall status',
  'business summary',
  'ilang produkto',
  'pila ka produkto',
  'kabuuan',
  'total units',
];

const EXPLANATION_TOPICS = [
  {
    intent: 'explain_reorder',
    patterns: [
      'reorder formula',
      'reorder quantity formula',
      'how is the recommended quantity',
      'how do you calculate the recommended',
      'max target',
      'target minus',
      'formula',
      'calculation',
      'how do you compute the reorder',
      'reorder recommendation',
      'recommendations work',
      'how recommendations work',
    ],
  },
  {
    intent: 'explain_approval',
    patterns: [
      'approval',
      'approve a recommendation',
      'approve recommendation',
      'reject recommendation',
      'approval workflow',
      'decision workflow',
      'pag-apruba',
      'aprobahan',
    ],
  },
  {
    intent: 'explain_low_stock',
    patterns: [
      'low stock detection',
      'low-stock detection',
      'how do you detect low stock',
      'what is low stock',
      'low stock rule',
      'low stock status',
      'detection rule',
    ],
  },
  {
    intent: 'explain_reorder_level',
    patterns: ['reorder level', 'reorder point', 'reorder threshold', 'threshold'],
  },
  {
    intent: 'explain_target_stock',
    patterns: ['target stock', 'target level'],
  },
  {
    intent: 'explain_stock_in',
    patterns: ['stock in', 'stock-in', 'receive stock', 'restock process'],
  },
  {
    intent: 'explain_stock_out',
    patterns: ['stock out', 'stock-out', 'issue stock', 'release stock'],
  },
  {
    intent: 'explain_forecast',
    patterns: [
      'forecast',
      'forecasting',
      'demand projection',
      'moving average',
      'projected demand',
      'days of coverage',
    ],
  },
  {
    intent: 'explain_roles',
    patterns: ['roles', 'permissions', 'rbac', 'access control', 'who can approve', 'role based'],
  },
  {
    intent: 'explain_limitations',
    patterns: [
      'limitations',
      'security',
      'not production',
      'is this secure',
      'safe',
      'prototype limitation',
      'data privacy',
    ],
  },
  {
    intent: 'explain_reports',
    patterns: ['reports', 'report', 'csv', 'export', 'download'],
  },
  {
    intent: 'explain_transactions',
    patterns: ['transaction history', 'transactions', 'transaction record'],
  },
  {
    intent: 'explain_audit',
    patterns: ['audit log', 'audit logs', 'audit trail', 'activity log'],
  },
  {
    intent: 'explain_alerts',
    patterns: ['alerts', 'alert', 'notification'],
  },
  {
    intent: 'explain_suppliers',
    patterns: ['suppliers', 'supplier directory', 'supplier management'],
  },
  {
    intent: 'explain_sku',
    patterns: ['sku', 'stock keeping unit'],
  },
  {
    intent: 'explain_product_registration',
    patterns: ['product registration', 'register a product', 'add a product', 'create a product'],
  },
  {
    intent: 'explain_demo',
    patterns: ['demo testing', 'demo / testing', 'test center', '16 tests', 'demo tests'],
  },
  {
    intent: 'explain_navigation',
    patterns: ['navigate', 'navigation', 'sidebar', 'menu', 'where can i find'],
  },
  {
    intent: 'explain_inventory',
    patterns: ['inventory management', 'inventory system', 'inventory'],
  },
  {
    intent: 'explain_about',
    patterns: [
      'what is stocksense',
      'what is stock sense',
      'what does stocksense do',
      'what does this system do',
      'who are you',
      'about stocksense',
      'about this system',
      'ano ang stocksense',
      'unsa ang stocksense',
    ],
  },
  {
    intent: 'help',
    patterns: ['what can you do', 'how can you help', 'your capabilities', 'help me', 'help'],
  },
];

const MUTATION_VERBS = [
  'add',
  'increase',
  'put',
  'set',
  'change',
  'update',
  'edit',
  'delete',
  'remove',
  'deduct',
  'reduce',
  'approve',
  'reject',
  'order',
  'restock',
  'stock in',
  'stock out',
  'magdagdag',
  'idagdag',
  'idugang',
  'pagdugang',
  'bawasan',
  'tangtangon',
  'aprobahan',
];

const MUTATION_OBJECTS = [
  'stock',
  'inventory',
  'quantity',
  'unit',
  'units',
  'product',
  'item',
  'recommendation',
  'reorder',
  'price',
  'supplier',
];

export function asksExplanation(rawText = '') {
  const normalized = normalizeText(rawText);
  return includesAny(normalized, EXPLANATION_MARKERS);
}

export function asksHowTo(rawText = '') {
  const normalized = normalizeText(rawText);
  return includesAny(normalized, HOW_TO_MARKERS);
}

export function isTourRequest(rawText = '') {
  const normalized = normalizeText(rawText);
  if (includesAny(normalized, TOUR_MARKERS)) return true;
  if (!asksHowTo(normalized)) return false;
  // "How does X work?" is an explanation, not a walkthrough request.
  return !includesAny(normalized, ['how does', 'how do', 'what is', 'why', 'gumagana', 'works', 'work']);
}

export function isMutationRequest(rawText = '') {
  const normalized = normalizeText(rawText);
  const verb = includesAny(normalized, MUTATION_VERBS);
  const object = includesAny(normalized, MUTATION_OBJECTS);
  if (!verb || !object) return false;
  if (isTourRequest(normalized)) return false;
  if (asksExplanation(normalized) && !includesAny(normalized, ['please', 'now', 'right now'])) {
    return false;
  }
  return true;
}

function pickExplanationIntent(normalized) {
  for (const topic of EXPLANATION_TOPICS) {
    if (includesAny(normalized, topic.patterns)) return topic.intent;
  }
  return null;
}

function hasProductWords(normalized, words) {
  return includesAny(normalized, words);
}

function isGreeting(normalized) {
  if (!normalized) return false;
  const words = normalized.split(' ');
  if (words.length > 5) return false;
  return GREETING_WORDS.some((greeting) => normalized === greeting || normalized.startsWith(`${greeting} `));
}

function isThanks(normalized) {
  if (!normalized) return false;
  return THANKS_WORDS.some((word) => normalized.includes(word)) && normalized.split(' ').length <= 6;
}

function isClearRequest(normalized) {
  return includesAny(normalized, [
    'clear chat',
    'clear conversation',
    'new conversation',
    'reset chat',
    'start over',
  ]);
}

export function classifyIntent(rawText, options = {}) {
  const { products = [], lastProductId = null } = options;
  const normalized = normalizeText(rawText);
  const { language, scores, hasMarkers } = detectLanguageWithScore(rawText);
  const explicitLanguage = detectExplicitLanguageRequest(rawText);

  const base = {
    text: String(rawText || ''),
    normalized,
    language: hasMarkers ? language : 'en',
    languageScores: scores,
    hasLanguageMarkers: hasMarkers,
    explicitLanguage,
    productResolution: { product: null, ambiguous: false, matches: [], suggestions: [] },
    product: null,
    page: null,
    tour: null,
  };

  if (!normalized) {
    return { ...base, intent: 'empty' };
  }

  if (explicitLanguage) {
    return { ...base, intent: 'language', language: explicitLanguage };
  }

  if (isClearRequest(normalized)) {
    return { ...base, intent: 'clear_chat' };
  }

  if (isGreeting(normalized)) {
    return { ...base, intent: 'greeting' };
  }

  if (isThanks(normalized)) {
    return { ...base, intent: 'thanks' };
  }

  // Navigation wins over mutation words: "open the stock-in page" must not look like a
  // request to change stock.
  const page = resolveNavigation(normalized);
  if (page) {
    return { ...base, intent: 'navigate', page };
  }

  const tour = findWalkthroughByText(normalized);
  if (tour && isTourRequest(normalized)) {
    return { ...base, intent: 'tour', tour };
  }
  if (isTourRequest(normalized)) {
    return { ...base, intent: 'tour_list' };
  }

  if (isMutationRequest(normalized)) {
    return { ...base, intent: 'safety_action' };
  }

  const resolution = resolveProduct(normalized, products);
  let product = resolution.product;
  if (!product && lastProductId && hasProductPronoun(normalized)) {
    product = products.find((item) => item.id === lastProductId) || null;
  }

  const productContext = { ...base, productResolution: resolution, product };

  if (product) {
    if (hasProductWords(normalized, PRODUCT_PRICE_WORDS)) {
      return { ...productContext, intent: 'product_price' };
    }
    if (hasProductWords(normalized, PRODUCT_SUPPLIER_WORDS)) {
      return { ...productContext, intent: 'product_supplier' };
    }
    if (hasProductWords(normalized, PRODUCT_RECOMMENDATION_WORDS)) {
      return { ...productContext, intent: 'product_recommendation' };
    }
    if (hasProductWords(normalized, PRODUCT_REORDER_WORDS)) {
      return { ...productContext, intent: 'product_reorder_level' };
    }
    if (hasProductWords(normalized, PRODUCT_TARGET_WORDS)) {
      return { ...productContext, intent: 'product_target' };
    }
    if (hasProductWords(normalized, PRODUCT_STATUS_WORDS)) {
      return { ...productContext, intent: 'product_status' };
    }
    if (hasProductWords(normalized, ['forecast', 'demand', 'projection', 'moving average'])) {
      return { ...productContext, intent: 'forecast' };
    }
    if (hasProductWords(normalized, PRODUCT_STOCK_WORDS)) {
      return { ...productContext, intent: 'product_stock' };
    }
    if (hasProductWords(normalized, PRODUCT_DETAILS_WORDS)) {
      return { ...productContext, intent: 'product_details' };
    }
    return { ...productContext, intent: 'product_details' };
  }

  if (resolution.ambiguous) {
    return { ...productContext, intent: 'product_ambiguous' };
  }

  // No product resolved. A bare product-related question still needs a product reference.
  if (
    hasProductWords(normalized, PRODUCT_STOCK_WORDS) &&
    !hasProductWords(normalized, ['how many products', 'total stock', 'inventory summary'])
  ) {
    return { ...productContext, intent: 'product_lookup', lookup: 'stock' };
  }
  if (hasProductWords(normalized, PRODUCT_PRICE_WORDS)) {
    return { ...productContext, intent: 'product_lookup', lookup: 'price' };
  }
  if (hasProductWords(normalized, PRODUCT_SUPPLIER_WORDS)) {
    return { ...productContext, intent: 'product_lookup', lookup: 'supplier' };
  }
  if (hasProductWords(normalized, PRODUCT_RECOMMENDATION_WORDS)) {
    if (asksExplanation(normalized)) {
      return { ...base, intent: 'explain_reorder' };
    }
    return { ...base, intent: 'product_lookup', lookup: 'recommendation' };
  }

  if (hasProductWords(normalized, OUT_OF_STOCK_WORDS)) {
    return { ...base, intent: 'list_out_of_stock' };
  }

  const explanationIntent = pickExplanationIntent(normalized);
  if (explanationIntent && asksExplanation(normalized)) {
    return { ...base, intent: explanationIntent };
  }

  if (hasProductWords(normalized, LOW_STOCK_WORDS)) {
    return { ...base, intent: 'list_low_stock' };
  }
  if (hasProductWords(normalized, PENDING_RECOMMENDATION_WORDS)) {
    return { ...base, intent: 'list_recommendations' };
  }

  if (hasProductWords(normalized, SUMMARY_WORDS)) {
    return { ...base, intent: 'inventory_summary' };
  }

  if (explanationIntent) {
    return { ...base, intent: explanationIntent };
  }

  if (hasProductWords(normalized, ['forecast', 'forecasting', 'demand'])) {
    return { ...base, intent: 'explain_forecast' };
  }

  if (hasProductWords(normalized, ['what can you do', 'help', 'suggest', 'how can you help'])) {
    return { ...base, intent: 'help' };
  }

  return { ...base, intent: 'unknown' };
}

export const INTENT_LABELS = {
  greeting: 'Greeting',
  thanks: 'Thanks',
  help: 'Help',
  language: 'Language switch',
  clear_chat: 'Clear conversation',
  navigate: 'Navigation',
  tour: 'Walkthrough',
  safety_action: 'Safety refusal',
  product_stock: 'Product stock',
  product_price: 'Product price',
  product_supplier: 'Product supplier',
  product_reorder_level: 'Product reorder level',
  product_target: 'Product target stock',
  product_recommendation: 'Product recommendation',
  product_status: 'Product status',
  product_details: 'Product details',
  product_lookup: 'Product lookup',
  product_ambiguous: 'Ambiguous product',
  list_low_stock: 'Low-stock list',
  list_out_of_stock: 'Out-of-stock list',
  list_recommendations: 'Recommendation list',
  inventory_summary: 'Inventory summary',
  forecast: 'Product forecast',
  unknown: 'Unknown',
};
