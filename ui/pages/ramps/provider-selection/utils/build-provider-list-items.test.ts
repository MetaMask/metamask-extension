import type { Provider, QuotesResponse } from '@metamask/ramps-controller';
import {
  buildProviderListItems,
  findProviderQuote,
  getProviderTag,
} from './build-provider-list-items';

const transak = {
  id: '/providers/transak',
  name: 'Transak',
  supportedCryptoCurrencies: { 'eip155:1/slip44:60': true },
} as unknown as Provider;

const moonpay = {
  id: '/providers/moonpay',
  name: 'MoonPay',
  supportedCryptoCurrencies: { 'eip155:1/slip44:60': true },
} as unknown as Provider;

const unsupported = {
  id: '/providers/other',
  name: 'Other',
  supportedCryptoCurrencies: {},
} as unknown as Provider;

const t = (key: string) => key;

describe('buildProviderListItems', () => {
  it('keeps provider order while quotes are unavailable', () => {
    const items = buildProviderListItems({
      providers: [transak, unsupported, moonpay],
      quotes: null,
      quotesLoading: false,
      displayQuotes: false,
    });

    expect(items).toEqual([
      { type: 'provider', provider: transak },
      { type: 'provider', provider: unsupported },
      { type: 'provider', provider: moonpay },
    ]);
  });

  it('sorts providers with quotes and hides providers without quotes', () => {
    const quotes: QuotesResponse = {
      success: [
        {
          provider: moonpay.id,
          quote: { amountIn: 100, amountOut: '0.04', paymentMethod: 'card' },
        },
        {
          provider: transak.id,
          quote: { amountIn: 100, amountOut: '0.05', paymentMethod: 'card' },
        },
      ],
      sorted: [{ sortBy: 'reliability', ids: [transak.id, moonpay.id] }],
      error: [],
      customActions: [],
    };

    const items = buildProviderListItems({
      providers: [moonpay, transak, unsupported],
      quotes,
      quotesLoading: false,
      displayQuotes: true,
    });

    expect(items).toEqual([
      { type: 'provider', provider: transak },
      { type: 'provider', provider: moonpay },
    ]);
  });

  it('returns no providers when no quotes succeed', () => {
    const items = buildProviderListItems({
      providers: [transak, moonpay],
      quotes: {
        success: [],
        sorted: [],
        error: [
          { provider: transak.id, error: 'Quote unavailable' },
          { provider: moonpay.id, error: 'Quote unavailable' },
        ],
        customActions: [],
      },
      quotesLoading: false,
      displayQuotes: true,
    });

    expect(items).toEqual([]);
  });
});

describe('findProviderQuote', () => {
  it('prefers quotes matching the selected payment method', () => {
    const quotes: QuotesResponse = {
      success: [
        {
          provider: transak.id,
          quote: {
            amountIn: 100,
            amountOut: '0.04',
            paymentMethod: 'bank-transfer',
          },
        },
        {
          provider: transak.id,
          quote: {
            amountIn: 100,
            amountOut: '0.05',
            paymentMethod: 'debit-credit-card',
          },
        },
      ],
      sorted: [],
      error: [],
      customActions: [],
    };

    expect(
      findProviderQuote(quotes, transak.id, 'debit-credit-card')?.quote
        ?.amountOut,
    ).toBe('0.05');
  });
});

describe('getProviderTag', () => {
  it('returns previously used before quote tags', () => {
    expect(
      getProviderTag(
        transak.id,
        {
          provider: transak.id,
          quote: { amountIn: 1, amountOut: '1', paymentMethod: 'card' },
          metadata: { tags: { isBestRate: true, isMostReliable: true } },
        },
        [transak.id],
        t,
      ),
    ).toStrictEqual({ label: 'rampsPreviouslyUsed', severity: 'info' });
  });

  it('returns most reliable then best rate, each with its own severity', () => {
    expect(
      getProviderTag(
        transak.id,
        {
          provider: transak.id,
          quote: { amountIn: 1, amountOut: '1', paymentMethod: 'card' },
          metadata: { tags: { isMostReliable: true } },
        },
        [],
        t,
      ),
    ).toStrictEqual({ label: 'rampsMostReliable', severity: 'neutral' });

    expect(
      getProviderTag(
        transak.id,
        {
          provider: transak.id,
          quote: { amountIn: 1, amountOut: '1', paymentMethod: 'card' },
          metadata: { tags: { isBestRate: true } },
        },
        [],
        t,
      ),
    ).toStrictEqual({ label: 'rampsBestRate', severity: 'success' });
  });
});
