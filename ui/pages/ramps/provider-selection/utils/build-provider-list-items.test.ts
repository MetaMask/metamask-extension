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
  it('separates unsupported assets when quotes are not displayed', () => {
    const items = buildProviderListItems({
      providers: [transak, unsupported, moonpay],
      quotes: null,
      quotesLoading: false,
      displayQuotes: false,
      selectedTokenAssetId: 'eip155:1/slip44:60',
    });

    expect(items).toEqual([
      { type: 'provider', provider: transak },
      { type: 'provider', provider: moonpay },
      { type: 'separator' },
      { type: 'provider', provider: unsupported },
    ]);
  });

  it('sorts providers with quotes first using reliability order', () => {
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
      selectedTokenAssetId: 'eip155:1/slip44:60',
    });

    expect(items).toEqual([
      { type: 'provider', provider: transak },
      { type: 'provider', provider: moonpay },
      { type: 'separator' },
      { type: 'provider', provider: unsupported },
    ]);
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
    ).toBe('rampsPreviouslyUsed');
  });

  it('returns most reliable then best rate', () => {
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
    ).toBe('rampsMostReliable');

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
    ).toBe('rampsBestRate');
  });
});
