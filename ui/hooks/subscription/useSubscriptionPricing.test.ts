import {
  PRODUCT_TYPES,
  PAYMENT_TYPES,
  RECURRING_INTERVALS,
  PricingResponse,
  ProductType,
  PaymentType,
} from '@metamask/subscription-controller';
import {
  TransactionMeta,
  TransactionStatus,
} from '@metamask/transaction-controller';
import { renderHookWithProvider } from '../../../test/lib/render-helpers';
import baseMockState from '../../../test/data/mock-state.json';
import {
  useSubscriptionPricing,
  useSubscriptionProductPlans,
  useSubscriptionPaymentMethods,
  useShieldSubscriptionPricingFromTokenApproval,
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
        },
        {
          interval: RECURRING_INTERVALS.year,
          unitAmount: 100_000_000,
          unitDecimals: 6,
          currency: 'usd',
          trialPeriodDays: 7,
          minBillingCycles: 1,
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

  describe('useShieldSubscriptionPricingFromTokenApproval', () => {
    const mockTransactionMeta: TransactionMeta = {
      id: 'test-tx-id',
      chainId: '0x1',
      networkClientId: 'mainnet',
      status: TransactionStatus.unapproved,
      time: Date.now(),
      txParams: {
        from: '0x1234567890123456789012345678901234567890',
        to: '0x0000000000000000000000000000000000000000',
      },
    };

    it('should return monthly plan when approval amount matches monthly', async () => {
      const { result } = renderHookWithProvider(
        () =>
          useShieldSubscriptionPricingFromTokenApproval({
            transactionMeta: mockTransactionMeta,
            decodedApprovalAmount: '120000000',
          }),
        mockState,
      );

      // Wait for async operation to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(result.current.productPrice).toEqual({
        interval: RECURRING_INTERVALS.month,
        unitAmount: 120000000,
        unitDecimals: 6,
        currency: 'usd',
        trialPeriodDays: 7,
        minBillingCycles: 1,
      });
    });

    it('should return yearly plan when approval amount matches yearly', async () => {
      const { result } = renderHookWithProvider(
        () =>
          useShieldSubscriptionPricingFromTokenApproval({
            transactionMeta: mockTransactionMeta,
            decodedApprovalAmount: '100000000',
          }),
        mockState,
      );

      // Wait for async operation to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(result.current.productPrice).toEqual({
        interval: RECURRING_INTERVALS.year,
        unitAmount: 100000000,
        unitDecimals: 6,
        currency: 'usd',
        trialPeriodDays: 7,
        minBillingCycles: 1,
      });
    });

    it('should return undefined when approval amount does not match any plan', async () => {
      const { result } = renderHookWithProvider(
        () =>
          useShieldSubscriptionPricingFromTokenApproval({
            transactionMeta: mockTransactionMeta,
            decodedApprovalAmount: '99999999',
          }),
        mockState,
      );

      // Wait for async operation to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(result.current.productPrice).toBeUndefined();
    });

    it('should return undefined when transaction meta is not provided', async () => {
      const { result } = renderHookWithProvider(
        () =>
          useShieldSubscriptionPricingFromTokenApproval({
            transactionMeta: undefined,
            decodedApprovalAmount: '120000000',
          }),
        mockState,
      );

      // Wait for async operation to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(result.current.productPrice).toBeUndefined();
    });
  });
});
