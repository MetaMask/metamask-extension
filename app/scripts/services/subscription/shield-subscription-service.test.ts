import {
  MOCK_ANY_NAMESPACE,
  Messenger,
  MessengerActions,
  MessengerEvents,
  MockAnyNamespace,
} from '@metamask/messenger';
import {
  CANCEL_TYPES,
  COHORT_NAMES,
  PAYMENT_TYPES,
  PRODUCT_TYPES,
  RECURRING_INTERVALS,
  Subscription,
  SUBSCRIPTION_STATUSES,
  SubscriptionPaymentMethod,
} from '@metamask/subscription-controller';
import browser from 'webextension-polyfill';
import { TransactionType } from '@metamask/transaction-controller';
import ExtensionPlatform from '../../platforms/extension';
import { ENVIRONMENT } from '../../../../shared/constants/build';
import { WebAuthenticator } from '../oauth/types';
import { createSwapsMockStore } from '../../../../test/jest';
import getFetchWithTimeout from '../../../../shared/lib/fetch-with-timeout';
import { DAY } from '../../../../shared/constants/time';
import { SHIELD_ERROR } from '../../../../shared/lib/shield';
import { getIsSmartTransaction } from '../../../../shared/lib/selectors';
import { ShieldSubscriptionService } from './shield-subscription-service';
import { ShieldSubscriptionServiceMessenger } from './types';

jest.mock('../../../../shared/lib/selectors', () => ({
  getIsSmartTransaction: jest.fn(),
}));

jest.mock('../../controllers/analytics', () => ({
  createEventBuilder: jest.requireActual('../../controllers/analytics')
    .createEventBuilder,
  trackEvent: jest.fn(),
}));

const { trackEvent: mockTrackEvent } = jest.requireMock(
  '../../controllers/analytics',
) as { trackEvent: jest.Mock };

type Actions = MessengerActions<ShieldSubscriptionServiceMessenger>;

type Events = MessengerEvents<ShieldSubscriptionServiceMessenger>;

type RootMessenger = Messenger<MockAnyNamespace, Actions, Events>;

jest.mock('../../platforms/extension');

jest.mock('../../../../shared/lib/fetch-with-timeout');

const mockGetIsSmartTransaction = jest.mocked(getIsSmartTransaction);

const MAINNET_BASE = {
  name: 'Mainnet',
  group: 'ethereum',
  chainID: 1,
  nativeCurrency: {
    name: 'ETH',
    symbol: 'ETH',
    decimals: 18,
  },
  network: 'ethereum-mainnet',
  explorer: 'https://etherscan.io',
  confirmations: true,
  smartTransactions: true,
  relayTransactions: true,
  hidden: false,
  sendBundle: true,
} as const;

const MOCK_REDIRECT_URI = 'https://mocked-redirect-uri';

const MOCK_ACTIVE_SHIELD_SUBSCRIPTION: Subscription = {
  id: 'sub_123',
  status: SUBSCRIPTION_STATUSES.active,
  products: [
    {
      name: PRODUCT_TYPES.SHIELD,
      currency: 'usd',
      unitAmount: 100,
      unitDecimals: 2,
    },
  ],
  paymentMethod: { type: PAYMENT_TYPES.byCard } as SubscriptionPaymentMethod,
  interval: RECURRING_INTERVALS.month,
  currentPeriodStart: new Date().toISOString(),
  currentPeriodEnd: new Date(Date.now() + 30 * DAY).toISOString(),
  isEligibleForSupport: true,
  cancelType: CANCEL_TYPES.ALLOWED_AT_PERIOD_END,
};

const getRedirectUrlSpy = jest.fn().mockReturnValue(MOCK_REDIRECT_URI);
const mockSubmitSponsorshipIntents = jest.fn();
const mockGetTransactions = jest.fn();
const mockGetPreferencesState = jest.fn();
const mockGetAccountsState = jest.fn();
const mockGetSmartTransactionsState = jest.fn();
const mockCheckoutSessionUrl = 'https://mocked-checkout-session-url';
const mockStartShieldSubscriptionWithCard = jest.fn();
const mockGetSubscriptions = jest.fn();
const mockGetNetworkControllerState = jest.fn();
const mockGetRemoteFeatureFlagState = jest.fn();
const mockGetAppStateControllerState = jest.fn();
const mockGetSubscriptionControllerState = jest.fn();
const mockGetKeyringControllerState = jest.fn();
const mockGetRewardSeasonMetadata = jest.fn();
const mockGetHasAccountOptedIn = jest.fn();
const mockLinkRewards = jest.fn();
const mockSubmitShieldSubscriptionCryptoApproval = jest.fn();
const mockClearLastSelectedPaymentMethod = jest.fn();
const mockSetPendingRedirectRoute = jest.fn();
const mockSetShieldSubscriptionError = jest.fn();
const mockUpdatePaymentMethod = jest.fn();
const mockSetPendingShieldCohort = jest.fn();

