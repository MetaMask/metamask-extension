import React from 'react';
import { it as jestIt } from '@jest/globals';
import { renderHook, render, waitFor } from '@testing-library/react';
import mockState from '../../../test/data/mock-state.json';
import configureStore from '../../store/store';
import { createMemoryRouterWrapper } from '../../../test/lib/render-helpers-navigate';
import { HomeQueryParams } from '../../../shared/lib/deep-links/routes/home';
import { toggleNetworkMenu } from '../../store/actions';
import {
  BATCH_SELL_SELECT_ROUTE,
  DEFAULT_ROUTE,
} from '../../helpers/constants/routes';
import {
  HomeDeepLinkActions,
  useHomeDeepLinkEffects,
} from './home-deep-link-actions';

jest.mock('../../store/actions', () => ({
  toggleNetworkMenu: jest
    .fn()
    .mockReturnValue({ type: 'MOCK_TOGGLE_NETWORK_MENU' }),
}));

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const mockToggleNetworkMenu = jest.mocked(toggleNetworkMenu);

const createWrapper = (options: {
  pathname: string;
  search: string;
  isNetworkMenuOpen: boolean;
  batchSellEnabled?: boolean;
}) => {
  const { pathname, search, isNetworkMenuOpen, batchSellEnabled } = options;

  const store = configureStore({
    metamask: {
      ...mockState.metamask,
      remoteFeatureFlags: {
        ...mockState.metamask.remoteFeatureFlags,
        ...(batchSellEnabled === undefined
          ? {}
          : { batchSell: { enabled: batchSellEnabled } }),
      },
    },
    appState: {
      ...mockState.appState,
      isNetworkMenuOpen,
    },
  });

  const Wrapper = createMemoryRouterWrapper({
    store,
    initialEntries: [`${pathname}${search}`],
  });

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

describe('useHomeDeepLinkEffects', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

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

describe('HomeDeepLinkActions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

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

      render(<HomeDeepLinkActions />, { wrapper: Wrapper });

      expectedAction();
    },
  );

  jestIt.each(['link.metamask.io', 'link.metamask.com'])(
    'dispatches setHomeDeepLinkQrCode for a valid predict deep link URL from %s',
    async (host) => {
      const deepLinkUrl = `https://${host}/predict?marketId=30615&sig_params=marketId&sig=signature&utm_source=twitter`;
      const { Wrapper, store } = createWrapper({
        pathname: DEFAULT_ROUTE,
        search: `?${new URLSearchParams({
          [HomeQueryParams.PredictDeepLinkUrl]: deepLinkUrl,
        }).toString()}`,
        isNetworkMenuOpen: false,
      });

      render(<HomeDeepLinkActions />, { wrapper: Wrapper });

      await waitFor(() => {
        const qrCode = (
          store.getState() as { appState: { homeDeepLinkQrCode: unknown } }
        ).appState.homeDeepLinkQrCode;
        expect(qrCode).toEqual({
          deepLinkUrl,
          descriptionKey: 'deepLinkQrPredictDescription',
          titleKey: 'deepLinkQrPredictTitle',
        });
      });
    },
  );

  jestIt.each(['link.metamask.io', 'link.metamask.com'])(
    'dispatches setHomeDeepLinkQrCode for a valid Limit Order deep link URL from %s',
    async (host) => {
      const deepLinkUrl = `https://${host}/swap?tab=limit&from=eip155%3A1%2Fslip44%3A60&to=eip155%3A1%2Ferc20%3A0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48&amount=100000000000000000&expiresInMinutes=10080&priceTolerance=0.5`;
      const { Wrapper, store } = createWrapper({
        pathname: DEFAULT_ROUTE,
        search: `?${new URLSearchParams({
          [HomeQueryParams.LimitOrderDeepLinkUrl]: deepLinkUrl,
        }).toString()}`,
        isNetworkMenuOpen: false,
      });

      render(<HomeDeepLinkActions />, { wrapper: Wrapper });

      await waitFor(() => {
        const qrCode = (
          store.getState() as { appState: { homeDeepLinkQrCode: unknown } }
        ).appState.homeDeepLinkQrCode;
        expect(qrCode).toEqual({
          deepLinkUrl,
          descriptionKey: 'deepLinkQrLimitOrderDescription',
          titleKey: 'deepLinkQrLimitOrderTitle',
        });
      });
    },
  );

  jestIt.each([
    ['a missing tab', 'https://link.metamask.io/swap'],
    ['a non-limit tab', 'https://link.metamask.io/swap?tab=Limit'],
    ['the wrong path', 'https://link.metamask.io/predict?tab=limit'],
    [
      'a configured subdomain',
      'https://links.link.metamask.com/swap?tab=limit',
    ],
    ['a nonstandard port', 'https://link.metamask.com:444/swap?tab=limit'],
  ])('ignores a Limit Order QR deep link URL with %s', (_, deepLinkUrl) => {
    const { Wrapper, store } = createWrapper({
      pathname: DEFAULT_ROUTE,
      search: `?${new URLSearchParams({
        [HomeQueryParams.LimitOrderDeepLinkUrl]: deepLinkUrl,
      }).toString()}`,
      isNetworkMenuOpen: false,
    });

    render(<HomeDeepLinkActions />, { wrapper: Wrapper });

    const qrCode = (
      store.getState() as { appState: { homeDeepLinkQrCode: unknown } }
    ).appState.homeDeepLinkQrCode;
    expect(qrCode).toBeNull();
  });

  it('shows the QR code for a valid batch sell deep link URL when the feature is unavailable in the extension', async () => {
    const deepLinkUrl = 'https://link.metamask.io/batch-sell';
    const { Wrapper, store } = createWrapper({
      pathname: DEFAULT_ROUTE,
      search: `?${new URLSearchParams({
        [HomeQueryParams.BatchSellDeepLinkUrl]: deepLinkUrl,
      }).toString()}`,
      isNetworkMenuOpen: false,
      batchSellEnabled: false,
    });

    render(<HomeDeepLinkActions />, { wrapper: Wrapper });

    await waitFor(() => {
      const qrCode = (
        store.getState() as { appState: { homeDeepLinkQrCode: unknown } }
      ).appState.homeDeepLinkQrCode;
      expect(qrCode).toEqual({
        deepLinkUrl,
        descriptionKey: 'deepLinkQrBatchSellDescription',
        titleKey: 'deepLinkQrBatchSellTitle',
      });
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('navigates to the batch sell select page for a valid batch sell deep link URL when the feature is available in the extension', async () => {
    const deepLinkUrl = 'https://link.metamask.io/batch-sell';
    const { Wrapper, store } = createWrapper({
      pathname: DEFAULT_ROUTE,
      search: `?${new URLSearchParams({
        [HomeQueryParams.BatchSellDeepLinkUrl]: deepLinkUrl,
      }).toString()}`,
      isNetworkMenuOpen: false,
      batchSellEnabled: true,
    });

    render(<HomeDeepLinkActions />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(BATCH_SELL_SELECT_ROUTE);
    });

    const qrCode = (
      store.getState() as { appState: { homeDeepLinkQrCode: unknown } }
    ).appState.homeDeepLinkQrCode;
    expect(qrCode).toBeNull();
  });

  it('dispatches setHomeDeepLinkQrCode for a valid trending deep link URL', async () => {
    const deepLinkUrl = 'https://link.metamask.io/trending?tab=crypto';
    const { Wrapper, store } = createWrapper({
      pathname: DEFAULT_ROUTE,
      search: `?${new URLSearchParams({
        [HomeQueryParams.TrendingDeepLinkUrl]: deepLinkUrl,
      }).toString()}`,
      isNetworkMenuOpen: false,
    });

    render(<HomeDeepLinkActions />, { wrapper: Wrapper });

    await waitFor(() => {
      const qrCode = (
        store.getState() as { appState: { homeDeepLinkQrCode: unknown } }
      ).appState.homeDeepLinkQrCode;
      expect(qrCode).toEqual({
        deepLinkUrl,
        descriptionKey: 'deepLinkQrTrendingDescription',
        titleKey: 'deepLinkQrTrendingTitle',
      });
    });
  });

  it('ignores batch sell QR deep link params that do not point to /batch-sell', () => {
    const { Wrapper, store } = createWrapper({
      pathname: DEFAULT_ROUTE,
      search: `?${new URLSearchParams({
        [HomeQueryParams.BatchSellDeepLinkUrl]:
          'https://link.metamask.io/rewards?referral=ABC123',
      }).toString()}`,
      isNetworkMenuOpen: false,
    });

    render(<HomeDeepLinkActions />, { wrapper: Wrapper });

    const qrCode = (
      store.getState() as { appState: { homeDeepLinkQrCode: unknown } }
    ).appState.homeDeepLinkQrCode;
    expect(qrCode).toBeNull();
  });

  it('ignores predict QR deep link params that do not point to /predict', () => {
    const { Wrapper, store } = createWrapper({
      pathname: DEFAULT_ROUTE,
      search: `?${new URLSearchParams({
        [HomeQueryParams.PredictDeepLinkUrl]:
          'https://link.metamask.io/rewards?referral=ABC123',
      }).toString()}`,
      isNetworkMenuOpen: false,
    });

    render(<HomeDeepLinkActions />, { wrapper: Wrapper });

    const qrCode = (
      store.getState() as { appState: { homeDeepLinkQrCode: unknown } }
    ).appState.homeDeepLinkQrCode;
    expect(qrCode).toBeNull();
  });

  it('ignores predict QR deep link params from a configured subdomain', () => {
    const { Wrapper, store } = createWrapper({
      pathname: DEFAULT_ROUTE,
      search: `?${new URLSearchParams({
        [HomeQueryParams.PredictDeepLinkUrl]:
          'https://links.link.metamask.com/predict',
      }).toString()}`,
      isNetworkMenuOpen: false,
    });

    render(<HomeDeepLinkActions />, { wrapper: Wrapper });

    const qrCode = (
      store.getState() as { appState: { homeDeepLinkQrCode: unknown } }
    ).appState.homeDeepLinkQrCode;
    expect(qrCode).toBeNull();
  });

  it('ignores predict QR deep link params that use a nonstandard port', () => {
    const { Wrapper, store } = createWrapper({
      pathname: DEFAULT_ROUTE,
      search: `?${new URLSearchParams({
        [HomeQueryParams.PredictDeepLinkUrl]:
          'https://link.metamask.com:444/predict',
      }).toString()}`,
      isNetworkMenuOpen: false,
    });

    render(<HomeDeepLinkActions />, { wrapper: Wrapper });

    const qrCode = (
      store.getState() as { appState: { homeDeepLinkQrCode: unknown } }
    ).appState.homeDeepLinkQrCode;
    expect(qrCode).toBeNull();
  });

  it('ignores trending QR deep link params that do not point to /trending', () => {
    const { Wrapper, store } = createWrapper({
      pathname: DEFAULT_ROUTE,
      search: `?${new URLSearchParams({
        [HomeQueryParams.TrendingDeepLinkUrl]:
          'https://link.metamask.io/rewards?referral=ABC123',
      }).toString()}`,
      isNetworkMenuOpen: false,
    });

    render(<HomeDeepLinkActions />, { wrapper: Wrapper });

    const qrCode = (
      store.getState() as { appState: { homeDeepLinkQrCode: unknown } }
    ).appState.homeDeepLinkQrCode;
    expect(qrCode).toBeNull();
  });
});
