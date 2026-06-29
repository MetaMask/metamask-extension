import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import useRampsController from '../../hooks/ramps/useRampsController';
import type { Quote, QuotesResponse } from '../../hooks/ramps/types';

/**
 * MVP money-movement (buy crypto) page.
 *
 * Built against the stubbed `useRampsController` hook so the UI track can
 * progress independently of the data-layer wiring (PRs #43962 / #43963). When
 * the real hook lands, this page keeps working unchanged — only the hook
 * implementation behind it changes.
 */

// Placeholder destination address — the real wallet address is wired in once
// the data layer (account selectors) is connected.
const STUB_WALLET_ADDRESS = '0x0000000000000000000000000000000000000000';

const styles: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: 420,
    margin: '0 auto',
    padding: 24,
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 22, fontWeight: 500, margin: 0 },
  back: {
    fontSize: 14,
    textDecoration: 'none',
    color: 'var(--color-primary-default)',
  },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: {
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--color-text-alternative)',
  },
  control: {
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid var(--color-border-default)',
    background: 'var(--color-background-default)',
    color: 'var(--color-text-default)',
    fontSize: 16,
  },
  primaryButton: {
    padding: '12px 16px',
    borderRadius: 8,
    border: 'none',
    background: 'var(--color-primary-default)',
    color: 'var(--color-primary-inverse)',
    fontSize: 16,
    fontWeight: 500,
    cursor: 'pointer',
  },
  card: {
    border: '1px solid var(--color-border-muted)',
    borderRadius: 12,
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  quoteRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    fontSize: 11,
    fontWeight: 500,
    padding: '2px 8px',
    borderRadius: 999,
    background: 'var(--color-success-muted)',
    color: 'var(--color-success-default)',
  },
  buyButton: {
    padding: '8px 14px',
    borderRadius: 8,
    border: '1px solid var(--color-primary-default)',
    background: 'transparent',
    color: 'var(--color-primary-default)',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
  },
  muted: { fontSize: 13, color: 'var(--color-text-alternative)' },
  sectionTitle: { fontSize: 16, fontWeight: 500, margin: '4px 0' },
};

function RampsPage() {
  const ramps = useRampsController();

  const tokens = ramps.tokens?.topTokens ?? [];
  const [assetId, setAssetId] = useState(ramps.selectedToken?.assetId ?? '');
  const [amount, setAmount] = useState('100');
  const [paymentMethodId, setPaymentMethodId] = useState(
    ramps.selectedPaymentMethod?.id ?? '',
  );
  const [quotes, setQuotes] = useState<QuotesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const selectedSymbol =
    tokens.find((token) => token.assetId === assetId)?.symbol ?? 'crypto';

  const handleGetQuotes = async () => {
    setLoading(true);
    setError(null);
    setStatus(null);
    try {
      const result = await ramps.getQuotes({
        amount: Number(amount) || 0,
        assetId,
        walletAddress: STUB_WALLET_ADDRESS,
        region: ramps.userRegion?.regionCode,
        paymentMethods: paymentMethodId ? [paymentMethodId] : undefined,
      });
      setQuotes(result);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : 'Failed to get quotes',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async (quote: Quote) => {
    setStatus(null);
    try {
      const widget = await ramps.getBuyWidgetData(quote);
      if (widget?.url) {
        global.platform.openTab({ url: widget.url });
        setStatus(`Opening ${quote.provider} checkout…`);
      } else {
        setStatus('No checkout URL returned for this quote.');
      }
    } catch (caught) {
      setStatus(
        caught instanceof Error ? caught.message : 'Failed to start purchase',
      );
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Buy crypto</h1>
        <Link to={DEFAULT_ROUTE} style={styles.back}>
          Close
        </Link>
      </div>

      <div style={styles.muted}>
        Region: {ramps.userRegion?.country.name ?? 'Unknown'} (
        {ramps.userRegion?.regionCode ?? '—'})
      </div>

      <div style={styles.field}>
        <label style={styles.label} htmlFor="ramps-token">
          Token
        </label>
        <select
          id="ramps-token"
          style={styles.control}
          value={assetId}
          onChange={(event) => setAssetId(event.target.value)}
        >
          {tokens.map((token) => (
            <option key={token.assetId} value={token.assetId}>
              {token.name} ({token.symbol})
            </option>
          ))}
        </select>
      </div>

      <div style={styles.field}>
        <label style={styles.label} htmlFor="ramps-amount">
          Amount ({ramps.userRegion?.country.currency ?? 'USD'})
        </label>
        <input
          id="ramps-amount"
          style={styles.control}
          type="number"
          inputMode="decimal"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
        />
      </div>

      <div style={styles.field}>
        <label style={styles.label} htmlFor="ramps-payment">
          Pay with
        </label>
        <select
          id="ramps-payment"
          style={styles.control}
          value={paymentMethodId}
          onChange={(event) => setPaymentMethodId(event.target.value)}
        >
          {ramps.paymentMethods.map((method) => (
            <option key={method.id} value={method.id}>
              {method.name}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        style={styles.primaryButton}
        onClick={handleGetQuotes}
        disabled={loading}
      >
        {loading ? 'Getting quotes…' : 'Get quotes'}
      </button>

      {error ? (
        <div style={{ ...styles.muted, color: 'var(--color-error-default)' }}>
          {error}
        </div>
      ) : null}
      {status ? <div style={styles.muted}>{status}</div> : null}

      {quotes ? (
        <div style={styles.field}>
          <h2 style={styles.sectionTitle}>Quotes</h2>
          {quotes.success.length === 0 ? (
            <div style={styles.muted}>No quotes available.</div>
          ) : (
            quotes.success.map((quote) => {
              const isBestRate = quote.metadata?.tags?.isBestRate ?? false;
              return (
                <div key={quote.provider} style={styles.card}>
                  <div style={styles.quoteRow}>
                    <strong>{quote.provider.replace('/providers/', '')}</strong>
                    {isBestRate ? (
                      <span style={styles.badge}>Best rate</span>
                    ) : null}
                  </div>
                  <div style={styles.muted}>
                    You get ≈ {String(quote.quote.amountOut)} {selectedSymbol}
                  </div>
                  <div style={styles.muted}>
                    Total fees: {String(quote.quote.totalFees ?? '—')}
                  </div>
                  <div style={styles.quoteRow}>
                    <span style={styles.muted}>
                      Pay {amount} {ramps.userRegion?.country.currency ?? 'USD'}
                    </span>
                    <button
                      type="button"
                      style={styles.buyButton}
                      onClick={() => handleBuy(quote)}
                    >
                      Buy
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : null}

      {ramps.orders.length > 0 ? (
        <div style={styles.field}>
          <h2 style={styles.sectionTitle}>Recent orders</h2>
          {ramps.orders.map((order) => (
            <div key={order.providerOrderId} style={styles.card}>
              <div style={styles.quoteRow}>
                <strong>{order.cryptoCurrency?.symbol ?? 'Crypto'}</strong>
                <span style={styles.muted}>{order.status}</span>
              </div>
              <div style={styles.muted}>
                {String(order.cryptoAmount)} {order.cryptoCurrency?.symbol} for{' '}
                {order.fiatAmount} {order.fiatCurrency?.symbol ?? ''}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default RampsPage;