const rootMessenger: RootMessenger = new Messenger({
  namespace: MOCK_ANY_NAMESPACE,
});
rootMessenger.registerActionHandler(
  'SubscriptionController:submitSponsorshipIntents',
  mockSubmitSponsorshipIntents,
);
rootMessenger.registerActionHandler(
  'TransactionController:getTransactions',
  mockGetTransactions,
);
rootMessenger.registerActionHandler(
  'PreferencesController:getState',
  mockGetPreferencesState,
);
rootMessenger.registerActionHandler(
  'AccountsController:getState',
  mockGetAccountsState,
);
rootMessenger.registerActionHandler(
  'SmartTransactionsController:getState',
  mockGetSmartTransactionsState,
);
rootMessenger.registerActionHandler(
  'SubscriptionController:startShieldSubscriptionWithCard',
  mockStartShieldSubscriptionWithCard,
);
rootMessenger.registerActionHandler(
  'SubscriptionController:getSubscriptions',
  mockGetSubscriptions,
);
rootMessenger.registerActionHandler(
  'NetworkController:getState',
  mockGetNetworkControllerState,
);
rootMessenger.registerActionHandler(
  'RemoteFeatureFlagController:getState',
  mockGetRemoteFeatureFlagState,
);
rootMessenger.registerActionHandler(
  'AppStateController:getState',
  mockGetAppStateControllerState,
);
rootMessenger.registerActionHandler(
  'SubscriptionController:getState',
  mockGetSubscriptionControllerState,
);
rootMessenger.registerActionHandler(
  'KeyringController:getState',
  mockGetKeyringControllerState,
);
rootMessenger.registerActionHandler(
  'RewardsController:getSeasonMetadata',
  mockGetRewardSeasonMetadata,
);
rootMessenger.registerActionHandler(
  'RewardsController:getHasAccountOptedIn',
  mockGetHasAccountOptedIn,
);
rootMessenger.registerActionHandler(
  'SubscriptionController:linkRewards',
  mockLinkRewards,
);
rootMessenger.registerActionHandler(
  'SubscriptionController:submitShieldSubscriptionCryptoApproval',
  mockSubmitShieldSubscriptionCryptoApproval,
);
rootMessenger.registerActionHandler(
  'SubscriptionController:clearLastSelectedPaymentMethod',
  mockClearLastSelectedPaymentMethod,
);
rootMessenger.registerActionHandler(
  'AppStateController:setPendingRedirectRoute',
  mockSetPendingRedirectRoute,
);
rootMessenger.registerActionHandler(
  'AppStateController:setShieldSubscriptionError',
  mockSetShieldSubscriptionError,
);
rootMessenger.registerActionHandler(
  'SubscriptionController:updatePaymentMethod',
  mockUpdatePaymentMethod,
);
rootMessenger.registerActionHandler(
  'AppStateController:setPendingShieldCohort',
  mockSetPendingShieldCohort,
);

const messenger: ShieldSubscriptionServiceMessenger = new Messenger({
  namespace: 'ShieldSubscriptionService',
  parent: rootMessenger,
});
rootMessenger.delegate({
  messenger,
  actions: [
    'SubscriptionController:startShieldSubscriptionWithCard',
    'SubscriptionController:getSubscriptions',
    'SubscriptionController:submitSponsorshipIntents',
    'SubscriptionController:linkRewards',
    'SubscriptionController:submitShieldSubscriptionCryptoApproval',
    'SubscriptionController:clearLastSelectedPaymentMethod',
    'TransactionController:getTransactions',
    'PreferencesController:getState',
    'AccountsController:getState',
    'SmartTransactionsController:getState',
    'NetworkController:getState',
    'RemoteFeatureFlagController:getState',
    'AppStateController:getState',
    'AppStateController:setPendingRedirectRoute',
    'AppStateController:setShieldSubscriptionError',
    'AppStateController:setPendingShieldCohort',
    'SubscriptionController:updatePaymentMethod',
    'SubscriptionController:getState',
    'KeyringController:getState',
    'RewardsController:getHasAccountOptedIn',
    'RewardsController:getSeasonMetadata',
    'RewardsController:getSeasonStatus',
  ],
});

const mockWebAuthenticator: WebAuthenticator = {
  getRedirectURL: getRedirectUrlSpy,
  launchWebAuthFlow: jest.fn(),
  generateCodeVerifierAndChallenge: jest.fn(),
  generateNonce: jest.fn(),
};
const mockPlatform = new ExtensionPlatform();
const subscriptionService = new ShieldSubscriptionService({
  messenger,
  platform: mockPlatform,
  webAuthenticator: mockWebAuthenticator,
});
// Mock environment variables
const originalEnv = process.env;

