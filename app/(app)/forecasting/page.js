'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  CalendarRange,
  Calculator,
  Info,
  LineChart,
  Package,
  Sigma,
  TrendingUp,
} from 'lucide-react';
import { useApp } from '@/context/AppProvider';
import {
  Badge,
  Callout,
  DemoNote,
  EmptyState,
  PageHeader,
  SectionCard,
  Select,
  StatCard,
  cn,
} from '@/components/ui';
import ForecastChart from '@/components/charts/ForecastChart';
import { buildForecast, formatCoverage } from '@/lib/forecasting';
import { getStockStatus } from '@/lib/inventoryRules';
import { formatDate, formatDateTime, formatNumber } from '@/lib/format';

const PERIODS = [
  { value: 14, label: 'Last 14 days' },
  { value: 30, label: 'Last 30 days' },
  { value: 60, label: 'Last 60 days' },
  { value: 90, label: 'Last 90 days' },
];

const HORIZONS = [
  { value: 7, label: 'Next 7 days' },
  { value: 14, label: 'Next 14 days' },
  { value: 30, label: 'Next 30 days' },
];

export default function ForecastingPage() {
  const { activeProducts, transactions, settings } = useApp();
  const [productId, setProductId] = useState('');
  const [periodDays, setPeriodDays] = useState(settings.forecastPeriodDays || 30);
  const [horizonDays, setHorizonDays] = useState(settings.forecastHorizonDays || 30);

  useEffect(() => {
    if (!activeProducts.some((product) => product.id === productId)) {
      const preferred = activeProducts.find((product) => product.sku === 'BP-001');
      setProductId(preferred?.id || activeProducts[0]?.id || '');
    }
  }, [activeProducts, productId]);

  const product = activeProducts.find((item) => item.id === productId) || activeProducts[0] || null;

  const forecast = useMemo(
    () =>
      buildForecast({
        product,
        transactions,
        periodDays,
        horizonDays,
      }),
    [product, transactions, periodDays, horizonDays]
  );

  const status = product ? getStockStatus(product) : null;

  const dailyCoverage = forecast.daysOfCoverage;
  const coverageWarning =
    dailyCoverage !== null && dailyCoverage < horizonDays && forecast.ok;

  return (
    <div>
      <PageHeader
        title="Demand Forecasting"
        eyebrow="Historical analysis"
        icon={LineChart}
        subtitle="A transparent historical moving-average projection built from this application's real stock-out transactions. No trained machine-learning model is running."
        badges={
          <>
            <DemoNote />
            <Badge tone="violet">Prototype Forecast — Historical Moving Average</Badge>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="space-y-4">
          <SectionCard title="Forecast controls" subtitle="Choose the product and time windows" icon={CalendarRange}>
            <div className="space-y-4">
              <div>
                <label htmlFor="forecast-product" className="field-label">
                  Product
                </label>
                <Select
                  id="forecast-product"
                  value={product?.id || ''}
                  onChange={(event) => setProductId(event.target.value)}
                  data-tour="forecast-product"
                >
                  {activeProducts.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.sku} — {item.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label htmlFor="forecast-period" className="field-label">
                  Historical period
                </label>
                <Select
                  id="forecast-period"
                  value={periodDays}
                  onChange={(event) => setPeriodDays(Number(event.target.value))}
                >
                  {PERIODS.map((period) => (
                    <option key={period.value} value={period.value}>
                      {period.label}
                    </option>
                  ))}
                </Select>
                <p className="field-hint">
                  Average daily demand divides by the full calendar window, including days with no
                  stock-out.
                </p>
              </div>
              <div>
                <label htmlFor="forecast-horizon" className="field-label">
                  Forecast horizon
                </label>
                <Select
                  id="forecast-horizon"
                  value={horizonDays}
                  onChange={(event) => setHorizonDays(Number(event.target.value))}
                >
                  {HORIZONS.map((horizon) => (
                    <option key={horizon.value} value={horizon.value}>
                      {horizon.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            {product ? (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold text-slate-700">{product.name}</p>
                  <Badge tone={status.key === 'out' ? 'rose' : status.key === 'low' ? 'amber' : 'emerald'}>
                    {status.label}
                  </Badge>
                </div>
                <dl className="mt-2 space-y-1 text-[10.5px]">
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Current stock</dt>
                    <dd className="font-bold text-slate-800">{product.stock} {product.unit}(s)</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Reorder level</dt>
                    <dd className="font-semibold text-slate-700">{product.reorderLevel}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Target stock</dt>
                    <dd className="font-semibold text-slate-700">{product.targetStock}</dd>
                  </div>
                </dl>
              </div>
            ) : null}
          </SectionCard>

          <Callout tone="info" title="What this prototype does" icon={Info}>
            This is a deterministic historical moving average. It does not predict seasonality,
            promotions, or supplier lead times, and it does not produce confidence scores. A future
            version could integrate a trained forecasting model.
          </Callout>
        </div>

        <div className="space-y-4">
          <div data-tour="forecast-results">
            <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
              <StatCard
                label="Stock-out in period"
                value={formatNumber(forecast.totalStockOut)}
                hint={`${periodDays} calendar days`}
                icon={Package}
                tone="brand"
              />
              <StatCard
                label="Average daily demand"
                value={forecast.ok ? forecast.averageDailyDemand.toFixed(2) : '0.00'}
                hint="Units per calendar day"
                icon={Sigma}
                tone="violet"
              />
              <StatCard
                label={`Projected demand (${horizonDays}d)`}
                value={forecast.ok ? formatNumber(Math.round(forecast.projectedDemand)) : '—'}
                hint="Average daily demand × horizon"
                icon={TrendingUp}
                tone="amber"
              />
              <StatCard
                label="Days of coverage"
                value={formatCoverage(forecast.daysOfCoverage)}
                hint={`Current stock ÷ average daily demand`}
                icon={CalendarRange}
                tone={coverageWarning ? 'rose' : 'emerald'}
              />
            </div>

            {!forecast.ok ? (
              <div className="mt-4 flex flex-col gap-2 rounded-xl border border-amber-200 bg-amber-50/80 p-4 sm:flex-row sm:items-center">
                <Info size={18} className="shrink-0 text-amber-600" />
                <div>
                  <p className="text-[13px] font-bold text-amber-900">
                    Insufficient sales history for a reliable forecast.
                  </p>
                  <p className="mt-0.5 text-[11.5px] leading-relaxed text-amber-800">
                    There are no stock-out transactions for {product?.name || 'this product'} in the
                    selected {periodDays}-day window. Record stock-out transactions (for example,
                    issue units from the Stock-Out page) or choose a longer historical period.
                  </p>
                </div>
              </div>
            ) : coverageWarning ? (
              <div className="mt-4 flex flex-col gap-2 rounded-xl border border-rose-200 bg-rose-50/80 p-4 sm:flex-row sm:items-center">
                <Info size={18} className="shrink-0 text-rose-500" />
                <div>
                  <p className="text-[13px] font-bold text-rose-900">
                    Coverage is shorter than the forecast horizon.
                  </p>
                  <p className="mt-0.5 text-[11.5px] leading-relaxed text-rose-800">
                    Current stock covers about {formatCoverage(dailyCoverage)} of demand at the
                    observed average, but the horizon is {horizonDays} days. Consider reviewing the
                    reorder recommendation for {product?.name}.
                  </p>
                </div>
              </div>
            ) : null}
          </div>

          <div data-tour="forecast-chart">
            <SectionCard
              title="Historical daily demand"
              subtitle={
                forecast.ok
                  ? `${formatDate(forecast.startDate)} – ${formatDate(forecast.endDate)} · stock-out units per day`
                  : 'No stock-out history in the selected period'
              }
              icon={BarChart3}
              action={
                <span className="text-[10.5px] font-semibold text-slate-500">
                  {forecast.matchingTransactions.length} stock-out transaction(s)
                </span>
              }
            >
              {forecast.ok ? (
                <ForecastChart data={forecast.series} height={290} />
              ) : (
                <EmptyState
                  icon={BarChart3}
                  title="No demand history to chart"
                  message="Select a different product or a longer period, or record stock-out transactions."
                  className="py-12"
                />
              )}
            </SectionCard>
          </div>

          <SectionCard title="How this forecast is calculated" subtitle="Fully explainable arithmetic" icon={Calculator}>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                {
                  label: 'Average daily demand',
                  formula: 'Total stock-out units ÷ historical calendar days',
                  value: forecast.ok
                    ? `${forecast.totalStockOut} ÷ ${periodDays} = ${forecast.averageDailyDemand.toFixed(2)} units/day`
                    : `0 ÷ ${periodDays} = 0.00 units/day`,
                },
                {
                  label: `Projected demand (${horizonDays} days)`,
                  formula: 'Average daily demand × forecast days',
                  value: forecast.ok
                    ? `${forecast.averageDailyDemand.toFixed(2)} × ${horizonDays} = ${forecast.projectedDemand.toFixed(2)} units`
                    : `${forecast.averageDailyDemand.toFixed(2)} × ${horizonDays} = 0.00 units`,
                },
                {
                  label: 'Days of stock coverage',
                  formula: 'Current stock ÷ average daily demand',
                  value:
                    forecast.daysOfCoverage === null
                      ? 'No demand — coverage cannot be estimated'
                      : `${product?.stock || 0} ÷ ${forecast.averageDailyDemand.toFixed(2)} = ${forecast.daysOfCoverage.toFixed(1)} days`,
                },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-slate-200 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    {item.label}
                  </p>
                  <p className="mt-1 text-[10.5px] leading-relaxed text-slate-500">{item.formula}</p>
                  <p className="mt-2 font-mono text-[11.5px] font-semibold leading-relaxed text-slate-800">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-[10.5px] leading-relaxed text-slate-500">
              <Info size={13} className="mt-0.5 shrink-0" />
              <span>
                Historical demand uses only <strong>actual stock-out transactions</strong> from this
                browser&apos;s centralized state. The selected window is measured in calendar days;
                days without movement count as zero demand. This prototype does not claim forecast
                accuracy, confidence, or machine-learning inference.
              </span>
            </div>
          </SectionCard>

          <SectionCard
            title="Stock-out records used"
            subtitle="The exact local transactions feeding this projection"
            icon={ArrowRight}
            bodyClassName="px-0 pb-0"
          >
            {forecast.matchingTransactions.length === 0 ? (
              <EmptyState
                title="No records in this window"
                message="Recorded stock-out transactions for the selected period will appear here."
                className="py-8"
              />
            ) : (
              <div className="table-wrap">
                <table className="data-table min-w-[720px]">
                  <thead>
                    <tr>
                      <th>Date &amp; time</th>
                      <th>Product</th>
                      <th>Quantity</th>
                      <th>Stock change</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...forecast.matchingTransactions]
                      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                      .slice(0, 8)
                      .map((transaction) => (
                        <tr key={transaction.id}>
                          <td className="text-[11px] text-slate-500">
                            {formatDateTime(transaction.timestamp)}
                          </td>
                          <td className="text-[12px] font-semibold text-slate-800">
                            {transaction.productName}
                          </td>
                          <td className="text-[12px] font-bold text-amber-600">
                            −{transaction.quantity}
                          </td>
                          <td className="text-[11.5px] text-slate-500">
                            {transaction.previousStock} → {transaction.updatedStock}
                          </td>
                          <td className="max-w-[260px] truncate text-[11px] text-slate-500">
                            {transaction.remarks}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
