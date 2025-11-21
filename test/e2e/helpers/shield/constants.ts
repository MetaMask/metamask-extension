export const BASE_SHIELD_SUBSCRIPTION = {
  id: 'test_subscription_id',
  status: 'trialing',
  products: [
    {
      name: 'shield',
      unitAmount: 8000,
      unitDecimals: 2,
      currency: 'usd',
    },
  ],
  interval: 'year',
  currentPeriodStart: '2025-10-20T02:43:29.000Z',
  currentPeriodEnd: '2025-11-03T02:43:29.000Z',
  trialStart: '2025-10-20T02:43:29.000Z',
  trialEnd: '2025-11-03T02:43:29.000Z',
  trialPeriodDays: 14,
  paymentMethod: {
    type: 'card',
    card: { brand: 'visa', displayBrand: 'visa', last4: '4242' },
  },
  isEligibleForSupport: true,
};

export const BASE_SHIELD_SUBSCRIPTION_CRYPTO = {
  id: 'test_subscription_id_crypto',
  status: 'trialing',
  products: [
    {
      name: 'shield',
      unitAmount: 8000,
      unitDecimals: 2,
      currency: 'usd',
    },
  ],
  interval: 'year',
  currentPeriodStart: '2025-10-20T02:43:29.000Z',
  currentPeriodEnd: '2025-11-03T02:43:29.000Z',
  trialStart: '2025-10-20T02:43:29.000Z',
  trialEnd: '2025-11-03T02:43:29.000Z',
  trialPeriodDays: 14,
  paymentMethod: {
    type: 'crypto',
    crypto: {
      chainId: '0x1',
      tokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      tokenSymbol: 'USDC',
      payerAddress: '0x5CfE73b6021E818B776b421B1c4Db2474086a7e1',
    },
  },
  isEligibleForSupport: true,
};

export const MOCK_CHECKOUT_SESSION_URL =
  'https://subscription.dev-api.cx.metamask.io/pay/cs_test_123456789';

export const SHIELD_PRICING_DATA = {
  products: [
    {
      name: 'shield',
      prices: [
        {
          interval: 'month',
          unitAmount: 800,
          unitDecimals: 2,
          currency: 'usd',
          trialPeriodDays: 14,
          minBillingCycles: 12,
        },
        {
          interval: 'year',
          unitAmount: 8000,
          unitDecimals: 2,
          currency: 'usd',
          trialPeriodDays: 14,
          minBillingCycles: 1,
        },
      ],
    },
  ],
  paymentMethods: [
    {
      type: 'card',
    },
    {
      type: 'crypto',
      chains: [
        {
          chainId: '0x1',
          paymentAddress: '0x1234567890123456789012345678901234567890',
          tokens: [
            {
              address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
              symbol: 'USDC',
              decimals: 6,
              conversionRate: { usd: '1' },
            },
            {
              address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
              symbol: 'USDT',
              decimals: 6,
              conversionRate: { usd: '1' },
            },
          ],
        },
      ],
    },
  ],
};

export const SHIELD_ELIGIBILITY_DATA = [
  {
    canSubscribe: true,
    canViewEntryModal: true,
    minBalanceUSD: 1000,
    product: 'shield',
  },
];

export const SHIELD_USER_EVENTS_RESPONSE = {
  status: 'success',
};

export const SHIELD_CLAIMS_RESPONSE = {
  status: 'success',
  message: 'Claim submitted successfully',
  claimId: 'test_claim_id_12345',
};
