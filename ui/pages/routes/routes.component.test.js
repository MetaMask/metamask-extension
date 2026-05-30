import React from 'react';
import extensionBrowser from 'webextension-polyfill';
import { Provider } from 'react-redux';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { render as rtlRender, screen } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import {
  CONFIRMATION_V_NEXT_ROUTE,
  DEFAULT_ROUTE,
  HYPERLIQUID_DEPOSIT_ROUTE,
  TOKEN_MANAGEMENT_ROUTE,
} from '../../helpers/constants/routes';
import {
  ENVIRONMENT_TYPE_POPUP,
  ENVIRONMENT_TYPE_SIDEPANEL,
} from '../../../shared/constants/app';
import {
  HYPERLIQUID_DEPOSIT_POPUP_ROUTE_MESSAGE,
  HYPERLIQUID_DEPOSIT_ROUTE_ACK_MESSAGE,
} from '../../../shared/lib/hyperliquid-deposit-transaction';
import { renderWithProvider } from '../../../test/lib/render-helpers-navigate';
import mockSendState from '../../../test/data/mock-send-state.json';
import mockState from '../../../test/data/mock-state.json';
import { useIsOriginalNativeTokenSymbol } from '../../hooks/useIsOriginalNativeTokenSymbol';
import { CHAIN_IDS } from '../../../shared/constants/network';
import { mockNetworkState } from '../../../test/stub/networks';
import useMultiPolling from '../../hooks/useMultiPolling';
import Routes, {
  handleHyperliquidDepositRouteMessage,
  TokenManagementFeatureRoute,
} from './routes.component';

const middlewares = [thunk];

const mockShowNetworkDropdown = jest.fn();
const mockHideNetworkDropdown = jest.fn();
const mockFetchWithCache = jest.fn();
const mockNavigate = jest.fn();

jest.mock('webextension-polyfill', () => ({
  runtime: {
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    sendMessage: jest.fn().mockResolvedValue(undefined),
    getManifest: () => ({ manifest_version: 2 }),
  },
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../../../app/scripts/lib/util', () => ({
  ...jest.requireActual('../../../app/scripts/lib/util'),
  getEnvironmentType: () => globalThis.mockEnvironmentType ?? 'popup',
}));

jest.mock('../../store/actions', () => ({
  ...jest.requireActual('../../store/actions'),
  getGasFeeTimeEstimate: jest.fn().mockImplementation(() => Promise.resolve()),
  gasFeeStartPollingByNetworkClientId: jest
    .fn()
    .mockResolvedValue('pollingToken'),
  gasFeeStopPollingByPollingToken: jest.fn(),
  getNetworkConfigurationByNetworkClientId: jest
    .fn()
    .mockResolvedValue({ chainId: '0x5' }),
  showNetworkDropdown: () => mockShowNetworkDropdown,
  hideNetworkDropdown: () => mockHideNetworkDropdown,
  tokenBalancesStartPolling: jest.fn().mockResolvedValue('pollingToken'),
  tokenBalancesStopPollingByPollingToken: jest.fn(),
  setTokenNetworkFilter: jest.fn(),
}));

// Mock the dispatch function
const mockDispatch = jest.fn();

jest.mock('react-redux', () => {
  const actual = jest.requireActual('react-redux');
  return {
    ...actual,
    useDispatch: () => mockDispatch,
  };
});

jest.mock('../../ducks/domains', () => ({
  ...jest.requireActual('../../ducks/domains'),
  initializeDomainSlice: () => ({ type: 'XXX' }),
}));

jest.mock('../../hooks/useIsOriginalNativeTokenSymbol', () => {
  return {
    useIsOriginalNativeTokenSymbol: jest.fn(),
  };
});

jest.mock(
  '../../components/app/metamask-template-renderer/safe-component-list',
);

jest.mock(
  '../../../shared/lib/fetch-with-cache',
  () => () => mockFetchWithCache,
);

