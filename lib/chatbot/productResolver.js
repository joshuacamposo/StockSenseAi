// Resolves product references against the live centralized inventory state.
// Never invents products, quantities, or suppliers.

import { escapeRegExp, normalizeText, tokenize } from './text';

export function productAliases(product) {
  if (!product) return [];
  const sku = normalizeText(product.sku);
  return Array.from(
    new Set(
      [
        normalizeText(product.name),
        sku,
        sku.replace(/-/g, ' '),
        ...(Array.isArray(product.aliases) ? product.aliases.map(normalizeText) : []),
      ].filter(Boolean)
    )
  );
}

function scoreProduct(normalizedQuery, queryTokens, product) {
  let score = 0;
  const aliases = productAliases(product);
  const nameTokens = tokenize(product.name);

  for (const alias of aliases) {
    if (!alias) continue;
    if (normalizedQuery === alias) {
      score = Math.max(score, 120);
      continue;
    }
    if (alias.includes(' ')) {
      if (normalizedQuery.includes(alias)) {
        score = Math.max(score, 90 + Math.min(alias.length, 30));
      }
    } else if (new RegExp(`\\b${escapeRegExp(alias)}\\b`).test(normalizedQuery)) {
      score = Math.max(score, 85 + Math.min(alias.length, 20));
    }
  }

  for (const token of queryTokens) {
    if (token.length < 3) continue;
    if (nameTokens.includes(token)) score = Math.max(score, 70);
    if (token.endsWith('s') && nameTokens.includes(token.slice(0, -1))) score = Math.max(score, 62);
  }

  // SKU fragments such as "BP" plus number are matched through the alias list above.
  return score;
}

export function suggestProducts(rawText, products = [], limit = 3) {
  const queryTokens = tokenize(rawText).filter((token) => token.length >= 4);
  if (queryTokens.length === 0) return [];
  return products
    .map((product) => {
      const nameTokens = tokenize(`${product.name} ${product.sku}`);
      let hits = 0;
      for (const token of queryTokens) {
        if (nameTokens.some((nameToken) => nameToken.startsWith(token) || token.startsWith(nameToken))) {
          hits += 1;
        }
      }
      return { product, hits };
    })
    .filter((entry) => entry.hits > 0)
    .sort((a, b) => b.hits - a.hits)
    .slice(0, limit)
    .map((entry) => entry.product);
}

/**
 * resolveProduct returns:
 * { product, ambiguous, matches, bestScore, suggestions }
 * A product is only returned when one product clearly scores highest.
 */
export function resolveProduct(rawText, products = []) {
  const normalizedQuery = normalizeText(rawText);
  if (!normalizedQuery) {
    return { product: null, ambiguous: false, matches: [], bestScore: 0, suggestions: [] };
  }
  const queryTokens = normalizedQuery.split(' ');

  const scored = products
    .map((product) => ({
      product,
      score: scoreProduct(normalizedQuery, queryTokens, product),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) {
    return {
      product: null,
      ambiguous: false,
      matches: [],
      bestScore: 0,
      suggestions: suggestProducts(rawText, products),
    };
  }

  const bestScore = scored[0].score;
  const top = scored.filter((entry) => entry.score === bestScore);

  if (top.length > 1) {
    // Prefer active products but never guess between two different active products.
    const activeTop = top.filter((entry) => entry.product.active !== false);
    if (activeTop.length === 1) {
      return {
        product: activeTop[0].product,
        ambiguous: false,
        matches: top.map((entry) => entry.product),
        bestScore,
        suggestions: [],
      };
    }
    return {
      product: null,
      ambiguous: true,
      matches: top.map((entry) => entry.product),
      bestScore,
      suggestions: [],
    };
  }

  return {
    product: top[0].product,
    ambiguous: false,
    matches: [top[0].product],
    bestScore,
    suggestions: [],
  };
}

export function supplierForProduct(product, suppliers = []) {
  if (!product?.supplierId) return null;
  return suppliers.find((supplier) => supplier.id === product.supplierId) || null;
}

export function hasProductPronoun(rawText) {
  const normalized = normalizeText(rawText);
  return /\b(it|its|itself|that product|this product|the product|same product|of it|for it|about it)\b/.test(
    normalized
  );
}

export function hasAnyProductMention(rawText, products = []) {
  return resolveProduct(rawText, products).product !== null;
}
