import React from 'react';
import { fireEvent } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import mockState from '../../../../test/data/mock-state.json';
import configureStore from '../../../store/store';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import { HomeQueryParams } from '../../../../shared/lib/deep-links/routes/home';
import { toggleNetworkMenu } from '../../../store/actions';
import {
  AccountOverviewTabs,
  useHomeDeepLinkEffects,
} from './account-overview-tabs';

jest.mock('../../../store/actions', () => ({
  setDefaultHomeActiveTabName: jest.fn(),
  toggleNetworkMenu: jest.fn(),
}));

const mockToggleNetworkMenu = jest.mocked(toggleNetworkMenu);

jest.mock('../../app/assets/asset-list', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: () => null,
}));

jest.mock('../../app/transaction-list', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: () => null,
}));

jest.mock('../../app/assets/nfts/nfts-tab', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: () => null,
}));

jest.mock(
  '../../app/transaction-list/unified-transaction-list.component',
  () => ({
    // eslint-disable-next-line @typescript-eslint/naming-convention
    __esModule: true,
    default: () => null,
  }),
);

jest.mock('../../app/assets/defi-list/defi-tab', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: () => null,
}));

describe('AccountOverviewTabs - event metrics', () => {
  const mockTrackEvent = jest.fn();
  const mockMetaMetricsContext = {
    trackEvent: mockTrackEvent,
    bufferedTrace: jest.fn(),
    bufferedEndTrace: jest.fn(),
    onboardingParentContext: { current: null },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('includes network_filter property with both EVM and non-EVM networks in CAIP format', () => {
    const store = configureStore({
      metamask: {
        ...mockState.metamask,
        enabledNetworkMap: {
          eip155: {
            [CHAIN_IDS.MAINNET]: true,
            [CHAIN_IDS.POLYGON]: true,
          },
          solana: {
            'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': true,
          },
        },
      },
    });

    const { getByText } = renderWithProvider(
      <MetaMetricsContext.Provider value={mockMetaMetricsContext}>
        <AccountOverviewTabs
          showTokens={true}
          showNfts={false}
          showActivity={true}
          setBasicFunctionalityModalOpen={jest.fn()}
          onSupportLinkClick={jest.fn()}
        />
      </MetaMetricsContext.Provider>,
      store,
      '/?tab=activity',
    );

    // Click a tab to trigger event
    fireEvent.click(getByText('Tokens'));

    // Verify network_filter property is included in correct format
    expect(mockTrackEvent).toHaveBeenCalledWith({
      category: MetaMetricsEventCategory.Home,
      event: MetaMetricsEventName.TokenScreenOpened,
      properties: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        network_filter: [
          'eip155:1',
          'eip155:137',
          'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
        ],
      },
    });
  });
});

describe('useHomeDeepLinkEffects', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createWrapper = (options: {
    pathname: string;
    search: string;
    isNetworkMenuOpen: boolean;
  }) => {
    const { pathname, search, isNetworkMenuOpen } = options;

    const store = configureStore({
      metamask: {
        ...mockState.metamask,
      },
      appState: {
        ...mockState.appState,
        isNetworkMenuOpen,
      },
    });

    const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <Provider store={store}>
        <MemoryRouter initialEntries={[`${pathname}${search}`]}>
          {children}
        </MemoryRouter>
      </Provider>
    );

    return { Wrapper, store };
  };

  type OpenNetworkSelectorDeepLinkTestCase = {
    testName: string;
    searchParams: URLSearchParams;
    inputOptsOverrides?: Partial<{
      pathname: string;
      isNetworkMenuOpen: boolean;
    }>;
    expectedAction: () => void;
  };

  const openNetworkSelectorDeepLinkCases: OpenNetworkSelectorDeepLinkTestCase[] =
    [
      {
        testName:
          'opens network selector when openNetworkSelector param is "true"',
        searchParams: new URLSearchParams({
          [HomeQueryParams.OpenNetworkSelector]: 'true',
        }),
        expectedAction: () => expect(mockToggleNetworkMenu).toHaveBeenCalled(),
      },
      {
        testName:
          'does not open network selector when openNetworkSelector param is "false"',
        searchParams: new URLSearchParams({
          [HomeQueryParams.OpenNetworkSelector]: 'false',
        }),
        expectedAction: () =>
          expect(mockToggleNetworkMenu).not.toHaveBeenCalled(),
      },
      {
        testName: 'performs no action when no deep link params are provided',
        searchParams: new URLSearchParams(),
        expectedAction: () =>
          expect(mockToggleNetworkMenu).not.toHaveBeenCalled(),
      },
      {
        testName: 'does not toggle network menu when it is already open',
        searchParams: new URLSearchParams({
          [HomeQueryParams.OpenNetworkSelector]: 'true',
        }),
        inputOptsOverrides: {
          isNetworkMenuOpen: true,
        },
        expectedAction: () =>
          expect(mockToggleNetworkMenu).not.toHaveBeenCalled(),
      },
      {
        testName: 'does not handle deep links when not on home route',
        searchParams: new URLSearchParams({
          [HomeQueryParams.OpenNetworkSelector]: 'true',
        }),
        inputOptsOverrides: {
          pathname: '/some-other-route',
        },
        expectedAction: () =>
          expect(mockToggleNetworkMenu).not.toHaveBeenCalled(),
      },
    ];

  // @ts-expect-error This is missing from the Mocha type definitions
  it.each(openNetworkSelectorDeepLinkCases)(
    'openNetworkSelectorDeepLink: $testName',
    ({
      searchParams,
      inputOptsOverrides,
      expectedAction,
    }: OpenNetworkSelectorDeepLinkTestCase) => {
      const search = searchParams.size > 0 ? `?${searchParams.toString()}` : '';

      const happyPathOpts = {
        pathname: DEFAULT_ROUTE,
        isNetworkMenuOpen: false,
      };

      const inputOpts = {
        ...happyPathOpts,
        ...inputOptsOverrides,
      };

      const { Wrapper } = createWrapper({
        pathname: inputOpts.pathname,
        search,
        isNetworkMenuOpen: inputOpts.isNetworkMenuOpen,
      });

      renderHook(() => useHomeDeepLinkEffects(), { wrapper: Wrapper });

      expectedAction();
    },
  );
});
