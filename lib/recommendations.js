// Automated reorder recommendation engine.
// Calculations are rule-based and use only the current inventory state.

import { calculateRecommendedQty, getStockStatus } from './inventoryRules';
import { newId } from './id';

/**
 * Reconciles pending recommendations against the current inventory.
 * - Creates a pending recommendation for every active product at/below its reorder level.
 * - Updates pending recommendations when stock changes (preserving history of the change).
 * - Supersedes pending recommendations automatically once stock is healthy or the product is inactive.
 * - Never changes stock and never touches decided (approved/rejected) recommendations.
 */
export function reconcileRecommendations(products = [], recommendations = [], now = new Date().toISOString()) {
  const next = recommendations.map((recommendation) => ({ ...recommendation }));
  const events = [];
  const activeProductIds = new Set(products.filter((product) => product.active).map((product) => product.id));

  for (const product of products) {
    if (!product.active) continue;
    const pending = next.find(
      (recommendation) => recommendation.productId === product.id && recommendation.status === 'pending'
    );
    const status = getStockStatus(product);

    if (status.key === 'sufficient') {
      if (pending) {
        pending.status = 'superseded';
        pending.decidedAt = now;
        pending.decidedBy = 'System (automated rule)';
        pending.decisionNote = 'Closed automatically — stock is now above the reorder level.';
        pending.updatedAt = now;
        events.push({ type: 'superseded', product });
      }
      continue;
    }

    const recommendedQty = calculateRecommendedQty(product);
    if (recommendedQty <= 0) continue;

    if (pending) {
      if (pending.recommendedQty !== recommendedQty || pending.currentStock !== product.stock) {
        pending.previousQuantity = pending.recommendedQty;
        pending.previousStock = pending.currentStock;
        pending.currentStock = product.stock;
        pending.recommendedQty = recommendedQty;
        pending.updatedAt = now;
        events.push({ type: 'updated', product });
      }
      continue;
    }

    next.unshift({
      id: newId('rec'),
      productId: product.id,
      sku: product.sku,
      productName: product.name,
      unit: product.unit,
      currentStock: product.stock,
      reorderLevel: product.reorderLevel,
      targetStock: product.targetStock,
      recommendedQty,
      status: 'pending',
      source: 'automated-rule',
      createdAt: now,
      updatedAt: now,
      createdBy: 'System (automated rule)',
      decidedAt: null,
      decidedBy: null,
      decisionNote: '',
    });
    events.push({ type: 'created', product });
  }

  // Any pending recommendation whose product disappeared or was deactivated is superseded.
  for (const recommendation of next) {
    if (recommendation.status !== 'pending') continue;
    if (!activeProductIds.has(recommendation.productId)) {
      recommendation.status = 'superseded';
      recommendation.decidedAt = now;
      recommendation.decidedBy = 'System (automated rule)';
      recommendation.decisionNote = 'Closed automatically — the product is no longer active.';
      recommendation.updatedAt = now;
      events.push({
        type: 'superseded',
        product: products.find((product) => product.id === recommendation.productId) || {
          id: recommendation.productId,
          name: recommendation.productName,
        },
      });
    }
  }

  return { recommendations: next, events };
}

/**
 * Pure decision helper shared by AppProvider and the automated test center.
 * It only changes the recommendation record — inventory stock is never touched.
 */
export function applyRecommendationDecision(
  recommendation,
  decision,
  { note = '', actor = null, now = new Date().toISOString() } = {}
) {
  if (!recommendation) {
    return { ok: false, error: 'Recommendation not found.' };
  }
  if (decision !== 'approved' && decision !== 'rejected') {
    return { ok: false, error: 'Invalid recommendation decision.' };
  }
  if (recommendation.status !== 'pending') {
    return {
      ok: false,
      error: 'Only pending recommendations can be approved or rejected.',
    };
  }

  const updated = {
    ...recommendation,
    status: decision,
    decidedAt: now,
    decidedBy: actor?.name || 'System',
    decidedById: actor?.id || 'system',
    decisionNote:
      String(note || '').trim() ||
      (decision === 'approved'
        ? 'Approved for purchasing. Stock will only increase after a separate stock-in transaction.'
        : 'Rejected by reviewer.'),
    updatedAt: now,
  };

  return { ok: true, recommendation: updated, stockChanged: false };
}

export function decisionAuditDescription(recommendation, decision) {
  return `Decision: ${decision} for recommended quantity ${recommendation.recommendedQty}. Inventory stock was NOT changed by this approval.`;
}

export const RECOMMENDATION_STATUS = {
  pending: {
    label: 'Pending Review',
    badge: 'bg-amber-50 text-amber-700 ring-amber-200',
    dot: 'bg-amber-500',
  },
  approved: {
    label: 'Approved',
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    dot: 'bg-emerald-500',
  },
  rejected: {
    label: 'Rejected',
    badge: 'bg-rose-50 text-rose-700 ring-rose-200',
    dot: 'bg-rose-500',
  },
  superseded: {
    label: 'Superseded',
    badge: 'bg-slate-100 text-slate-600 ring-slate-200',
    dot: 'bg-slate-400',
  },
};