describe('ShieldSubscriptionService - startSubscriptionWithCard', () => {
  const MOCK_STATE = createSwapsMockStore().metamask;

  beforeAll(() => {
    process.env.METAMASK_ENVIRONMENT = ENVIRONMENT.TESTING;
  });

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.METAMASK_SHIELD_ENABLED = 'true';
    delete process.env.IN_TEST; // unset IN_TEST environment variable

    mockStartShieldSubscriptionWithCard.mockResolvedValue({
      checkoutSessionUrl: mockCheckoutSessionUrl,
    });
    // Mock getSubscriptions to return active subscription for polling to complete
    mockGetSubscriptions.mockResolvedValue([MOCK_ACTIVE_SHIELD_SUBSCRIPTION]);
    mockGetAppStateControllerState.mockReturnValue({
      defaultSubscriptionPaymentOptions: {
        defaultBillingInterval: RECURRING_INTERVALS.month,
        defaultPaymentType: PAYMENT_TYPES.byCard,
        defaultPaymentCurrency: 'usd',
        defaultPaymentChain: '0x1',
      },
    });
    mockGetSubscriptionControllerState.mockReturnValue({
      lastSelectedPaymentMethod: {
        shield: {
          plan: RECURRING_INTERVALS.year,
          type: PAYMENT_TYPES.byCard,
        },
      },
      trialedProducts: [],
      subscriptions: [],
      lastSubscription: undefined,
    });
    mockGetAccountsState.mockReturnValue({
      internalAccounts: MOCK_STATE.internalAccounts,
    });
    mockGetKeyringControllerState.mockReturnValue({
      keyrings: MOCK_STATE.keyrings,
    });
    mockGetRewardSeasonMetadata.mockResolvedValueOnce({
      startDate: Date.now() - 1000,
      endDate: Date.now() + 1000,
    });
    mockGetHasAccountOptedIn.mockResolvedValueOnce(false);

    jest.spyOn(mockPlatform, 'openTab').mockResolvedValue({
      id: 1,
    } as browser.Tabs.Tab);
    jest
      .spyOn(mockPlatform, 'addTabUpdatedListener')
      .mockImplementation(async (fn) => {
        await new Promise((r) => setTimeout(r, 200));
        await fn(1, {
          url: MOCK_REDIRECT_URI,
        });
      });
    jest
      .spyOn(mockPlatform, 'addTabRemovedListener')
      .mockImplementation(async (fn) => {
        await new Promise((r) => setTimeout(r, 500));
        await fn(1);
      });
  });

  afterEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  it('should start the subscription with card', async () => {
    await subscriptionService.startSubscriptionWithCard({
      products: [PRODUCT_TYPES.SHIELD],
      isTrialRequested: false,
      recurringInterval: RECURRING_INTERVALS.month,
    });

    expect(mockStartShieldSubscriptionWithCard).toHaveBeenCalledWith({
      products: [PRODUCT_TYPES.SHIELD],
      isTrialRequested: false,
      recurringInterval: RECURRING_INTERVALS.month,
      successUrl: MOCK_REDIRECT_URI,
      cancelUrl: `${MOCK_REDIRECT_URI}?cancel=true`,
    });

    expect(mockGetSubscriptions).toHaveBeenCalled();

    expect(mockPlatform.openTab).toHaveBeenCalledWith({
      url: mockCheckoutSessionUrl,
    });

    expect(mockSetPendingRedirectRoute).toHaveBeenCalledTimes(2);
    expect(mockSetPendingRedirectRoute).toHaveBeenNthCalledWith(1, {
      path: '/shield-plan',
    });
    expect(mockSetPendingRedirectRoute).toHaveBeenNthCalledWith(2, null);
  });

  it('should include the reward account id if the primary account is opted in to rewards and the season is active', async () => {
    mockGetAccountsState.mockRestore();
    mockGetHasAccountOptedIn.mockRestore();
    mockGetHasAccountOptedIn.mockResolvedValueOnce(true);

    mockGetAccountsState.mockReturnValue({
      internalAccounts: {
        ...MOCK_STATE.internalAccounts,
        accounts: {
          ...MOCK_STATE.internalAccounts.accounts,
          [MOCK_STATE.internalAccounts.selectedAccount]: {
            // @ts-expect-error mock account
            ...MOCK_STATE.internalAccounts.accounts[
              MOCK_STATE.internalAccounts.selectedAccount
            ],
            options: {
              entropySource: MOCK_STATE.keyrings[0].metadata.id,
            },
          },
        },
      },
    });

    await subscriptionService.startSubscriptionWithCard({
      products: [PRODUCT_TYPES.SHIELD],
      isTrialRequested: false,
      recurringInterval: RECURRING_INTERVALS.month,
    });

    expect(mockStartShieldSubscriptionWithCard).toHaveBeenCalledWith({
      products: [PRODUCT_TYPES.SHIELD],
      isTrialRequested: false,
      recurringInterval: RECURRING_INTERVALS.month,
      successUrl: MOCK_REDIRECT_URI,
      cancelUrl: `${MOCK_REDIRECT_URI}?cancel=true`,
      rewardAccountId: 'eip155:0:0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
    });

    expect(mockGetRewardSeasonMetadata).toHaveBeenCalledWith('current');

    expect(mockGetHasAccountOptedIn).toHaveBeenCalled();
  });

  it('should not include the reward account id if the season is not active', async () => {
    mockGetRewardSeasonMetadata.mockRestore();

    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 3);
    mockGetRewardSeasonMetadata.mockResolvedValueOnce({
      startDate: startDate.getTime(),
      endDate: endDate.getTime(),
    });
    await subscriptionService.startSubscriptionWithCard({
      products: [PRODUCT_TYPES.SHIELD],
      isTrialRequested: false,
      recurringInterval: RECURRING_INTERVALS.month,
    });

    expect(mockStartShieldSubscriptionWithCard).toHaveBeenCalledWith({
      products: [PRODUCT_TYPES.SHIELD],
      isTrialRequested: false,
      recurringInterval: RECURRING_INTERVALS.month,
      successUrl: MOCK_REDIRECT_URI,
      cancelUrl: `${MOCK_REDIRECT_URI}?cancel=true`,
      rewardSubscriptionId: undefined,
    });

    expect(mockGetRewardSeasonMetadata).toHaveBeenCalledWith('current');
    expect(mockGetHasAccountOptedIn).not.toHaveBeenCalled();
  });

  it('should not include the reward account id when getSeasonMetadata throws season not found error', async () => {
    mockGetRewardSeasonMetadata.mockRestore();
    mockGetRewardSeasonMetadata.mockRejectedValueOnce(
      new Error('No valid season metadata could be found for type: current'),
    );

    await subscriptionService.startSubscriptionWithCard({
      products: [PRODUCT_TYPES.SHIELD],
      isTrialRequested: false,
      recurringInterval: RECURRING_INTERVALS.month,
    });

    expect(mockStartShieldSubscriptionWithCard).toHaveBeenCalledWith({
      products: [PRODUCT_TYPES.SHIELD],
      isTrialRequested: false,
      recurringInterval: RECURRING_INTERVALS.month,
      successUrl: MOCK_REDIRECT_URI,
      cancelUrl: `${MOCK_REDIRECT_URI}?cancel=true`,
    });

    expect(mockGetRewardSeasonMetadata).toHaveBeenCalledWith('current');
    expect(mockGetHasAccountOptedIn).not.toHaveBeenCalled();
  });

  it('should poll until paused subscription is found', async () => {
    mockGetSubscriptions.mockRestore();
    const pausedSubscription = {
      ...MOCK_ACTIVE_SHIELD_SUBSCRIPTION,
      status: SUBSCRIPTION_STATUSES.paused,
    };
    mockGetSubscriptions.mockResolvedValue([pausedSubscription]);

    const result = await subscriptionService.startSubscriptionWithCard({
      products: [PRODUCT_TYPES.SHIELD],
      isTrialRequested: false,
      recurringInterval: RECURRING_INTERVALS.month,
    });

    expect(mockGetSubscriptions).toHaveBeenCalled();
    expect(result).toEqual([pausedSubscription]);
  });

  it('should poll multiple times until active subscription is found', async () => {
    mockGetSubscriptions.mockRestore();
    // First call returns no subscription, second call returns active subscription
    mockGetSubscriptions
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([MOCK_ACTIVE_SHIELD_SUBSCRIPTION]);

    const result = await subscriptionService.startSubscriptionWithCard(
      {
        products: [PRODUCT_TYPES.SHIELD],
        isTrialRequested: false,
        recurringInterval: RECURRING_INTERVALS.month,
      },
      undefined,
      100,
    );

    expect(mockGetSubscriptions).toHaveBeenCalledTimes(2);
    expect(result).toEqual([MOCK_ACTIVE_SHIELD_SUBSCRIPTION]);
  });

  it('should throw timeout error when subscription is not activated within timeout period', async () => {
    mockGetSubscriptions.mockRestore();
    // Always return empty subscriptions to simulate no active subscription
    mockGetSubscriptions.mockResolvedValue([]);

    await expect(() =>
      subscriptionService.startSubscriptionWithCard(
        {
          products: [PRODUCT_TYPES.SHIELD],
          isTrialRequested: false,
          recurringInterval: RECURRING_INTERVALS.month,
        },
        undefined,
        100,
        1000,
      ),
    ).rejects.toThrow(SHIELD_ERROR.subscriptionPollingTimedOut);

    expect(mockClearLastSelectedPaymentMethod).toHaveBeenCalledWith(
      PRODUCT_TYPES.SHIELD,
    );
  });
});

