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
};

export const MOCK_CHECKOUT_SESSION_URL =
  'https://checkout.stripe.com/pay/cs_test_123456789';

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
