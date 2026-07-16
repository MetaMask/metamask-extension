import type { Provider } from '@metamask/ramps-controller';
import { getProviderLimitMessage } from './get-provider-limit-message';
import { getProviderBuyLimit } from './format-payment-method-limits';

jest.mock('./format-payment-method-limits', () => ({
  ...jest.requireActual('./format-payment-method-limits'),
  getProviderBuyLimit: jest.fn(),
}));

const mockGetProviderBuyLimit = jest.mocked(getProviderBuyLimit);

const mockProvider = { id: '/providers/test', name: 'Test' } as Provider;

const formatCurrency = jest.fn(
  (value: number, currency: string) => `${currency} ${value}`,
);

const t = jest.fn((key: string, args?: string[]) => {
  if (key === 'rampsMinPurchaseLimit') {
    return `Minimum purchase is ${args?.[0]}`;
  }
  if (key === 'rampsMaxPurchaseLimit') {
    return `Maximum purchase is ${args?.[0]}`;
  }
  return key;
});

const baseArgs = {
  provider: mockProvider,
  fiatCurrency: 'usd',
  paymentMethodId: '/payments/card',
  currency: 'USD',
  formatCurrency: formatCurrency as never,
  t: t as never,
};

describe('getProviderLimitMessage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetProviderBuyLimit.mockReturnValue(undefined);
  });

  it('matches snapshot for structured min and max messages', () => {
    mockGetProviderBuyLimit.mockReturnValue({
      minAmount: 10,
      maxAmount: 1000,
    });

    expect({
      belowMin: getProviderLimitMessage({ ...baseArgs, amount: 5 }),
      aboveMax: getProviderLimitMessage({ ...baseArgs, amount: 2000 }),
      inRange: getProviderLimitMessage({ ...baseArgs, amount: 50 }),
    }).toMatchSnapshot();
  });

  it('matches snapshot falling back to backend limit error', () => {
    expect(
      getProviderLimitMessage({
        ...baseArgs,
        amount: 50,
        backendError: 'Minimum purchase is 99 EUR',
      }),
    ).toMatchSnapshot();
  });

  it('matches snapshot for non-limit backend errors', () => {
    expect(
      getProviderLimitMessage({
        ...baseArgs,
        amount: 50,
        backendError: '[object Object]',
      }),
    ).toMatchSnapshot();
  });
});