describe('ShieldSubscriptionService - handlePostTransaction', () => {
  const fetchMock: jest.MockedFunction<ReturnType<typeof getFetchWithTimeout>> =
    jest.fn();
  const MOCK_STATE = createSwapsMockStore().metamask;
  const MOCK_TX_META = {
    id: '1',
    type: TransactionType.shieldSubscriptionApprove,
    chainId: '0x1',
  };
  const MOCK_REWARD_ACCOUNT_ID =
    'eip155:0:0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc';

  beforeEach(() => {
    jest.resetAllMocks();
    mockGetIsSmartTransaction.mockReturnValue(true);

    jest.mocked(getFetchWithTimeout).mockReturnValue(fetchMock);
    fetchMock.mockResolvedValueOnce({
      json: async () => ({
        '1': MAINNET_BASE,
      }),
      ok: true,
    } as Response);

    mockGetAppStateControllerState.mockReturnValue({
      defaultSubscriptionPaymentOptions: {
        defaultBillingInterval: RECURRING_INTERVALS.month,
        defaultPaymentType: PAYMENT_TYPES.byCard,
        defaultPaymentCurrency: 'usd',
        defaultPaymentChain: '0x1',
      },
    });
    mockGetSubscriptionControllerState.mockReturnValue({
      lastSelectedPaymentMethod: {
        shield: {
          plan: RECURRING_INTERVALS.year,
          type: PAYMENT_TYPES.byCard,
        },
      },
      trialedProducts: [],
      subscriptions: [],
      lastSubscription: undefined,
    });
    mockGetAccountsState.mockReturnValue({
      internalAccounts: MOCK_STATE.internalAccounts,
    });
    mockGetSmartTransactionsState.mockReturnValueOnce({
      smartTransactionsState: {
        userOptIn: true,
        userOptInV2: true,
        liveness: true,
        livenessByChainId: {
          '0x1': true,
        },
      },
    });
    mockGetPreferencesState.mockReturnValueOnce({
      preferences: MOCK_STATE.preferences,
    });
    mockGetTransactions.mockReturnValueOnce([]);
    mockGetNetworkControllerState.mockReturnValueOnce({
      networkConfigurationsByChainId: MOCK_STATE.networkConfigurationsByChainId,
      networksMetadata: MOCK_STATE.networksMetadata,
    });
    mockGetRemoteFeatureFlagState.mockReturnValueOnce({
      remoteFeatureFlags: MOCK_STATE.remoteFeatureFlags,
    });
    mockGetKeyringControllerState.mockReturnValue({
      keyrings: MOCK_STATE.keyrings,
    });
    mockGetRewardSeasonMetadata.mockResolvedValueOnce({
      startDate: Date.now() - 1000,
      endDate: Date.now() + 1000,
    });
    mockGetHasAccountOptedIn.mockResolvedValueOnce(true);
  });

  it('should handle the crypto approval transaction', async () => {
    const txMeta = {
      ...MOCK_TX_META,
      isGasFeeSponsored: true,
      txParams: {
        from: '0xdeadbeef1234567890abcdef',
      },
    };
    // @ts-expect-error mock tx meta
    await subscriptionService.handlePostTransaction(txMeta);

    expect(mockSubmitShieldSubscriptionCryptoApproval).toHaveBeenCalledWith(
      txMeta,
      true,
      undefined, // no reward subscription id
    );
  });

  it('should handle the crypto approval transaction with reward account id if a primary account is opted in to rewards', async () => {
    const from = '0x88069b650422308bf8b472beaf790189f3f28309';
    const txMeta = {
      ...MOCK_TX_META,
      txParams: {
        from,
      },
    };

    mockGetAccountsState.mockRestore();
    mockGetAccountsState.mockReturnValue({
      internalAccounts: {
        ...MOCK_STATE.internalAccounts,
        accounts: {
          ...MOCK_STATE.internalAccounts.accounts,
          [MOCK_STATE.internalAccounts.selectedAccount]: {
            // @ts-expect-error mock account
            ...MOCK_STATE.internalAccounts.accounts[
              MOCK_STATE.internalAccounts.selectedAccount
            ],
            options: {
              entropySource: MOCK_STATE.keyrings[0].metadata.id,
            },
          },
        },
      },
    });

    // @ts-expect-error mock tx meta
    await subscriptionService.handlePostTransaction(txMeta);
    expect(mockSubmitShieldSubscriptionCryptoApproval).toHaveBeenCalledWith(
      txMeta,
      false,
      MOCK_REWARD_ACCOUNT_ID,
    );
  });

  it('should set shield API error when payerAddressAlreadyUsed error occurs', async () => {
    mockSubmitShieldSubscriptionCryptoApproval.mockRejectedValueOnce(
      new Error(SHIELD_ERROR.payerAddressAlreadyUsed),
    );

    const txMeta = {
      ...MOCK_TX_META,
      isGasFeeSponsored: false,
      txParams: {
        from: '0xdeadbeef1234567890abcdef',
      },
    };

    await expect(
      // @ts-expect-error mock tx meta
      subscriptionService.handlePostTransaction(txMeta),
    ).rejects.toThrow(SHIELD_ERROR.payerAddressAlreadyUsed);

    expect(mockSetShieldSubscriptionError).toHaveBeenCalledWith({
      message: SHIELD_ERROR.payerAddressAlreadyUsed,
    });
    expect(mockClearLastSelectedPaymentMethod).toHaveBeenCalledWith(
      PRODUCT_TYPES.SHIELD,
    );
  });
});

