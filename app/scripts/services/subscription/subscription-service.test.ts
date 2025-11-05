import {
  MOCK_ANY_NAMESPACE,
  Messenger,
  MessengerActions,
  MessengerEvents,
  MockAnyNamespace,
} from '@metamask/messenger';
import {
  PRODUCT_TYPES,
  RECURRING_INTERVALS,
} from '@metamask/subscription-controller';
import browser from 'webextension-polyfill';
import { TransactionType } from '@metamask/transaction-controller';
import ExtensionPlatform from '../../platforms/extension';
import { ENVIRONMENT } from '../../../../development/build/constants';
import { WebAuthenticator } from '../oauth/types';
import { createSwapsMockStore } from '../../../../test/jest';
import getFetchWithTimeout from '../../../../shared/modules/fetch-with-timeout';
import { SubscriptionService } from './subscription-service';
import { SubscriptionServiceMessenger } from './types';

type Actions = MessengerActions<SubscriptionServiceMessenger>;

type Events = MessengerEvents<SubscriptionServiceMessenger>;

type RootMessenger = Messenger<MockAnyNamespace, Actions, Events>;

jest.mock('../../platforms/extension');

jest.mock('../../../../shared/modules/fetch-with-timeout');

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

const getRedirectUrlSpy = jest.fn().mockReturnValue(MOCK_REDIRECT_URI);
const mockSubmitSponsorshipIntents = jest.fn();
const mockGetTransactions = jest.fn();
const mockGetPreferencesState = jest.fn();
const mockGetAccountsState = jest.fn();
const mockGetSmartTransactionsState = jest.fn();
const mockCheckoutSessionUrl = 'https://mocked-checkout-session-url';
const mockStartShieldSubscriptionWithCard = jest.fn();
const mockGetSubscriptions = jest.fn();
const mockGetSwapsControllerState = jest.fn();
const mockGetNetworkControllerState = jest.fn();

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
  'SwapsController:getState',
  mockGetSwapsControllerState,
);
rootMessenger.registerActionHandler(
  'NetworkController:getState',
  mockGetNetworkControllerState,
);

const messenger: SubscriptionServiceMessenger = new Messenger({
  namespace: 'SubscriptionService',
  parent: rootMessenger,
});
rootMessenger.delegate({
  messenger,
  actions: [
    'SubscriptionController:startShieldSubscriptionWithCard',
    'SubscriptionController:getSubscriptions',
    'SubscriptionController:submitSponsorshipIntents',
    'TransactionController:getTransactions',
    'PreferencesController:getState',
    'AccountsController:getState',
    'SmartTransactionsController:getState',
    'SwapsController:getState',
    'NetworkController:getState',
  ],
});

const mockWebAuthenticator: WebAuthenticator = {
  getRedirectURL: getRedirectUrlSpy,
  launchWebAuthFlow: jest.fn(),
  generateCodeVerifierAndChallenge: jest.fn(),
  generateNonce: jest.fn(),
};
const mockPlatform = new ExtensionPlatform();
const subscriptionService = new SubscriptionService({
  messenger,
  platform: mockPlatform,
  webAuthenticator: mockWebAuthenticator,
});

describe('SubscriptionService - startSubscriptionWithCard', () => {
  beforeAll(() => {
    process.env.METAMASK_ENVIRONMENT = ENVIRONMENT.TESTING;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should start the subscription with card', async () => {
    mockStartShieldSubscriptionWithCard.mockResolvedValue({
      checkoutSessionUrl: mockCheckoutSessionUrl,
    });
    const mockOpenTab = jest.spyOn(mockPlatform, 'openTab');
    mockOpenTab.mockResolvedValue({
      id: 1,
    } as browser.Tabs.Tab);
    const mockAddTabUpdatedListener = jest.spyOn(
      mockPlatform,
      'addTabUpdatedListener',
    );
    mockAddTabUpdatedListener.mockImplementation(async (fn) => {
      await new Promise((r) => setTimeout(r, 200));
      await fn(1, {
        url: MOCK_REDIRECT_URI,
      });
    });
    const mockAddTabRemovedListener = jest.spyOn(
      mockPlatform,
      'addTabRemovedListener',
    );
    mockAddTabRemovedListener.mockImplementation(async (fn) => {
      await new Promise((r) => setTimeout(r, 500));
      await fn(1);
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
    });

    expect(mockGetSubscriptions).toHaveBeenCalled();

    expect(mockPlatform.openTab).toHaveBeenCalledWith({
      url: mockCheckoutSessionUrl,
    });
  });
});

describe('SubscriptionService - submitSubscriptionSponsorshipIntent', () => {
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
    mockGetSwapsControllerState.mockReturnValueOnce({
      swapsState: MOCK_STATE.swapsState,
    });
    mockGetTransactions.mockReturnValueOnce([]);
    mockGetNetworkControllerState.mockReturnValueOnce({
      networkConfigurationsByChainId: MOCK_STATE.networkConfigurationsByChainId,
      networksMetadata: MOCK_STATE.networksMetadata,
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

  it('should fetch swaps feature flags if not available and submit sponsorship intent', async () => {
    mockGetSwapsControllerState.mockRestore();
    fetchMock.mockRestore();

    mockGetSwapsControllerState.mockReturnValueOnce({
      swapsState: {
        swapsFeatureFlags: {},
      },
    });
    const MOCK_SWAPS_FEATURE_FLAGS = {
      ethereum: {
        extensionActive: true,
        mobileActive: false,
        smartTransactions: {
          expectedDeadline: 45,
          maxDeadline: 150,
          extensionReturnTxHashAsap: false,
          extensionActive: true,
        },
      },
    };
    fetchMock
      .mockResolvedValueOnce({
        json: async () => MOCK_SWAPS_FEATURE_FLAGS,
        ok: true,
      } as Response)
      .mockResolvedValueOnce({
        json: async () => ({
          '1': MAINNET_BASE,
        }),
        ok: true,
      } as Response);

    // @ts-expect-error mock tx meta
    await subscriptionService.submitSubscriptionSponsorshipIntent(MOCK_TX_META);

    expect(mockSubmitSponsorshipIntents).toHaveBeenCalledWith({
      chainId: '0x1',
      address: MOCK_STATE.internalAccounts.selectedAccount,
      products: [PRODUCT_TYPES.SHIELD],
    });
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
