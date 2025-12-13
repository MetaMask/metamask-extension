import {
  PRODUCT_TYPES,
  PAYMENT_TYPES,
  RECURRING_INTERVALS,
  PricingResponse,
  ProductType,
  PaymentType,
} from '@metamask/subscription-controller';
import { renderHookWithProvider } from '../../../test/lib/render-helpers';
import baseMockState from '../../../test/data/mock-state.json';
import {
  useSubscriptionPricing,
  useSubscriptionProductPlans,
  useSubscriptionPaymentMethods,
} from './useSubscriptionPricing';

const mockSubscriptionPricing: PricingResponse = {
  products: [
    {
      name: PRODUCT_TYPES.SHIELD,
      prices: [
        {
          interval: RECURRING_INTERVALS.month,
          unitAmount: 120_000_000,
          unitDecimals: 6,
          currency: 'usd',
          trialPeriodDays: 7,
          minBillingCycles: 1,
          minBillingCyclesForBalance: 1,
        },
        {
          interval: RECURRING_INTERVALS.year,
          unitAmount: 100_000_000,
          unitDecimals: 6,
          currency: 'usd',
          trialPeriodDays: 7,
          minBillingCycles: 1,
          minBillingCyclesForBalance: 1,
        },
      ],
    },
  ],
  paymentMethods: [
    {
      type: PAYMENT_TYPES.byCrypto,
      chains: [
        {
          chainId: '0x1',
          paymentAddress: '0x1234567890123456789012345678901234567890',
          tokens: [
            {
              address: '0x0000000000000000000000000000000000000000',
              symbol: 'usdc',
              decimals: 6,
              conversionRate: { usd: '1' },
            },
          ],
        },
      ],
    },
  ],
};

// Mock the actions
jest.mock('../../store/actions', () => ({
  ...jest.requireActual('../../store/actions'),
  getSubscriptionCryptoApprovalAmount: jest
    .fn()
    .mockImplementation((params) => {
      if (params.interval === 'month') {
        return Promise.resolve({
          approveAmount: '120000000',
          chainId: params.chainId,
          paymentAddress: '0x1234567890123456789012345678901234567890',
          paymentTokenAddress: params.paymentTokenAddress,
        });
      }
      if (params.interval === 'year') {
        return Promise.resolve({
          approveAmount: '100000000',
          chainId: params.chainId,
          paymentAddress: '0x1234567890123456789012345678901234567890',
          paymentTokenAddress: params.paymentTokenAddress,
        });
      }
      return Promise.resolve({
        approveAmount: '0',
        chainId: params.chainId,
        paymentAddress: '0x1234567890123456789012345678901234567890',
        paymentTokenAddress: params.paymentTokenAddress,
      });
    }),
}));

const mockState = {
  ...baseMockState,
  metamask: {
    ...baseMockState.metamask,
    pricing: mockSubscriptionPricing,
  },
};

describe('useSubscriptionPricing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useSubscriptionPricing', () => {
    it('should fetch subscription pricing and return loading state initially', async () => {
      const { result } = renderHookWithProvider(
        () => useSubscriptionPricing(),
        mockState,
      );

      // Initially should be loading
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBeUndefined();
      expect(result.current.subscriptionPricing).toBeDefined();
      expect(result.current.selectedTokenPrice).toBeUndefined();
    });
  });

  describe('useSubscriptionProductPlans', () => {
    it('should return product plans for a given product type', () => {
      const { result } = renderHookWithProvider(
        () =>
          useSubscriptionProductPlans(
            PRODUCT_TYPES.SHIELD,
            mockState.metamask.pricing,
          ),
        mockState,
      );

      expect(result.current).toEqual(
        mockSubscriptionPricing.products.find(
          (product) => product.name === PRODUCT_TYPES.SHIELD,
        )?.prices,
      );
    });

    it('should return undefined when product type is not found', () => {
      const { result } = renderHookWithProvider(
        () =>
          useSubscriptionProductPlans(
            'unknown-product' as ProductType,
            mockState.metamask.pricing,
          ),
        mockState,
      );

      expect(result.current).toBeUndefined();
    });
  });

  describe('useSubscriptionPaymentMethods', () => {
    it('should return payment method for a given payment type', () => {
      const { result } = renderHookWithProvider(
        () =>
          useSubscriptionPaymentMethods(
            PAYMENT_TYPES.byCrypto,
            mockState.metamask.pricing,
          ),
        mockState,
      );

      expect(result.current).toEqual(
        mockSubscriptionPricing.paymentMethods.find(
          (paymentMethod) => paymentMethod.type === PAYMENT_TYPES.byCrypto,
        ),
      );
    });

    it('should return undefined when payment type is not found', () => {
      const { result } = renderHookWithProvider(
        () =>
          useSubscriptionPaymentMethods(
            'unknown-payment-type' as PaymentType,
            mockState.metamask.pricing,
          ),
        mockState,
      );

      expect(result.current).toBeUndefined();
    });
  });
});