describe('ShieldSubscriptionService - linkRewardToExistingSubscription', () => {
  const MOCK_STATE = createSwapsMockStore().metamask;
  const MOCK_REWARD_ACCOUNT_ID =
    'eip155:0:0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc';
  const MOCK_SHIELD_SUBSCRIPTION_ID = 'shield_subscription_id';
  const MOCK_REWARD_POINTS = 100;

  beforeEach(() => {
    jest.resetAllMocks();

    mockGetAccountsState.mockReturnValue({
      internalAccounts: {
        ...MOCK_STATE.internalAccounts,
        accounts: {
          ...MOCK_STATE.internalAccounts.accounts,
          [MOCK_STATE.internalAccounts.selectedAccount]: {
            // @ts-expect-error mock account
            ...MOCK_STATE.internalAccounts.accounts[
              MOCK_STATE.internalAccounts.selectedAccount
            ],
            options: {
              entropySource: MOCK_STATE.keyrings[0].metadata.id,
            },
          },
        },
      },
    });
    mockGetKeyringControllerState.mockReturnValue({
      keyrings: MOCK_STATE.keyrings,
    });
    mockGetRewardSeasonMetadata.mockResolvedValueOnce({
      startDate: Date.now() - 1000,
      endDate: Date.now() + 1000,
    });
    mockGetHasAccountOptedIn.mockResolvedValueOnce(true);
  });

  it('should link the reward to the existing subscription', async () => {
    await subscriptionService.linkRewardToExistingSubscription(
      MOCK_SHIELD_SUBSCRIPTION_ID,
      MOCK_REWARD_POINTS,
    );

    expect(mockLinkRewards).toHaveBeenCalledWith({
      subscriptionId: MOCK_SHIELD_SUBSCRIPTION_ID,
      rewardAccountId: MOCK_REWARD_ACCOUNT_ID,
    });
  });

  it('should not link the reward to the existing subscription if the season is not active', async () => {
    mockGetRewardSeasonMetadata.mockRestore();

    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 3);
    mockGetRewardSeasonMetadata.mockResolvedValueOnce({
      startDate: startDate.getTime(),
      endDate: endDate.getTime(),
    });
    await subscriptionService.linkRewardToExistingSubscription(
      MOCK_SHIELD_SUBSCRIPTION_ID,
      MOCK_REWARD_POINTS,
    );

    expect(mockLinkRewards).not.toHaveBeenCalled();
  });

  it('should not link the reward when getSeasonMetadata throws season not found error', async () => {
    mockGetRewardSeasonMetadata.mockRestore();
    mockGetRewardSeasonMetadata.mockRejectedValueOnce(
      new Error('No valid season metadata could be found for type: current'),
    );

    await subscriptionService.linkRewardToExistingSubscription(
      MOCK_SHIELD_SUBSCRIPTION_ID,
      MOCK_REWARD_POINTS,
    );

    expect(mockLinkRewards).not.toHaveBeenCalled();
    expect(mockGetHasAccountOptedIn).not.toHaveBeenCalled();
  });

  it('should not link the reward to the existing subscription if user is not opted in to rewards', async () => {
    mockGetHasAccountOptedIn.mockRestore();
    mockGetHasAccountOptedIn.mockResolvedValueOnce(false);

    await subscriptionService.linkRewardToExistingSubscription(
      MOCK_SHIELD_SUBSCRIPTION_ID,
      MOCK_REWARD_POINTS,
    );

    expect(mockLinkRewards).not.toHaveBeenCalled();
  });
});