jest.mock('../../hooks/musd', () => ({
  useMusdCtaVisibility: () => ({
    shouldShowTokenListItemCta: jest.fn().mockReturnValue(false),
    shouldShowAssetOverviewCta: jest.fn().mockReturnValue(false),
    shouldShowBuyGetMusdCta: jest.fn().mockReturnValue({
      shouldShowCta: false,
      selectedChainId: null,
      isEmptyWallet: false,
      variant: null,
    }),
    isTokenWithCta: jest.fn().mockReturnValue(false),
    getCtaKey: jest.fn().mockReturnValue(''),
    isGeoBlocked: false,
    isGeoBlockingLoading: false,
  }),
  useMusdBalance: () => ({
    hasMusdBalance: false,
    totalMusdBalance: '0',
    musdBalancesByChain: {},
    isLoading: false,
  }),
  useMusdNetworkFilter: () => ({
    isPopularNetworksFilterActive: false,
    selectedChainId: null,
    enabledChainIds: [],
  }),
  useMusdConversionTokens: () => ({
    tokens: [],
    isLoading: false,
  }),
  useMusdConversion: () => ({
    startConversionFlow: jest.fn(),
    educationSeen: false,
  }),
  useMusdGeoBlocking: () => ({
    isBlocked: false,
    userCountry: 'US',
    isLoading: false,
    error: null,
    blockedRegions: [],
    blockedMessage: null,
    refreshGeolocation: jest.fn(),
  }),
  useMusdConversionToastStatus: () => ({
    shouldShowToast: false,
    toastMessage: null,
    dismissToast: jest.fn(),
  }),
  useCanBuyMusd: () => ({
    canBuyMusd: false,
  }),
  useCustomAmount: () => ({
    customAmount: null,
    setCustomAmount: jest.fn(),
  }),
  BuyGetMusdCtaVariant: { BUY: 'buy', GET: 'get' },
  isTokenInWildcardList: jest.fn().mockReturnValue(false),
  checkTokenAllowed: jest.fn().mockReturnValue(false),
  isMerklClaimTransaction: jest.fn().mockReturnValue(false),
}));

jest.mock('../../hooks/useMultiPolling', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('../../contexts/shield/shield-subscription', () => ({
  ...jest.requireActual('../../contexts/shield/shield-subscription'),
  useShieldSubscriptionContext: () => ({
    evaluateCohortEligibility: jest.fn(),
  }),
}));

const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
});
window.IntersectionObserver = mockIntersectionObserver;

const render = (pathname, state) => {
  const store = configureMockStore(middlewares)({
    ...mockSendState,
    ...state,
  });

  return renderWithProvider(<Routes />, store, pathname);
};

describe('Routes Component', () => {
  useIsOriginalNativeTokenSymbol.mockImplementation(() => true);

  beforeEach(() => {
    globalThis.mockEnvironmentType = ENVIRONMENT_TYPE_POPUP;
    mockNavigate.mockClear();
    extensionBrowser.runtime.onMessage.addListener.mockClear();
    extensionBrowser.runtime.onMessage.removeListener.mockClear();
    extensionBrowser.runtime.sendMessage.mockClear();

    // Clear previous mock implementations
    useMultiPolling.mockClear();

    // Mock implementation for useMultiPolling
    useMultiPolling.mockImplementation(({ input }) => {
      // Mock startPolling and stopPollingByPollingToken for each input
      const startPolling = jest.fn().mockResolvedValue('mockPollingToken');
      const stopPollingByPollingToken = jest.fn();

      input.forEach((inputItem) => {
        const key = JSON.stringify(inputItem);
        // Simulate returning a unique token for each input
        startPolling.mockResolvedValueOnce(`mockToken-${key}`);
      });

      return { startPolling, stopPollingByPollingToken };
    });
  });

  afterEach(() => {
    mockShowNetworkDropdown.mockClear();
    mockHideNetworkDropdown.mockClear();
  });

  describe('render during send flow', () => {
    it('should render when send transaction is not active', () => {
      const state = {
        ...mockSendState,
        metamask: {
          ...mockSendState.metamask,
          swapsState: {
            ...mockSendState.metamask.swapsState,
            swapsFeatureIsLive: true,
          },
          accountsByChainId: {},
          pendingApprovals: {},
          approvalFlows: [],
          announcements: {},
          ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),
          newPrivacyPolicyToastShownDate: new Date('0'),
          preferences: {
            defaultAddressScope: 'eip155',
            tokenSortConfig: {
              key: 'token-sort-key',
              order: 'dsc',
              sortCallback: 'stringNumeric',
            },
          },
          enabledNetworkMap: {
            eip155: {
              [CHAIN_IDS.MAINNET]: true,
            },
          },
          tokenBalances: {
            '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': {
              '0x1': {
                '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48': '0xbdbd',
                '0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e': '0x501b4176a64d6',
              },
            },
          },
          permissionHistory: {
            'https://metamask.github.io': {
              eth_accounts: {
                accounts: [
                  'eip155:1:0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
                ],
              },
            },
          },
        },
        localeMessages: {
          currentLocale: 'en',
        },
      };
      const { container } = render(undefined, state);
      expect(container.querySelector('.app')).toBeInTheDocument();
    });
  });

  it('redirects token management route to home when the feature flag is disabled', async () => {
    const store = configureMockStore(middlewares)({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        remoteFeatureFlags: {
          ...mockState.metamask.remoteFeatureFlags,
          extensionUxTokenManagementFilter: { enabled: false },
        },
      },
    });
    const router = createMemoryRouter(
      [
        {
          path: TOKEN_MANAGEMENT_ROUTE,
          element: <TokenManagementFeatureRoute />,
        },
        {
          path: DEFAULT_ROUTE,
          element: <div data-testid="home-route" />,
        },
      ],
      { initialEntries: [TOKEN_MANAGEMENT_ROUTE] },
    );

    rtlRender(
      <Provider store={store}>
        <RouterProvider
          router={router}
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        />
      </Provider>,
    );

    expect(await screen.findByTestId('home-route')).toBeInTheDocument();
  });
});

