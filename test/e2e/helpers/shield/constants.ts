export const BASE_SUBSCRIPTION_API_URL =
  'https://subscription.dev-api.cx.metamask.io/v1';

export const BASE_RULESET_ENGINE_API_URL =
  'https://ruleset-engine.dev-api.cx.metamask.io/v1';

export const BASE_CLAIMS_API_URL = 'https://claims.dev-api.cx.metamask.io';

export const BASE_REWARDS_API_URL = 'https://rewards.uat-api.cx.metamask.io';

export const SUBSCRIPTION_API = {
  PRICING: `${BASE_SUBSCRIPTION_API_URL}/pricing`,
  ELIGIBILITY: `${BASE_SUBSCRIPTION_API_URL}/subscriptions/eligibility`,
  SUBSCRIPTIONS: `${BASE_SUBSCRIPTION_API_URL}/subscriptions`,
  USER_EVENTS: `${BASE_SUBSCRIPTION_API_URL}/user-events`,
  COHORT_ASSIGNMENT: `${BASE_SUBSCRIPTION_API_URL}/cohorts/assign`,
  CREATE_SUBSCRIPTION_BY_CARD: `${BASE_SUBSCRIPTION_API_URL}/subscriptions/card`,
  CREATE_SUBSCRIPTION_BY_CRYPTO: `${BASE_SUBSCRIPTION_API_URL}/subscriptions/crypto`,
  CRYPTO_APPROVAL_AMOUNT: `${BASE_SUBSCRIPTION_API_URL}/subscriptions/crypto/approval-amount`,
  CHECKOUT_SESSION: `${BASE_SUBSCRIPTION_API_URL}/pay/cs_test_123456789`,
  CANCEL_SUBSCRIPTION: `${BASE_SUBSCRIPTION_API_URL}/subscriptions/cancel`,
  UNCANCEL_SUBSCRIPTION: `${BASE_SUBSCRIPTION_API_URL}/subscriptions/uncancel`,
};

export const CLAIMS_API = {
  CONFIGURATIONS: `${BASE_CLAIMS_API_URL}/configurations`,
  CLAIMS: `${BASE_CLAIMS_API_URL}/claims`,
  SIGNATURE: `${BASE_CLAIMS_API_URL}/signature/generateMessage`,
};

export const RULESET_ENGINE_API = {
  TRANSACTION_COVERAGE_INIT: `${BASE_RULESET_ENGINE_API_URL}/transaction/coverage/init`,
  TRANSACTION_COVERAGE_RESULT: `${BASE_RULESET_ENGINE_API_URL}/transaction/coverage/result`,
  SIGNATURE_COVERAGE_INIT: `${BASE_RULESET_ENGINE_API_URL}/signature/coverage/init`,
  SIGNATURE_COVERAGE_RESULT: `${BASE_RULESET_ENGINE_API_URL}/signature/coverage/result`,
};

export const REWARDS_API = {
  POINTS_ESTIMATION: `${BASE_REWARDS_API_URL}/points-estimation`,
  SEASONS_STATUS: `${BASE_REWARDS_API_URL}/public/seasons/status`,
  SEASON_METADATA: `${BASE_REWARDS_API_URL}/public/seasons`,
};

// Mock response for rewards points estimation
export const MOCK_REWARDS_POINTS_ESTIMATION_RESPONSE = {
  pointsEstimate: 100,
  bonusBips: 0,
};

// Mock response for rewards seasons status - provides a valid current season
export const MOCK_REWARDS_SEASONS_STATUS_RESPONSE = {
  current: {
    id: 'mock-season-1',
    startDate: '2025-01-01T00:00:00Z',
    endDate: '2025-12-31T23:59:59Z',
  },
  next: null,
};

// Mock response for rewards season metadata
export const MOCK_REWARDS_SEASON_METADATA_RESPONSE = {
  id: 'mock-season-1',
  name: 'Mock Season',
  startDate: '2025-01-01T00:00:00Z',
  endDate: '2025-12-31T23:59:59Z',
  tiers: [],
};