describe('ShieldSubscriptionService - submitSubscriptionSponsorshipIntent', () => {
  const MOCK_STATE = createSwapsMockStore().metamask;
  const MOCK_TX_META = {
    id: '1',
    type: TransactionType.shieldSubscriptionApprove,
    chainId: '0x1',
    txParams: {
      from: MOCK_STATE.internalAccounts.selectedAccount,
    },
  };
  const fetchMock: jest.MockedFunction<ReturnType<typeof getFetchWithTimeout>> =
    jest.fn();

  beforeEach(() => {
    jest.resetAllMocks();
    mockGetIsSmartTransaction.mockReturnValue(true);
    // assign mocks
    jest.mocked(getFetchWithTimeout).mockReturnValue(fetchMock);
    fetchMock.mockResolvedValueOnce({
      json: async () => ({
        '1': MAINNET_BASE,
      }),
      ok: true,
    } as Response);
    mockGetAccountsState.mockReturnValueOnce({
      internalAccounts: MOCK_STATE.internalAccounts,
    });
    mockGetSmartTransactionsState.mockReturnValueOnce({
      smartTransactionsState: {
        userOptIn: true,
        userOptInV2: true,
        liveness: true,
        livenessByChainId: {
          '0x1': true,
        },
      },
    });
    mockGetPreferencesState.mockReturnValueOnce({
      preferences: MOCK_STATE.preferences,
    });
    mockGetTransactions.mockReturnValueOnce([]);
    mockGetNetworkControllerState.mockReturnValueOnce({
      networkConfigurationsByChainId: MOCK_STATE.networkConfigurationsByChainId,
      networksMetadata: MOCK_STATE.networksMetadata,
    });
    mockGetRemoteFeatureFlagState.mockReturnValueOnce({
      remoteFeatureFlags: MOCK_STATE.remoteFeatureFlags,
    });
  });

  it('should submit the sponsorship intent', async () => {
    // @ts-expect-error mock tx meta
    await subscriptionService.submitSubscriptionSponsorshipIntent(MOCK_TX_META);

    expect(mockSubmitSponsorshipIntents).toHaveBeenCalledWith({
      chainId: '0x1',
      address: MOCK_STATE.internalAccounts.selectedAccount,
      products: [PRODUCT_TYPES.SHIELD],
    });
  });

  it('should not submit sponsorship intent if not a shield subscription approve transaction', async () => {
    // @ts-expect-error mock tx meta
    await subscriptionService.submitSubscriptionSponsorshipIntent({
      ...MOCK_TX_META,
      type: TransactionType.personalSign,
    });

    expect(mockSubmitSponsorshipIntents).not.toHaveBeenCalled();
    expect(mockGetTransactions).not.toHaveBeenCalled();
  });

  it('should not submit sponsorship intent if transaction already exists', async () => {
    mockGetTransactions.mockRestore();
    mockGetTransactions.mockReturnValueOnce([MOCK_TX_META]);
    // @ts-expect-error mock tx meta
    await subscriptionService.submitSubscriptionSponsorshipIntent(MOCK_TX_META);

    expect(mockSubmitSponsorshipIntents).not.toHaveBeenCalled();
    expect(mockGetTransactions).toHaveBeenCalled();
  });

  it('should not submit sponsorship intent if smart transaction is not enabled', async () => {
    mockGetIsSmartTransaction.mockReturnValueOnce(false);

    // @ts-expect-error mock tx meta
    await subscriptionService.submitSubscriptionSponsorshipIntent({
      ...MOCK_TX_META,
      chainId: '0x2', // <--- unsupported chain id for smart transactions
    });

    expect(mockSubmitSponsorshipIntents).not.toHaveBeenCalled();
  });

  it('should not submit sponsorship intent if send bundle is not supported for chain', async () => {
    fetchMock.mockRestore();

    fetchMock.mockResolvedValueOnce({
      json: async () => ({
        '1': { ...MAINNET_BASE, sendBundle: false },
      }),
      ok: true,
    } as Response);

    // @ts-expect-error mock tx meta
    await subscriptionService.submitSubscriptionSponsorshipIntent(MOCK_TX_META);

    expect(mockSubmitSponsorshipIntents).not.toHaveBeenCalled();
  });

  it('should handle sponsorship intent submission error', async () => {
    mockSubmitSponsorshipIntents.mockRestore();

    mockSubmitSponsorshipIntents.mockRejectedValueOnce(
      new Error('Network error'),
    );

    await expect(
      // @ts-expect-error mock tx meta
      subscriptionService.submitSubscriptionSponsorshipIntent(MOCK_TX_META),
    ).resolves.not.toThrow();

    expect(mockSubmitSponsorshipIntents).toHaveBeenCalledWith({
      chainId: '0x1',
      address: MOCK_STATE.internalAccounts.selectedAccount,
      products: [PRODUCT_TYPES.SHIELD],
    });
  });
});