describe('Hyperliquid deposit route messages', () => {
  beforeEach(() => {
    globalThis.mockEnvironmentType = ENVIRONMENT_TYPE_SIDEPANEL;
    mockNavigate.mockClear();
    extensionBrowser.runtime.onMessage.addListener.mockClear();
    extensionBrowser.runtime.sendMessage.mockClear();
    useMultiPolling.mockImplementation(() => ({
      startPolling: jest.fn().mockResolvedValue('mockPollingToken'),
      stopPollingByPollingToken: jest.fn(),
    }));
  });

  it('routes sidepanel-targeted deposit messages in the sidepanel and acknowledges the route', () => {
    handleHyperliquidDepositRouteMessage({
      message: {
        type: HYPERLIQUID_DEPOSIT_POPUP_ROUTE_MESSAGE,
        payload: {
          target: 'sidepanel',
          triggerId: 'trigger-sidepanel',
        },
      },
      navigate: mockNavigate,
      runtime: extensionBrowser.runtime,
      windowType: ENVIRONMENT_TYPE_SIDEPANEL,
    });

    expect(mockNavigate).toHaveBeenCalledWith(
      `${HYPERLIQUID_DEPOSIT_ROUTE}?trigger=trigger-sidepanel`,
    );
    expect(extensionBrowser.runtime.sendMessage).toHaveBeenCalledWith({
      type: HYPERLIQUID_DEPOSIT_ROUTE_ACK_MESSAGE,
      payload: {
        triggerId: 'trigger-sidepanel',
        environmentType: ENVIRONMENT_TYPE_SIDEPANEL,
      },
    });
  });

  it('ignores sidepanel-targeted deposit messages outside the sidepanel', () => {
    handleHyperliquidDepositRouteMessage({
      message: {
        type: HYPERLIQUID_DEPOSIT_POPUP_ROUTE_MESSAGE,
        payload: {
          target: 'sidepanel',
          triggerId: 'trigger-popup',
        },
      },
      navigate: mockNavigate,
      runtime: extensionBrowser.runtime,
      windowType: ENVIRONMENT_TYPE_POPUP,
    });

    expect(mockNavigate).not.toHaveBeenCalled();
    expect(extensionBrowser.runtime.sendMessage).not.toHaveBeenCalled();
  });
});

describe('toast display', () => {
  const getToastDisplayTestState = (date) => ({
    ...mockState,
    rewards: {
      rewardsModalOpen: false,
    },
    metamask: {
      ...mockState.metamask,
      allTokens: {},
      announcements: {},
      approvalFlows: [],
      completedOnboarding: true,
      pendingApprovals: {},
      pendingApprovalCount: 0,
      preferences: {
        defaultAddressScope: 'eip155',
        tokenSortConfig: {
          key: 'token-sort-key',
          order: 'dsc',
          sortCallback: 'stringNumeric',
        },
        tokenNetworkFilter: {
          [CHAIN_IDS.MAINNET]: true,
          [CHAIN_IDS.LINEA_MAINNET]: true,
        },
      },
      tokenBalances: {},
      marketData: {},
      balances: {},
      currencyRates: {},
      conversionRates: {},
      accountsAssets: {},
      assetsMetadata: {},
      allIgnoredAssets: {},
      swapsState: { swapsFeatureIsLive: true },
      newPrivacyPolicyToastShownDate: date,
    },
  });

  it('renders toastContainer on default route', () => {
    render(DEFAULT_ROUTE, getToastDisplayTestState(new Date('9999')));
    const toastContainer = document.querySelector('.toasts-container');
    expect(toastContainer).toBeInTheDocument();
  });

  it('does not render toastContainer on confirmation route', () => {
    render(CONFIRMATION_V_NEXT_ROUTE, getToastDisplayTestState(new Date(0)));
    const toastContainer = document.querySelector('.toasts-container');

    expect(toastContainer).not.toBeInTheDocument();
  });
});
