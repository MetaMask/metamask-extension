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

const baseArgs = {
  provider,
  fiatCurrency: 'USD',
  paymentMethodId: 'debit-credit-card',
  currency: 'USD',
  formatCurrency,
  t,
};

describe('getProviderLimitMessage', () => {
  it('returns min purchase message when amount is below limit', () => {
    expect(getProviderLimitMessage({ ...baseArgs, amount: 10 })).toBe(
      'rampsMinPurchaseLimit:USD 50',
    );
  });

  it('returns max purchase message when amount is above limit', () => {
    expect(getProviderLimitMessage({ ...baseArgs, amount: 5000 })).toBe(
      'rampsMaxPurchaseLimit:USD 2000',
    );
  });

  it('returns null when amount is within limits', () => {
    expect(getProviderLimitMessage({ ...baseArgs, amount: 100 })).toBeNull();
  });

  it('returns null when amount equals inclusive bounds', () => {
    expect(getProviderLimitMessage({ ...baseArgs, amount: 50 })).toBeNull();
    expect(getProviderLimitMessage({ ...baseArgs, amount: 2000 })).toBeNull();
  });

  it('returns null when provider has no structured limits', () => {
    expect(
      getProviderLimitMessage({
        ...baseArgs,
        provider: { id: '/providers/x', name: 'X' } as unknown as Provider,
        amount: 100,
      }),
    ).toBeNull();
  });

  it('returns null when amount is not positive', () => {
    expect(getProviderLimitMessage({ ...baseArgs, amount: 0 })).toBeNull();
  });
});