describe('ShieldSubscriptionService - updateSubscriptionCardPaymentMethod', () => {
  const cardParams = {
    paymentType: PAYMENT_TYPES.byCard,
    subscriptionId: 'sub_123',
    recurringInterval: RECURRING_INTERVALS.month,
  } as const;

  beforeEach(() => {
    jest.clearAllMocks();
    getRedirectUrlSpy.mockReturnValue(MOCK_REDIRECT_URI);
    process.env.IN_TEST = 'true';
    mockUpdatePaymentMethod.mockResolvedValue({
      redirectUrl: mockCheckoutSessionUrl,
    });
    mockGetSubscriptions.mockResolvedValue([MOCK_ACTIVE_SHIELD_SUBSCRIPTION]);
  });

  afterEach(() => {
    delete process.env.IN_TEST;
  });

  it('updates card payment method and returns subscriptions', async () => {
    const result =
      await subscriptionService.updateSubscriptionCardPaymentMethod(cardParams);

    expect(mockUpdatePaymentMethod).toHaveBeenCalledWith({
      ...cardParams,
      successUrl: MOCK_REDIRECT_URI,
      cancelUrl: `${MOCK_REDIRECT_URI}?cancel=true`,
    });
    expect(mockGetSubscriptions).toHaveBeenCalled();
    expect(result).toEqual([MOCK_ACTIVE_SHIELD_SUBSCRIPTION]);
  });

  it('throws for unsupported payment type', async () => {
    await expect(
      subscriptionService.updateSubscriptionCardPaymentMethod({
        ...cardParams,
        // @ts-expect-error mock payment type
        paymentType: PAYMENT_TYPES.byCrypto,
      }),
    ).rejects.toThrow('Only card payment type is supported');

    expect(mockUpdatePaymentMethod).not.toHaveBeenCalled();
  });

  it('continues when checkout tab is closed without redirect', async () => {
    delete process.env.IN_TEST;

    jest.spyOn(mockPlatform, 'openTab').mockResolvedValue({
      id: 1,
    } as browser.Tabs.Tab);
    jest.spyOn(mockPlatform, 'addTabUpdatedListener').mockImplementation();
    jest
      .spyOn(mockPlatform, 'addTabRemovedListener')
      .mockImplementation(async (fn) => {
        await fn(1);
      });

    const result =
      await subscriptionService.updateSubscriptionCardPaymentMethod(cardParams);

    expect(result).toEqual([MOCK_ACTIVE_SHIELD_SUBSCRIPTION]);
    expect(mockGetSubscriptions).toHaveBeenCalled();
  });

  it('rethrows non tab-closed errors from checkout flow', async () => {
    delete process.env.IN_TEST;

    let tabUpdatedListener: (
      tabId: number,
      changeInfo: { url: string },
    ) => void = () => undefined;

    jest.spyOn(mockPlatform, 'openTab').mockResolvedValue({
      id: 1,
    } as browser.Tabs.Tab);
    jest
      .spyOn(mockPlatform, 'addTabUpdatedListener')
      .mockImplementation((fn) => {
        tabUpdatedListener = fn;
      });
    jest
      .spyOn(mockPlatform, 'addTabRemovedListener')
      .mockImplementation(async (fn) => {
        tabUpdatedListener(1, {
          url: `${MOCK_REDIRECT_URI}?cancel=true`,
        });
        await fn(1);
      });

    await expect(
      subscriptionService.updateSubscriptionCardPaymentMethod(cardParams),
    ).rejects.toThrow(SHIELD_ERROR.stripePaymentCancelled);

    expect(mockGetSubscriptions).not.toHaveBeenCalled();
  });

  it('opens extension browser when started from popup', async () => {
    delete process.env.IN_TEST;

    let tabUpdatedListener: (
      tabId: number,
      changeInfo: { url: string },
    ) => void = () => undefined;

    jest.spyOn(mockPlatform, 'openTab').mockResolvedValue({
      id: 1,
    } as browser.Tabs.Tab);
    jest
      .spyOn(mockPlatform, 'addTabUpdatedListener')
      .mockImplementation((fn) => {
        tabUpdatedListener = fn;
      });
    jest
      .spyOn(mockPlatform, 'addTabRemovedListener')
      .mockImplementation(async (fn) => {
        tabUpdatedListener(1, {
          url: MOCK_REDIRECT_URI,
        });
        await fn(1);
      });
    const openExtensionSpy = jest
      .spyOn(mockPlatform, 'openExtensionInBrowser')
      .mockImplementation();

    await subscriptionService.updateSubscriptionCardPaymentMethod(cardParams);

    expect(openExtensionSpy).toHaveBeenCalledWith(
      '/settings/transaction-shield',
    );
  });
});

describe('ShieldSubscriptionService - updateSubscriptionCryptoPaymentMethod', () => {
  const cryptoParams = {
    subscriptionId: 'sub_123',
    paymentType: PAYMENT_TYPES.byCrypto,
    recurringInterval: RECURRING_INTERVALS.month,
    chainId: '0x1' as const,
    payerAddress: '0xdeadbeef1234567890abcdef' as const,
    tokenSymbol: 'USDC',
    billingCycles: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdatePaymentMethod.mockResolvedValue(undefined);
    mockGetSubscriptions.mockResolvedValue([MOCK_ACTIVE_SHIELD_SUBSCRIPTION]);
  });

  it('updates crypto payment method and returns subscriptions', async () => {
    const result =
      await subscriptionService.updateSubscriptionCryptoPaymentMethod(
        cryptoParams,
      );

    expect(mockUpdatePaymentMethod).toHaveBeenCalledWith(cryptoParams);
    expect(mockGetSubscriptions).toHaveBeenCalled();
    expect(result).toEqual([MOCK_ACTIVE_SHIELD_SUBSCRIPTION]);
  });

  it('throws for unsupported payment type', async () => {
    await expect(
      subscriptionService.updateSubscriptionCryptoPaymentMethod({
        ...cryptoParams,
        // @ts-expect-error mock payment type
        paymentType: PAYMENT_TYPES.byCard,
      }),
    ).rejects.toThrow('Only crypto payment type is supported');

    expect(mockUpdatePaymentMethod).not.toHaveBeenCalled();
  });
});

