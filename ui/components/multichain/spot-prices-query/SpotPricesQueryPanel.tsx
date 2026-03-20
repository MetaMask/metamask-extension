/**
 * SpotPricesQueryPanel — TanStack Query demo with two fetch ownership models.
 *
 * UI-direct fetch (display-only, on-demand, freshness-context-sensitive):
 *   Two rows share the same queryKey. staleTimeOverride at the call site lets
 *   swap screen request fresher data than portfolio without a different hook.
 *
 * Controller-driven sync via BaseDataService (background-owned):
 *   CurrencyRateDataService extends BaseDataService and subscribes to
 *   CurrencyRateController:stateChange. BaseDataService auto-publishes
 *   cacheUpdate events; useBackgroundQuerySync hydrates the UI QueryClient.
 */
import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../helpers/api-client';
import { useSpotPricesQuery } from '../../../hooks/useSpotPricesQuery';
import { useCurrencyRatesQuery } from '../../../hooks/useCurrencyRatesQuery';

const ETH_ASSET_ID = 'eip155:1/slip44:60';
const ASSET_IDS = [ETH_ASSET_ID];

function formatTs(ts: number | undefined) {
  return ts ? new Date(ts).toLocaleTimeString() : 'never';
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function QueryStateTable({
  status,
  isFetching,
  isStale,
  dataUpdatedAt,
  staleTimeLabel,
  dataPreview,
}: {
  status: string;
  isFetching: boolean;
  isStale: boolean;
  dataUpdatedAt: number | undefined;
  staleTimeLabel: string;
  dataPreview: string;
}) {
  return (
    <table style={{ width: '100%', fontSize: 12, marginTop: 8 }}>
      <tbody>
        {[
          ['status', status],
          ['isFetching', String(isFetching)],
          ['isStale', String(isStale)],
          ['dataUpdatedAt', formatTs(dataUpdatedAt)],
          ['staleTime', staleTimeLabel],
          ['data', dataPreview],
        ].map(([key, value]) => (
          <tr key={key}>
            <td>
              <code>{key}</code>
            </td>
            <td>{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <>
      <strong style={{ fontSize: 12 }}>{title}</strong>
      <p style={{ fontSize: 11, margin: '4px 0 8px', color: '#555' }}>
        {subtitle}
      </p>
    </>
  );
}

// ─── UI-direct fetch ──────────────────────────────────────────────────────────

function SpotPricesRow({
  label,
  staleTimeOverride,
  note,
}: {
  label: string;
  staleTimeOverride?: number;
  note: string;
}) {
  const result = useSpotPricesQuery(ASSET_IDS, 'usd', staleTimeOverride);
  const preview = result.data
    ? JSON.stringify(result.data).slice(0, 80) + '…'
    : 'null';

  return (
    <div
      style={{
        border: '1px solid #ddd',
        borderRadius: 6,
        padding: 10,
        marginBottom: 6,
      }}
    >
      <strong style={{ fontSize: 12 }}>{label}</strong>
      <span style={{ fontSize: 11, color: '#888', marginLeft: 8 }}>{note}</span>
      <QueryStateTable
        status={result.status}
        isFetching={result.isFetching}
        isStale={result.isStale}
        dataUpdatedAt={result.dataUpdatedAt}
        staleTimeLabel={
          staleTimeOverride !== undefined
            ? `${staleTimeOverride / 1000}s (call-site override)`
            : '30s (default from queryOptions)'
        }
        dataPreview={preview}
      />
    </div>
  );
}

// ─── Controller-driven sync via BaseDataService ──────────────────────────────

function CurrencyRatesRow() {
  const result = useCurrencyRatesQuery();
  const ethRate = result.data?.ETH?.conversionRate;
  const preview = ethRate != null ? `ETH/USD: ${ethRate}` : 'null';

  return (
    <div
      style={{
        border: '1px solid #ddd',
        borderRadius: 6,
        padding: 10,
        marginBottom: 6,
      }}
    >
      <strong style={{ fontSize: 12 }}>Currency rates (ETH/USD)</strong>
      <span style={{ fontSize: 11, color: '#888', marginLeft: 8 }}>
        populated by CurrencyRateDataService (BaseDataService) → hydrate()
      </span>
      <QueryStateTable
        status={result.status}
        isFetching={result.isFetching}
        isStale={result.isStale}
        dataUpdatedAt={result.dataUpdatedAt}
        staleTimeLabel="30s (controller pushes; hook does not re-fetch)"
        dataPreview={preview}
      />
    </div>
  );
}

// ─── Cache inspector ──────────────────────────────────────────────────────────

function CacheInspector() {
  const queryClient = useQueryClient();
  const spotQueryOptions = apiClient.prices.getV3SpotPricesQueryOptions(
    ASSET_IDS,
    { currency: 'usd' },
  );
  const spotCached = queryClient.getQueryData(spotQueryOptions.queryKey);
  const currencyCached = queryClient.getQueryData([
    'CurrencyRateDataService:getCurrencyRates',
  ]);

  return (
    <div
      style={{
        background: '#f8f9fa',
        borderRadius: 6,
        padding: 10,
        marginBottom: 8,
        fontSize: 11,
      }}
    >
      <strong>Cache</strong>
      <br />
      <code>
        spotPrices: {spotCached ? '✅' : '❌'} &nbsp;|&nbsp; currencyRates:{' '}
        {currencyCached ? '✅' : '❌'}
      </code>
      <br />
      <code style={{ color: '#999', wordBreak: 'break-all' }}>
        key: {JSON.stringify(spotQueryOptions.queryKey).slice(0, 100)}
      </code>
    </div>
  );
}

// ─── Root component ───────────────────────────────────────────────────────────

export function SpotPricesQueryPanel() {
  return (
    <div
      style={{
        padding: 16,
        margin: 8,
        border: '2px solid #037dd6',
        borderRadius: 12,
        background: '#fff',
        fontFamily: 'monospace',
      }}
    >
      <h3 style={{ marginTop: 0, fontSize: 14, color: '#037dd6' }}>
        TanStack Query — Two Fetch Ownership Models
      </h3>

      <CacheInspector />

      {/* UI-direct fetch, call-site staleTime */}
      <div
        style={{
          background: '#f8fff8',
          borderRadius: 8,
          padding: 12,
          marginBottom: 8,
        }}
      >
        <SectionHeader
          title="UI-direct fetch"
          subtitle="Same queryKey, same cache entry. staleTimeOverride at the call site — no hook changes needed."
        />
        <SpotPricesRow label="Portfolio view" note="staleTime: 30s (default)" />
        <SpotPricesRow
          label="Swap screen"
          staleTimeOverride={5_000}
          note="staleTime: 5s (call-site override)"
        />
      </div>

      {/* Controller-driven sync via BaseDataService */}
      <div
        style={{
          background: '#f0f7ff',
          borderRadius: 8,
          padding: 12,
          marginBottom: 8,
        }}
      >
        <SectionHeader
          title="Controller-driven sync (currency rates)"
          subtitle="CurrencyRateDataService extends BaseDataService. Subscribes to CurrencyRateController:stateChange → fetchQuery → auto-publishes cacheUpdate → hydrate(). isFetching stays false."
        />
        <CurrencyRatesRow />
      </div>

      <p style={{ fontSize: 10, color: '#999', margin: 0 }}>
        Fetch ownership is decoupled from cache policy — staleTimeOverride at
        the call site works because the hook exposes full query options.
      </p>
    </div>
  );
}
