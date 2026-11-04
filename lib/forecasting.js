// Historical demand forecasting.
// Prototype method: simple historical moving average based on real stock-out transactions.
// This is NOT a trained machine-learning model and does not claim any accuracy/confidence score.

import { startOfDay, endOfDay, formatDateShort, dateKey } from './format';

/**
 * @param {object} options
 * @param {object} options.product
 * @param {Array} options.transactions
 * @param {number} options.periodDays historical window in calendar days
 * @param {number} options.horizonDays forecast horizon in days
 * @param {Date} options.now reference date
 */
export function buildForecast({ product, transactions = [], periodDays = 30, horizonDays = 30, now = new Date() }) {
  if (!product) {
    return {
      ok: false,
      reason: 'missing-product',
      message: 'Select a product to generate a forecast.',
      averageDailyDemand: 0,
      projectedDemand: 0,
      totalStockOut: 0,
      periodDays,
      horizonDays,
      daysOfCoverage: null,
      series: [],
      matchingTransactions: [],
    };
  }

  const end = endOfDay(now);
  const start = startOfDay(now);
  start.setDate(start.getDate() - (periodDays - 1));

  const matchingTransactions = transactions
    .filter((transaction) => {
      if (transaction.productId !== product.id) return false;
      if (transaction.type !== 'out') return false;
      const time = new Date(transaction.timestamp).getTime();
      return time >= start.getTime() && time <= end.getTime();
    })
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  const totalStockOut = matchingTransactions.reduce(
    (sum, transaction) => sum + (Number(transaction.quantity) || 0),
    0
  );

  const averageDailyDemand = totalStockOut / periodDays;
  const projectedDemand = averageDailyDemand * horizonDays;
  const daysOfCoverage =
    averageDailyDemand > 0 ? (Number(product.stock) || 0) / averageDailyDemand : null;

  // Build a daily series for the chart (one bucket per calendar day in the window).
  const buckets = new Map();
  const cursor = new Date(start);
  while (cursor.getTime() <= end.getTime()) {
    buckets.set(dateKey(cursor), { units: 0, label: formatDateShort(cursor.toISOString()) });
    cursor.setDate(cursor.getDate() + 1);
  }
  for (const transaction of matchingTransactions) {
    const key = dateKey(transaction.timestamp);
    if (buckets.has(key)) {
      buckets.get(key).units += Number(transaction.quantity) || 0;
    }
  }

  const series = Array.from(buckets.values());

  // 3-day moving average overlay for readability.
  const withAverage = series.map((point, index) => {
    const windowStart = Math.max(0, index - 2);
    const windowPoints = series.slice(windowStart, index + 1);
    const avg = windowPoints.reduce((sum, item) => sum + item.units, 0) / windowPoints.length;
    return {
      ...point,
      movingAverage: Math.round(avg * 100) / 100,
      index,
    };
  });

  return {
    ok: totalStockOut > 0,
    reason: totalStockOut > 0 ? null : 'insufficient-history',
    message:
      totalStockOut > 0
        ? null
        : 'Insufficient sales history for a reliable forecast.',
    product,
    periodDays,
    horizonDays,
    totalStockOut,
    averageDailyDemand,
    projectedDemand,
    daysOfCoverage,
    series: withAverage,
    matchingTransactions,
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  };
}

export function formatCoverage(days) {
  if (days === null || days === undefined || !Number.isFinite(days)) return '—';
  if (days >= 999) return '999+ days';
  if (days < 1) return 'Less than 1 day';
  return `${days.toFixed(1)} days`;
}