describe('ShieldSubscriptionService - startSubscriptionWithCard failure paths', () => {
  const MOCK_STATE = createSwapsMockStore().metamask;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.IN_TEST = 'true';
    process.env.METAMASK_SHIELD_ENABLED = 'true';
    mockGetAppStateControllerState.mockReturnValue({
      defaultSubscriptionPaymentOptions: {
        defaultBillingInterval: RECURRING_INTERVALS.month,
        defaultPaymentType: PAYMENT_TYPES.byCard,
        defaultPaymentCurrency: 'usd',
        defaultPaymentChain: '0x1',
      },
    });
    mockGetSubscriptionControllerState.mockReturnValue({
      lastSelectedPaymentMethod: {
        shield: {
          plan: RECURRING_INTERVALS.year,
          type: PAYMENT_TYPES.byCard,
        },
      },
      trialedProducts: [],
      subscriptions: [],
      lastSubscription: undefined,
    });
    mockGetAccountsState.mockReturnValue({
      internalAccounts: MOCK_STATE.internalAccounts,
    });
    mockGetKeyringControllerState.mockReturnValue({
      keyrings: MOCK_STATE.keyrings,
    });
    mockGetRewardSeasonMetadata.mockResolvedValue({
      startDate: Date.now() - 1000,
      endDate: Date.now() + 1000,
    });
    mockGetHasAccountOptedIn.mockResolvedValue(false);
    mockGetSubscriptions.mockResolvedValue([]);
  });

  afterEach(() => {
    delete process.env.IN_TEST;
  });

  it('refetches subscriptions when subscription already exists error occurs', async () => {
    mockStartShieldSubscriptionWithCard.mockRejectedValueOnce(
      new Error('Subscription already exists'),
    );

    await expect(
      subscriptionService.startSubscriptionWithCard({
        products: [PRODUCT_TYPES.SHIELD],
        isTrialRequested: false,
        recurringInterval: RECURRING_INTERVALS.month,
      }),
    ).rejects.toThrow('Subscription already exists');

    expect(mockClearLastSelectedPaymentMethod).toHaveBeenCalledWith(
      PRODUCT_TYPES.SHIELD,
    );
    expect(mockGetSubscriptions).toHaveBeenCalled();
  });
});

describe('ShieldSubscriptionService - handlePostTransaction cohort assignment', () => {
  const MOCK_STATE = createSwapsMockStore().metamask;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAppStateControllerState.mockReturnValue({
      pendingShieldCohort: null,
      shieldSubscriptionMetricsProps: {
        userBalanceInUSD: 1000,
      },
      defaultSubscriptionPaymentOptions: {
        defaultBillingInterval: RECURRING_INTERVALS.month,
        defaultPaymentType: PAYMENT_TYPES.byCard,
        defaultPaymentCurrency: 'usd',
        defaultPaymentChain: '0x1',
      },
    });
    mockGetSubscriptionControllerState.mockReturnValue({
      lastSelectedPaymentMethod: {
        shield: {
          plan: RECURRING_INTERVALS.year,
          type: PAYMENT_TYPES.byCard,
        },
      },
      trialedProducts: [],
      subscriptions: [],
      lastSubscription: undefined,
    });
    mockGetAccountsState.mockReturnValue({
      internalAccounts: MOCK_STATE.internalAccounts,
    });
    mockGetKeyringControllerState.mockReturnValue({
      keyrings: MOCK_STATE.keyrings,
    });
  });

  it('assigns post_tx cohort for simple send transactions', async () => {
    const txMeta = {
      id: '1',
      type: TransactionType.simpleSend,
      chainId: '0x1',
    };

    // @ts-expect-error mock tx meta
    await subscriptionService.handlePostTransaction(txMeta);

    expect(mockSetPendingShieldCohort).toHaveBeenCalledWith(
      COHORT_NAMES.POST_TX,
      TransactionType.simpleSend,
    );
    expect(mockTrackEvent).toHaveBeenCalled();
    expect(mockSubmitShieldSubscriptionCryptoApproval).not.toHaveBeenCalled();
  });

  it('does not assign post_tx cohort when one is already pending', async () => {
    mockGetAppStateControllerState.mockReturnValue({
      pendingShieldCohort: COHORT_NAMES.POST_TX,
      shieldSubscriptionMetricsProps: {
        userBalanceInUSD: 1000,
      },
      defaultSubscriptionPaymentOptions: {
        defaultBillingInterval: RECURRING_INTERVALS.month,
        defaultPaymentType: PAYMENT_TYPES.byCard,
        defaultPaymentCurrency: 'usd',
        defaultPaymentChain: '0x1',
      },
    });

    const txMeta = {
      id: '1',
      type: TransactionType.swap,
      chainId: '0x1',
    };

    // @ts-expect-error mock tx meta
    await subscriptionService.handlePostTransaction(txMeta);

    expect(mockSetPendingShieldCohort).not.toHaveBeenCalled();
    expect(mockTrackEvent).not.toHaveBeenCalled();
  });
});

describe('ShieldSubscriptionService - linkRewardToExistingSubscription errors', () => {
  const MOCK_STATE = createSwapsMockStore().metamask;
  const MOCK_SHIELD_SUBSCRIPTION_ID = 'shield_subscription_id';

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAccountsState.mockReturnValue({
      internalAccounts: {
        ...MOCK_STATE.internalAccounts,
        accounts: {
          ...MOCK_STATE.internalAccounts.accounts,
          [MOCK_STATE.internalAccounts.selectedAccount]: {
            // @ts-expect-error mock account
            ...MOCK_STATE.internalAccounts.accounts[
              MOCK_STATE.internalAccounts.selectedAccount
            ],
            options: {
              entropySource: MOCK_STATE.keyrings[0].metadata.id,
            },
          },
        },
      },
    });
    mockGetKeyringControllerState.mockReturnValue({
      keyrings: MOCK_STATE.keyrings,
    });
    mockGetRewardSeasonMetadata.mockResolvedValue({
      startDate: Date.now() - 1000,
      endDate: Date.now() + 1000,
    });
    mockGetHasAccountOptedIn.mockResolvedValue(true);
  });

  it('does not throw when linking reward fails', async () => {
    mockLinkRewards.mockRejectedValueOnce(new Error('Network error'));

    await expect(
      subscriptionService.linkRewardToExistingSubscription(
        MOCK_SHIELD_SUBSCRIPTION_ID,
        100,
      ),
    ).resolves.toBeUndefined();

    expect(mockLinkRewards).toHaveBeenCalled();
  });
});
