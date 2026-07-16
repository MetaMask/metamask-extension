import type { Provider } from '@metamask/ramps-controller';
import { getProviderLimitMessage } from './getProviderLimitMessage';

const t = (key: string, args?: string[]) =>
  args?.length ? `${key}:${args.join(',')}` : key;

const formatCurrency = (amount: number, currency: string) =>
  `${currency} ${amount}`;

const provider = {
  id: '/providers/transak',
  name: 'Transak',
  limits: {
    fiat: {
      usd: {
        'debit-credit-card': {
          minAmount: 50,
          maxAmount: 2000,
          feeFixedRate: 0,
          feeDynamicRate: 0,
        },
      },
    },
  },
} as unknown as Provider;

describe('getProviderLimitMessage', () => {
  it('returns min purchase message when amount is below limit', () => {
    expect(
      getProviderLimitMessage({
        provider,
        fiatCurrency: 'USD',
        paymentMethodId: 'debit-credit-card',
        amount: 10,
        currency: 'USD',
        formatCurrency,
        t,
      }),
    ).toBe('rampsMinPurchaseLimit:USD 50');
  });

  it('returns max purchase message when amount is above limit', () => {
    expect(
      getProviderLimitMessage({
        provider,
        fiatCurrency: 'USD',
        paymentMethodId: 'debit-credit-card',
        amount: 5000,
        currency: 'USD',
        formatCurrency,
        t,
      }),
    ).toBe('rampsMaxPurchaseLimit:USD 2000');
  });

  it('falls back to backend limit errors', () => {
    expect(
      getProviderLimitMessage({
        provider: { id: '/providers/x', name: 'X' } as unknown as Provider,
        fiatCurrency: 'USD',
        paymentMethodId: 'debit-credit-card',
        amount: 100,
        currency: 'USD',
        formatCurrency,
        t,
        backendError: 'Minimum purchase is 12 EUR',
      }),
    ).toBe('Minimum purchase is 12 EUR');
  });

  it('returns null for non-limit situations', () => {
    expect(
      getProviderLimitMessage({
        provider,
        fiatCurrency: 'USD',
        paymentMethodId: 'debit-credit-card',
        amount: 100,
        currency: 'USD',
        formatCurrency,
        t,
        backendError: 'Internal error',
      }),
    ).toBeNull();
  });
});