export const BASE_SHIELD_SUBSCRIPTION_CARD = {
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

export const BASE_SHIELD_SUBSCRIPTION_CRYPTO_MONTHLY = {
  ...BASE_SHIELD_SUBSCRIPTION_CRYPTO,
  id: 'test_subscription_id_crypto_monthly',
  products: [
    {
      name: 'shield',
      unitAmount: 800,
      unitDecimals: 2,
      currency: 'usd',
    },
  ],
  interval: 'month',
  currentPeriodEnd: '2025-11-20T02:43:29.000Z',
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

const MOCK_CLAIM_ID_1 = 'test_claim_id_00001';
const MOCK_CLAIM_ID_2 = 'test_claim_id_00002';
const MOCK_CLAIM_ID_3 = 'test_claim_id_00003';

export const SUBMIT_CLAIMS_RESPONSE = {
  status: 'success',
  message: 'Claim submission received',
  claimId: MOCK_CLAIM_ID_2,
};

export const MOCK_COHORT_ASSIGNMENT_RESPONSE = {
  cohort: 'wallet_home',
  expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
};

export const MOCK_CLAIMS_CONFIGURATION_RESPONSE = {
  networks: [1, 5],
  validSubmissionWindowDays: 21,
};

export const MOCK_CLAIM_1 = {
  id: MOCK_CLAIM_ID_1,
  shortId: '00001',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  chainId: '1',
  email: 'e2e@metamask.io',
  impactedWalletAddress: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
  impactedTxHash:
    '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  reimbursementWalletAddress: '0x88069b650422308bf8b472beaf790189f3f28309',
  description: 'I got scammed. Please help me get my money back. T_T @_@',
  attachments: [],
  intercomId: `intercom_${MOCK_CLAIM_ID_1}`,
  status: 'created',
};

export const MOCK_CLAIM_2 = {
  id: MOCK_CLAIM_ID_2,
  shortId: '00002',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  chainId: '1',
  email: 'e2e@metamask.io',
  impactedWalletAddress: '0x5cfe73b6021e818b776b421b1c4db2474086a7e2',
  impactedTxHash:
    '0x55da3eaee9bbefd762a33413b764ee2c025ff4a2cc0a49a05896ceb24c95712f',
  reimbursementWalletAddress: '0x88069b650422308bf8b472beaf790189f3f28309',
  description: 'I got scammed. Please help me get my money back. T_T @_@',
  attachments: [
    {
      originalname: 'test-document.pdf',
      publicUrl: 'https://mock-storage-url.com/claims/test-document.pdf',
      contentType: 'application/pdf',
    },
  ],
  intercomId: `intercom_${MOCK_CLAIM_ID_2}`,
  status: 'created',
};

export const MOCK_CLAIMS_RESPONSE = [MOCK_CLAIM_1];

// Mock claim with approved status for history tab
export const MOCK_CLAIM_APPROVED = {
  ...MOCK_CLAIM_1,
  id: 'test_claim_id_approved',
  shortId: '00003',
  status: 'approved',
  intercomId: 'intercom_test_claim_id_approved',
};

// Mock claim with rejected status for history tab
export const MOCK_CLAIM_REJECTED = {
  ...MOCK_CLAIM_2,
  id: 'test_claim_id_rejected',
  shortId: '00004',
  status: 'rejected',
  intercomId: 'intercom_test_claim_id_rejected',
};

// Mock claim 3 with created status (pending)
export const MOCK_CLAIM_3 = {
  id: MOCK_CLAIM_ID_3,
  shortId: '00005',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  chainId: '1',
  email: 'e2e@metamask.io',
  impactedWalletAddress: '0x5cfe73b6021e818b776b421b1c4db2474086a7e3',
  impactedTxHash:
    '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
  reimbursementWalletAddress: '0x88069b650422308bf8b472beaf790189f3f28309',
  description: 'I got scammed. Please help me get my money back. T_T @_@',
  attachments: [],
  intercomId: `intercom_${MOCK_CLAIM_ID_3}`,
  status: 'created',
};

// Mock claims response with 3 pending claims (maximum limit)
export const MOCK_CLAIMS_3_PENDING = [
  MOCK_CLAIM_1, // pending (created status)
  MOCK_CLAIM_2, // pending (created status)
  MOCK_CLAIM_3, // pending (created status)
];

// Mock claims response with pending, approved, and rejected claims
export const MOCK_CLAIMS_WITH_HISTORY = [
  MOCK_CLAIM_1, // pending (created status)
  MOCK_CLAIM_APPROVED, // completed
  MOCK_CLAIM_REJECTED, // rejected
];

export const MOCK_CLAIM_GENERATE_MESSAGE_RESPONSE = {
  message:
    'metamask.io wants you to sign in with your Ethereum account:\n0x88069b650422308bf8b472bEaF790189f3f28309\n\nSign in to MetaMask Shield Claims API\n\nURI: https://metamask.io\nVersion: 1\nChain ID: 1\nNonce: B4Y8k8lGdMml0nrqk\nIssued At: 2025-11-06T16:38:08.073Z\nExpiration Time: 2025-11-06T17:38:08.073Z',
  nonce: 'B4Y8k8lGdMml0nrqk',
};
