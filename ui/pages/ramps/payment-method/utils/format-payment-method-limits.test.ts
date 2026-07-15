import type { Provider } from '@metamask/ramps-controller';
import {
  formatPaymentMethodLimits,
  getProviderBuyLimit,
} from './format-payment-method-limits';

const t = (key: string, substitutions?: string[]) => {
  if (key === 'rampsPaymentMethodLimits') {
    return `${substitutions?.[0]} – ${substitutions?.[1]}`;
  }
  if (key === 'rampsPaymentMethodMinLimit') {
    return `Min ${substitutions?.[0]}`;
  }
  if (key === 'rampsPaymentMethodMaxLimit') {
    return `Max ${substitutions?.[0]}`;
  }
  return key;
};

const formatFiat = (amount: number) => `$${amount}`;

describe('getProviderBuyLimit', () => {
  it('returns the matching fiat/payment-method limit', () => {
    const provider = {
      id: 'transak',
      limits: {
        fiat: {
          usd: {
            'debit-credit-card': {
              minAmount: 25,
              maxAmount: 2000,
              feeFixedRate: 0,
              feeDynamicRate: 0,
            },
          },
        },
      },
    } as Provider;

    expect(
      getProviderBuyLimit(provider, 'USD', 'debit-credit-card'),
    ).toMatchSnapshot();
  });

  it('returns undefined when limits are unavailable', () => {
    expect(
      getProviderBuyLimit(null, 'USD', 'debit-credit-card'),
    ).toBeUndefined();
  });
});

describe('formatPaymentMethodLimits', () => {
  it('matches snapshot for min/max formatting', () => {
    expect({
      both: formatPaymentMethodLimits(
        { minAmount: 25, maxAmount: 2000 },
        formatFiat,
        t,
      ),
      minOnly: formatPaymentMethodLimits(
        { minAmount: 25, maxAmount: Number.NaN },
        formatFiat,
        t,
      ),
      missing: formatPaymentMethodLimits(undefined, formatFiat, t),
    }).toMatchSnapshot();
  });
});
