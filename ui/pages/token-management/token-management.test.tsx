import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import {
  en as messages,
  renderWithProvider,
} from '../../../test/lib/render-helpers-navigate';
import configureStore from '../../store/store';
import mockState from '../../../test/data/mock-state.json';
import {
  CUSTOM_TOKEN_IMPORT_ROUTE,
  TOKEN_MANAGEMENT_ROUTE,
} from '../../helpers/constants/routes';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import { AssetType } from '../../../shared/constants/transaction';
import { TokenManagementPage } from './token-management';

const METRICS_PROPERTIES = {
  assetType: 'asset_type',
  chainId: 'chain_id',
  tokenContractAddress: 'token_contract_address',
  tokenDecimalPrecision: 'token_decimal_precision',
  tokenStandard: 'token_standard',
  tokenSymbol: 'token_symbol',
  viewState: 'view_state',
} as const;

const mockTokenManagementLocationState = {
  current: null as unknown,
};

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useLocation: () => ({
      pathname: '/token-management',
      search: '',
      hash: '',
      state: mockTokenManagementLocationState.current,
      key: 'token-management-test',
    }),
  };
});

jest.mock('../../selectors/assets', () => ({
  ...jest.requireActual('../../selectors/assets'),
  getAssetsBySelectedAccountGroup: (state: {
    metamask?: {
      accountGroupAssets?: Record<string, unknown[]>;
    };
  }) => state.metamask?.accountGroupAssets ?? {},
}));

jest.mock('../../store/actions', () => {
  const actual = jest.requireActual('../../store/actions');
  return {
    ...actual,
    addCustomAsset: jest.fn(() => () => Promise.resolve()),
    addImportedTokens: jest.fn(() => () => Promise.resolve()),
    hideAsset: jest.fn(() => () => Promise.resolve()),
    ignoreTokens: jest.fn(() => () => Promise.resolve()),
    multichainAddAssets: jest.fn(() => () => Promise.resolve()),
    multichainIgnoreAssets: jest.fn(() => () => Promise.resolve()),
  };
});

type MockedTokenManagementActions = {
  addCustomAsset: jest.Mock;
  addImportedTokens: jest.Mock;
  hideAsset: jest.Mock;
  ignoreTokens: jest.Mock;
  multichainAddAssets: jest.Mock;
  multichainIgnoreAssets: jest.Mock;
};

const getMockedActions = () =>
  jest.requireMock('../../store/actions') as MockedTokenManagementActions;

type MockSearchResult = {
  assetId: string;
  symbol: string;
  decimals: number;
  name: string;
};

type MockSearchState = {
  results: MockSearchResult[];
  isLoading: boolean;
  isFetchingNextPage: boolean;
  error: Error | null;
  hasNextPage: boolean;
  fetchNextPage: jest.Mock;
};

const mockTokenSearch = {
  state: {
    results: [],
    isLoading: false,
    isFetchingNextPage: false,
    error: null,
    hasNextPage: false,
    fetchNextPage: jest.fn(),
  } as MockSearchState,
  spy: jest.fn(),
};

jest.mock('../../hooks/useDebouncedValue', () => ({
  useDebouncedValue: <Value,>(value: Value) => value,
}));

jest.mock('../../hooks/useTokenSearch', () => ({
  useTokenSearch: (options: {
    query: string;
    networks?: string[];
    enableTokenBrowse?: boolean;
  }) => {
    mockTokenSearch.spy(options);
    const trimmed = options.query.trim();
    const {
      results,
      isLoading,
      isFetchingNextPage,
      error,
      hasNextPage,
      fetchNextPage,
    } = mockTokenSearch.state;
    return {
      data:
        trimmed.length > 0 || options.enableTokenBrowse
          ? {
              data: results,
              count: results.length,
              totalCount: results.length,
              pageInfo: { hasNextPage, endCursor: '' },
            }
          : undefined,
      isFetching: isLoading,
      isLoading,
      isFetchingNextPage,
      hasNextPage,
      fetchNextPage,
      error,
    };
  },
}));

const setTokenSearchState = (next: Partial<MockSearchState>): void => {
  Object.assign(mockTokenSearch.state, next);
};
const resetTokenSearchState = (): void => {
  setTokenSearchState({
    results: [],
    isLoading: false,
    isFetchingNextPage: false,
    error: null,
    hasNextPage: false,
    fetchNextPage: jest.fn(),
  });
  mockTokenSearch.spy.mockClear();
};

describe('TokenManagementPage', () => {
  let consoleWarnSpy: jest.SpyInstance;
  const solanaChainId = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp';
  const solanaTokenAssetId = `${solanaChainId}/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`;

  const mainnetToken = {
    accountId: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
    accountType: 'eip155:eoa',
    assetId: '0x0000000000000000000000000000000000000001',
    address: '0x0000000000000000000000000000000000000001',
    chainId: '0x1',
    image: '',
    name: 'Alpha Token',
    symbol: 'AAA',
    decimals: 18,
    isNative: false,
    rawBalance: '0x1',
    balance: '1.23',
    fiat: {
      balance: 1.23,
      currency: 'usd',
      conversionRate: 1,
    },
  };

  const goerliToken = {
    accountId: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
    accountType: 'eip155:eoa',
    assetId: '0x0000000000000000000000000000000000000002',
    address: '0x0000000000000000000000000000000000000002',
    chainId: '0x5',
    image: '',
    name: 'Beta Token',
    symbol: 'BBB',
    decimals: 6,
    isNative: false,
    rawBalance: '0x1',
    balance: '4.56',
    fiat: {
      balance: 4.56,
      currency: 'usd',
      conversionRate: 1,
    },
  };

  const nativeToken = {
    accountId: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
    accountType: 'eip155:eoa',
    assetId: '0x0000000000000000000000000000000000000000',
    address: '0x0000000000000000000000000000000000000000',
    chainId: '0x1',
    image: '',
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
    isNative: true,
    rawBalance: '0x1',
    balance: '0.001',
    fiat: {
      balance: 10,
      currency: 'usd',
      conversionRate: 10000,
    },
  };

  const solanaToken = {
    accountId: 'solana-account-id',
    accountType: 'solana:data-account',
    assetId: solanaTokenAssetId,
    chainId: solanaChainId,
    image: '',
    name: 'Solana Token',
    symbol: 'SLT',
    decimals: 6,
    isNative: false,
    rawBalance: '0x1',
    balance: '2.5',
    fiat: {
      balance: 2.5,
      currency: 'usd',
      conversionRate: 1,
    },
  };

  beforeEach(() => {
    mockTokenManagementLocationState.current = null;
    resetTokenSearchState();
    const actions = getMockedActions();
    actions.addCustomAsset.mockClear();
    actions.addImportedTokens.mockClear();
    actions.hideAsset.mockClear();
    actions.ignoreTokens.mockClear();
    actions.multichainAddAssets.mockClear();
    actions.multichainIgnoreAssets.mockClear();
    const originalWarn = console.warn;
    consoleWarnSpy = jest
      .spyOn(console, 'warn')
      .mockImplementation((message?: unknown, ...args: unknown[]) => {
        if (typeof message === 'string' && message.includes('componentWill')) {
          return;
        }
        originalWarn(message, ...args);
      });
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  const createState = ({
    enabledNetworks = { '0x1': true },
    enabledNetworkMap = { eip155: enabledNetworks },
    accountGroupAssets = {
      '0x1': [mainnetToken, nativeToken],
      '0x5': [goerliToken],
    },
  }: {
    enabledNetworks?: Record<string, boolean>;
    enabledNetworkMap?: Record<string, Record<string, boolean>>;
    accountGroupAssets?: Record<string, unknown[]>;
  } = {}) => ({
    ...mockState,
    metamask: {
      ...mockState.metamask,
      selectedMultichainNetworkChainId: 'eip155:1',
      useExternalServices: true,
      preferences: {
        ...mockState.metamask.preferences,
        tokenSortConfig: {
          key: 'name',
          order: 'asc',
          sortCallback: 'alphaNumeric',
        },
      },
      enabledNetworkMap,
      networkConfigurationsByChainId: {
        ...mockState.metamask.networkConfigurationsByChainId,
        '0x1': {
          chainId: '0x1',
          name: 'Ethereum Mainnet',
          defaultRpcEndpointIndex: 0,
          rpcEndpoints: [
            {
              networkClientId: 'mainnet',
            },
          ],
        },
        '0x5': {
          chainId: '0x5',
          name: 'Goerli',
          defaultRpcEndpointIndex: 0,
          rpcEndpoints: [
            {
              networkClientId: 'goerli',
            },
          ],
        },
      },
      accountGroupAssets,
    },
  });

  const renderPage = (
    state = createState(),
    routeState?: unknown,
    trackEvent = jest.fn(),
  ) => {
    mockTokenManagementLocationState.current = routeState ?? null;
    const store = configureStore({
      ...state,
    });
    return {
      store,
      ...renderWithProvider(
        <TokenManagementPage />,
        store,
        TOKEN_MANAGEMENT_ROUTE,
        undefined,
        () => trackEvent,
      ),
    };
  };

  it('renders without crashing', () => {
    renderPage();
    expect(screen.getByTestId('token-management-page')).toBeInTheDocument();
    expect(
      screen.getByTestId('token-management-header-back-button'),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(
        messages.enterTokenNameOrAddressManageTokens.message,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('token-management-add-custom-token-button'),
    ).toHaveTextContent('Add a custom token');
    expect(
      screen.queryByTestId('settings-v2-header-close-button'),
    ).not.toBeInTheDocument();
  });

  it('tracks the manage tokens screen opening with the default view state', async () => {
    const trackEvent = jest.fn();
    renderPage(createState(), undefined, trackEvent);

    await waitFor(() =>
      expect(trackEvent).toHaveBeenCalledWith({
        category: MetaMetricsEventCategory.Home,
        event: MetaMetricsEventName.TokenScreenOpened,
        properties: {
          screen: 'manage_tokens',
          [METRICS_PROPERTIES.viewState]: 'default',
        },
      }),
    );
  });

  it('tracks the manage tokens screen opening with the no-results view state', async () => {
    const trackEvent = jest.fn();
    renderPage(
      createState({
        accountGroupAssets: {
          '0x1': [],
        },
      }),
      undefined,
      trackEvent,
    );

    await waitFor(() =>
      expect(trackEvent).toHaveBeenCalledWith({
        category: MetaMetricsEventCategory.Home,
        event: MetaMetricsEventName.TokenScreenOpened,
        properties: {
          screen: 'manage_tokens',
          [METRICS_PROPERTIES.viewState]: 'no_results',
        },
      }),
    );
  });

  it('navigates to the custom token import page from the sticky add custom token button', () => {
    const trackEvent = jest.fn();
    const { store } = renderPage(createState(), undefined, trackEvent);

    const addCustomTokenButton = screen.getByTestId(
      'token-management-add-custom-token-button',
    );

    expect(addCustomTokenButton.parentElement?.className).toMatch(/sticky/u);
    expect(addCustomTokenButton.parentElement?.className).toMatch(/bottom-0/u);

    fireEvent.click(addCustomTokenButton);

    expect(store.getState().appState.importTokensModalOpen).toBeFalsy();
    expect(CUSTOM_TOKEN_IMPORT_ROUTE).toBe('/custom-token-import');
    expect(trackEvent).toHaveBeenCalledWith({
      category: MetaMetricsEventCategory.Navigation,
      event: MetaMetricsEventName.TokenImportButtonClicked,
      properties: {
        location: 'MANAGE_TOKENS_CUSTOM_CTA',
      },
    });
  });

  it('shows and dismisses the custom token success toast from route state', async () => {
    renderPage(createState(), {
      tokenManagementToast: {
        type: 'customTokenAdded',
        symbol: 'APE',
      },
    });

    const toast = await screen.findByTestId(
      'token-management-custom-token-success-toast',
    );
    expect(toast).toHaveTextContent('APE');

    fireEvent.click(screen.getByLabelText(messages.close.message));

    await waitFor(() =>
      expect(
        screen.queryByTestId('token-management-custom-token-success-toast'),
      ).not.toBeInTheDocument(),
    );
  });

  it('shows tokens from the enabled home-page network filter', () => {
    renderPage();

    expect(screen.getByText('Alpha Token')).toBeInTheDocument();
    expect(
      screen.getByText(messages.networkNameEthereum.message),
    ).toBeInTheDocument();
    expect(screen.queryByText('Beta Token')).not.toBeInTheDocument();
    expect(
      screen.getByTestId(
        'token-management-cell-0x1:0x0000000000000000000000000000000000000001-network-badge',
      ),
    ).toBeInTheDocument();
  });

  it('shows tokens from all enabled networks when the home page filter is all networks', () => {
    renderPage(
      createState({
        enabledNetworks: {
          '0x1': true,
          '0x5': true,
        },
      }),
    );

    expect(screen.getByText('Alpha Token')).toBeInTheDocument();
    expect(
      screen.getByText(messages.networkNameEthereum.message),
    ).toBeInTheDocument();
    expect(screen.getByText('Beta Token')).toBeInTheDocument();
    expect(
      screen.getByText(messages.allDefaultNetworks.message),
    ).toBeInTheDocument();
  });

  it('enables API browse results when the page opens for EVM and non-EVM networks', () => {
    renderPage(
      createState({
        enabledNetworkMap: {
          eip155: { '0x1': true },
          solana: { [solanaChainId]: true },
        },
      }),
    );

    expect(mockTokenSearch.spy).toHaveBeenCalledWith(
      expect.objectContaining({
        query: '',
        enableTokenBrowse: true,
        networks: ['eip155:1', solanaChainId],
      }),
    );
  });

  it('drives the search hook with the user query and the enabled networks as CAIP-2 ids', () => {
    renderPage(
      createState({
        enabledNetworks: {
          '0x1': true,
          '0x5': true,
        },
      }),
    );

    fireEvent.change(screen.getByTestId('token-management-search-input'), {
      target: { value: 'Beta' },
    });

    const { calls } = mockTokenSearch.spy.mock;
    expect(calls[calls.length - 1][0]).toEqual(
      expect.objectContaining({
        query: 'Beta',
        networks: ['eip155:1', 'eip155:5'],
      }),
    );
  });

  it('renders API-backed results in place of the home-page list while a query is active', () => {
    setTokenSearchState({
      results: [
        {
          assetId: 'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          symbol: 'USDC',
          decimals: 6,
          name: 'USD Coin',
        },
      ],
    });

    renderPage();

    fireEvent.change(screen.getByTestId('token-management-search-input'), {
      target: { value: 'usdc' },
    });

    expect(screen.queryByText('Alpha Token')).not.toBeInTheDocument();
    expect(screen.getByText('USD Coin')).toBeInTheDocument();
  });

  it('renders imported tokens first and non-imported API browse results below as OFF', () => {
    const apiTokenAssetId =
      'eip155:1/erc20:0x0000000000000000000000000000000000000abc';
    setTokenSearchState({
      results: [
        {
          assetId: apiTokenAssetId,
          symbol: 'CCC',
          decimals: 18,
          name: 'Charlie Token',
        },
      ],
    });

    renderPage();

    const importedRow = screen.getByTestId(
      `token-management-cell-0x1:${mainnetToken.address}`,
    );
    const apiRow = screen.getByTestId(
      `token-management-cell-search-${apiTokenAssetId}`,
    );
    const rows = Array.from(document.querySelectorAll('[data-testid]')).filter(
      (node) => {
        const testId = node.getAttribute('data-testid') ?? '';
        return (
          testId.startsWith('token-management-cell-') &&
          !testId.endsWith('-network-badge') &&
          !testId.endsWith('-toggle')
        );
      },
    );

    expect(rows.indexOf(importedRow)).toBeLessThan(rows.indexOf(apiRow));
    expect(
      (
        screen.getByTestId(
          `token-management-cell-0x1:${mainnetToken.address}-toggle`,
        ) as HTMLInputElement
      ).value,
    ).toBe('true');
    expect(
      (
        screen.getByTestId(
          `token-management-cell-search-${apiTokenAssetId}-toggle`,
        ) as HTMLInputElement
      ).value,
    ).toBe('false');
  });

  it('renders hidden API-backed tokens in the unsearched list as OFF', () => {
    const mainnetTokenAssetId = `eip155:1/erc20:${mainnetToken.address}`;
    setTokenSearchState({
      results: [
        {
          assetId: mainnetTokenAssetId,
          symbol: mainnetToken.symbol,
          decimals: mainnetToken.decimals,
          name: mainnetToken.name,
        },
      ],
    });

    const selectedAddress =
      mockState.metamask.internalAccounts.accounts[
        mockState.metamask.internalAccounts
          .selectedAccount as keyof typeof mockState.metamask.internalAccounts.accounts
      ]?.address;
    if (!selectedAddress) {
      throw new Error('Expected selected account address');
    }

    const baseState = createState({
      accountGroupAssets: {
        '0x1': [nativeToken],
      },
    });
    const stateWithIgnoredToken = {
      ...baseState,
      metamask: {
        ...baseState.metamask,
        allIgnoredTokens: {
          '0x1': {
            [selectedAddress]: [mainnetToken.address],
          },
        },
      },
    };

    renderPage(stateWithIgnoredToken);

    const toggle = screen.getByTestId(
      `token-management-cell-search-${mainnetTokenAssetId.toLowerCase()}-toggle`,
    ) as HTMLInputElement;
    expect(screen.getByText('Alpha Token')).toBeInTheDocument();
    expect(toggle.value).toBe('false');
  });

  it('renders non-EVM API browse results in the unsearched list as OFF', () => {
    const browseAssetId = `${solanaChainId}/token:So11111111111111111111111111111111111111112`;
    setTokenSearchState({
      results: [
        {
          assetId: browseAssetId,
          symbol: 'WSOL',
          decimals: 9,
          name: 'Wrapped SOL',
        },
      ],
    });

    renderPage(
      createState({
        enabledNetworkMap: {
          solana: { [solanaChainId]: true },
        },
        accountGroupAssets: {
          [solanaChainId]: [],
        },
      }),
    );

    const toggle = screen.getByTestId(
      `token-management-cell-search-${browseAssetId.toLowerCase()}-toggle`,
    ) as HTMLInputElement;
    expect(screen.getByText('Wrapped SOL')).toBeInTheDocument();
    expect(toggle.value).toBe('false');
  });

  it('fetches the next API page when the token list is scrolled near the bottom', () => {
    const fetchNextPage = jest.fn().mockResolvedValue(undefined);
    setTokenSearchState({
      results: Array.from({ length: 12 }, (_, index) => ({
        assetId: `eip155:1/erc20:0x${String(index + 100).padStart(40, '0')}`,
        symbol: `T${index}`,
        decimals: 18,
        name: `Token ${index}`,
      })),
      hasNextPage: true,
      fetchNextPage,
    });

    renderPage();

    const list = screen.getByTestId('token-management-page-list');
    Object.defineProperty(list, 'scrollHeight', {
      configurable: true,
      value: 1000,
    });
    Object.defineProperty(list, 'clientHeight', {
      configurable: true,
      value: 500,
    });
    Object.defineProperty(list, 'scrollTop', {
      configurable: true,
      value: 450,
    });

    fireEvent.scroll(list);

    expect(fetchNextPage).toHaveBeenCalledTimes(1);
  });

  it('toggling ON a not-yet-imported search result imports the token and adds it to AssetsController', async () => {
    const usdcAddress = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
    const usdcAssetId = `eip155:1/erc20:${usdcAddress}`;
    setTokenSearchState({
      results: [
        {
          assetId: usdcAssetId,
          symbol: 'USDC',
          decimals: 6,
          name: 'USD Coin',
        },
      ],
    });

    const actions = getMockedActions();

    renderPage();

    fireEvent.change(screen.getByTestId('token-management-search-input'), {
      target: { value: 'usdc' },
    });

    const toggle = screen.getByTestId(
      `token-management-cell-search-${usdcAssetId.toLowerCase()}-toggle`,
    );
    fireEvent.click(toggle);

    await waitFor(() =>
      expect(actions.addImportedTokens).toHaveBeenCalledWith(
        [
          expect.objectContaining({
            address: usdcAddress,
            symbol: 'USDC',
            decimals: 6,
            isERC721: false,
          }),
        ],
        'mainnet',
      ),
    );
    await waitFor(() =>
      expect(actions.addCustomAsset).toHaveBeenCalledWith(
        mainnetToken.accountId,
        usdcAssetId,
      ),
    );
  });

  it('toggling OFF an EVM token defers the hide and keeps the row visible until unmount', async () => {
    const actions = getMockedActions();
    const trackEvent = jest.fn();

    const { unmount } = renderPage(createState(), undefined, trackEvent);

    const toggle = screen.getByTestId(
      `token-management-cell-0x1:${mainnetToken.address}-toggle`,
    ) as HTMLInputElement;
    fireEvent.click(toggle);

    expect(screen.getByText('Alpha Token')).toBeInTheDocument();
    expect(toggle.value).toBe('false');
    expect(actions.ignoreTokens).not.toHaveBeenCalled();
    expect(actions.hideAsset).not.toHaveBeenCalled();
    expect(trackEvent).toHaveBeenCalledWith({
      category: MetaMetricsEventCategory.Wallet,
      event: MetaMetricsEventName.TokenHidden,
      sensitiveProperties: expect.objectContaining({
        [METRICS_PROPERTIES.assetType]: AssetType.token,
        [METRICS_PROPERTIES.chainId]: '0x1',
        location: 'MANAGE_TOKENS',
        [METRICS_PROPERTIES.tokenContractAddress]: mainnetToken.address,
        [METRICS_PROPERTIES.tokenDecimalPrecision]: mainnetToken.decimals,
        [METRICS_PROPERTIES.tokenStandard]: 'ERC20',
        [METRICS_PROPERTIES.tokenSymbol]: mainnetToken.symbol,
      }),
    });

    unmount();

    await waitFor(() =>
      expect(actions.ignoreTokens).toHaveBeenCalledWith({
        tokensToIgnore: [mainnetToken.address],
        dontShowLoadingIndicator: true,
        networkClientId: 'mainnet',
      }),
    );
    await waitFor(() =>
      expect(actions.hideAsset).toHaveBeenCalledWith(
        `eip155:1/erc20:${mainnetToken.address}`,
      ),
    );
  });

  it('commits the staged hide when the user starts typing in the search field', async () => {
    const actions = getMockedActions();

    renderPage();

    const toggle = screen.getByTestId(
      `token-management-cell-0x1:${mainnetToken.address}-toggle`,
    ) as HTMLInputElement;
    fireEvent.click(toggle);
    expect(actions.ignoreTokens).not.toHaveBeenCalled();

    fireEvent.change(screen.getByTestId('token-management-search-input'), {
      target: { value: 'usdc' },
    });

    await waitFor(() =>
      expect(actions.ignoreTokens).toHaveBeenCalledWith({
        tokensToIgnore: [mainnetToken.address],
        dontShowLoadingIndicator: true,
        networkClientId: 'mainnet',
      }),
    );
  });

  it('shows a token hidden by a committed staged hide as OFF in search results', async () => {
    const actions = getMockedActions();
    const mainnetTokenAssetId = `eip155:1/erc20:${mainnetToken.address}`;
    setTokenSearchState({
      results: [
        {
          assetId: mainnetTokenAssetId,
          symbol: mainnetToken.symbol,
          decimals: mainnetToken.decimals,
          name: mainnetToken.name,
        },
      ],
    });

    renderPage();

    const visibleListToggle = screen.getByTestId(
      `token-management-cell-0x1:${mainnetToken.address}-toggle`,
    ) as HTMLInputElement;
    fireEvent.click(visibleListToggle);
    expect(visibleListToggle.value).toBe('false');

    fireEvent.change(screen.getByTestId('token-management-search-input'), {
      target: { value: mainnetToken.name },
    });

    const searchResultToggle = screen.getByTestId(
      `token-management-cell-search-${mainnetTokenAssetId.toLowerCase()}-toggle`,
    ) as HTMLInputElement;
    expect(searchResultToggle.value).toBe('false');

    await waitFor(() =>
      expect(actions.ignoreTokens).toHaveBeenCalledWith({
        tokensToIgnore: [mainnetToken.address],
        dontShowLoadingIndicator: true,
        networkClientId: 'mainnet',
      }),
    );
  });

  it('keeps a hidden search result OFF after the user clears and repeats the search', async () => {
    const actions = getMockedActions();
    const mainnetTokenAssetId = `eip155:1/erc20:${mainnetToken.address}`;
    setTokenSearchState({
      results: [
        {
          assetId: mainnetTokenAssetId,
          symbol: mainnetToken.symbol,
          decimals: mainnetToken.decimals,
          name: mainnetToken.name,
        },
      ],
    });

    renderPage();

    const searchInput = screen.getByTestId('token-management-search-input');
    fireEvent.change(searchInput, {
      target: { value: mainnetToken.name },
    });

    const firstSearchResultToggle = screen.getByTestId(
      `token-management-cell-search-${mainnetTokenAssetId.toLowerCase()}-toggle`,
    ) as HTMLInputElement;
    fireEvent.click(firstSearchResultToggle);
    expect(firstSearchResultToggle.value).toBe('false');

    fireEvent.change(searchInput, { target: { value: '' } });

    await waitFor(() =>
      expect(actions.ignoreTokens).toHaveBeenCalledWith({
        tokensToIgnore: [mainnetToken.address],
        dontShowLoadingIndicator: true,
        networkClientId: 'mainnet',
      }),
    );

    fireEvent.change(searchInput, {
      target: { value: mainnetToken.name },
    });

    const secondSearchResultToggle = screen.getByTestId(
      `token-management-cell-search-${mainnetTokenAssetId.toLowerCase()}-toggle`,
    ) as HTMLInputElement;
    expect(secondSearchResultToggle.value).toBe('false');
  });

  it('commits the staged hide before navigating back', async () => {
    const actions = getMockedActions();
    const mainnetTokenAssetId = `eip155:1/erc20:${mainnetToken.address}`;
    setTokenSearchState({
      results: [
        {
          assetId: mainnetTokenAssetId,
          symbol: mainnetToken.symbol,
          decimals: mainnetToken.decimals,
          name: mainnetToken.name,
        },
      ],
    });

    renderPage();

    fireEvent.change(screen.getByTestId('token-management-search-input'), {
      target: { value: mainnetToken.name },
    });
    fireEvent.click(
      screen.getByTestId(
        `token-management-cell-search-${mainnetTokenAssetId.toLowerCase()}-toggle`,
      ),
    );

    fireEvent.click(screen.getByTestId('token-management-header-back-button'));

    await waitFor(() =>
      expect(actions.ignoreTokens).toHaveBeenCalledWith({
        tokensToIgnore: [mainnetToken.address],
        dontShowLoadingIndicator: true,
        networkClientId: 'mainnet',
      }),
    );
  });

  it('commits the staged hide when the user clicks the Add custom token CTA', async () => {
    const actions = getMockedActions();

    renderPage();

    const toggle = screen.getByTestId(
      `token-management-cell-0x1:${mainnetToken.address}-toggle`,
    ) as HTMLInputElement;
    fireEvent.click(toggle);
    expect(actions.ignoreTokens).not.toHaveBeenCalled();

    fireEvent.click(
      screen.getByTestId('token-management-add-custom-token-button'),
    );

    await waitFor(() =>
      expect(actions.ignoreTokens).toHaveBeenCalledWith({
        tokensToIgnore: [mainnetToken.address],
        dontShowLoadingIndicator: true,
        networkClientId: 'mainnet',
      }),
    );
  });

  it('toggling an EVM token OFF and back ON restores it without dispatching a hide', async () => {
    const actions = getMockedActions();

    const { unmount } = renderPage();

    const toggle = screen.getByTestId(
      `token-management-cell-0x1:${mainnetToken.address}-toggle`,
    ) as HTMLInputElement;

    fireEvent.click(toggle);
    expect(toggle.value).toBe('false');

    fireEvent.click(toggle);
    expect(toggle.value).toBe('true');

    unmount();

    expect(actions.ignoreTokens).not.toHaveBeenCalled();
    expect(actions.hideAsset).not.toHaveBeenCalled();
    expect(actions.multichainIgnoreAssets).not.toHaveBeenCalled();
  });

  it('shows imported EVM tokens from TokensController before balances exist', () => {
    const usdcAddress = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
    const selectedAddress =
      mockState.metamask.internalAccounts.accounts[
        mockState.metamask.internalAccounts
          .selectedAccount as keyof typeof mockState.metamask.internalAccounts.accounts
      ]?.address;
    if (!selectedAddress) {
      throw new Error('Expected selected account address');
    }

    const baseState = createState({
      accountGroupAssets: {
        '0x1': [nativeToken],
      },
    });
    const stateWithImportedToken = {
      ...baseState,
      metamask: {
        ...baseState.metamask,
        allTokens: {
          '0x1': {
            [selectedAddress]: [
              {
                address: usdcAddress,
                symbol: 'USDC',
                decimals: 6,
                name: 'USD Coin',
              },
            ],
          },
        },
      },
    };

    renderPage(stateWithImportedToken);

    expect(screen.getByText('USD Coin')).toBeInTheDocument();
    expect(screen.getByText('0 USDC')).toBeInTheDocument();
    expect(
      screen.getByTestId(`token-management-cell-0x1:${usdcAddress}-toggle`),
    ).toBeInTheDocument();
  });

  it('shows a search result as ON when TokensController already holds the imported address (no balance yet)', () => {
    const usdcAddress = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
    const usdcAssetId = `eip155:1/erc20:${usdcAddress}`;
    setTokenSearchState({
      results: [
        {
          assetId: usdcAssetId,
          symbol: 'USDC',
          decimals: 6,
          name: 'USD Coin',
        },
      ],
    });

    const selectedAddress =
      mockState.metamask.internalAccounts.accounts[
        mockState.metamask.internalAccounts
          .selectedAccount as keyof typeof mockState.metamask.internalAccounts.accounts
      ]?.address;

    const stateWithImportedToken = createState();
    stateWithImportedToken.metamask = {
      ...stateWithImportedToken.metamask,
      allTokens: {
        '0x1': {
          [selectedAddress as string]: [
            { address: usdcAddress, symbol: 'USDC', decimals: 6 },
          ],
        },
      },
    };

    renderPage(stateWithImportedToken);

    fireEvent.change(screen.getByTestId('token-management-search-input'), {
      target: { value: 'usdc' },
    });

    const toggle = screen.getByTestId(
      `token-management-cell-search-${usdcAssetId.toLowerCase()}-toggle`,
    ) as HTMLInputElement;
    expect(toggle.value).toBe('true');
  });

  it('shows an ignored EVM search result as OFF after reopening token management', () => {
    const mainnetTokenAssetId = `eip155:1/erc20:${mainnetToken.address}`;
    setTokenSearchState({
      results: [
        {
          assetId: mainnetTokenAssetId,
          symbol: mainnetToken.symbol,
          decimals: mainnetToken.decimals,
          name: mainnetToken.name,
        },
      ],
    });

    const selectedAddress =
      mockState.metamask.internalAccounts.accounts[
        mockState.metamask.internalAccounts
          .selectedAccount as keyof typeof mockState.metamask.internalAccounts.accounts
      ]?.address;
    if (!selectedAddress) {
      throw new Error('Expected selected account address');
    }

    const baseState = createState();
    const stateWithIgnoredToken = {
      ...baseState,
      metamask: {
        ...baseState.metamask,
        allTokens: {
          '0x1': {
            [selectedAddress]: [
              {
                address: mainnetToken.address,
                symbol: mainnetToken.symbol,
                decimals: mainnetToken.decimals,
              },
            ],
          },
        },
        allIgnoredTokens: {
          '0x1': {
            [selectedAddress]: [mainnetToken.address],
          },
        },
      },
    };

    renderPage(stateWithIgnoredToken);

    fireEvent.change(screen.getByTestId('token-management-search-input'), {
      target: { value: mainnetToken.name },
    });

    const toggle = screen.getByTestId(
      `token-management-cell-search-${mainnetTokenAssetId.toLowerCase()}-toggle`,
    ) as HTMLInputElement;
    expect(toggle.value).toBe('false');
  });

  it('keeps stale results visible while the next query is being fetched', () => {
    const initial = [
      {
        assetId: 'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        symbol: 'USDC',
        decimals: 6,
        name: 'USD Coin',
      },
    ];
    setTokenSearchState({ results: initial });
    renderPage();

    fireEvent.change(screen.getByTestId('token-management-search-input'), {
      target: { value: 'usdc' },
    });
    expect(screen.getByText('USD Coin')).toBeInTheDocument();

    setTokenSearchState({ results: initial, isLoading: true });
    fireEvent.change(screen.getByTestId('token-management-search-input'), {
      target: { value: 'usdcc' },
    });

    expect(screen.getByText('USD Coin')).toBeInTheDocument();
    expect(
      screen.queryByTestId('token-management-search-loading'),
    ).not.toBeInTheDocument();
  });

  it('shows the empty-state copy when the API returns no matches', () => {
    setTokenSearchState({ results: [] });
    renderPage();

    fireEvent.change(screen.getByTestId('token-management-search-input'), {
      target: { value: 'unknown' },
    });

    expect(
      screen.getByTestId('token-management-empty-state'),
    ).toHaveTextContent(messages.noTokensMatchSearch.message);
  });

  it('shows the multichain network name for a non-EVM search result', () => {
    const solanaResultId = `${solanaChainId}/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`;
    setTokenSearchState({
      results: [
        {
          assetId: solanaResultId,
          symbol: 'USDC',
          decimals: 6,
          name: 'USD Coin',
        },
      ],
    });

    const baseState = createState({
      enabledNetworkMap: {
        eip155: { '0x1': true },
        solana: { [solanaChainId]: true },
      },
      accountGroupAssets: {
        [solanaChainId]: [solanaToken],
      },
    });
    const stateWithSolanaAccount = {
      ...baseState,
      metamask: {
        ...baseState.metamask,
        internalAccounts: {
          ...baseState.metamask.internalAccounts,
          accounts: {
            ...baseState.metamask.internalAccounts.accounts,
            'solana-internal-account': {
              id: 'solana-internal-account',
              address: 'SolanaAddress',
              type: 'solana:data-account',
              scopes: [solanaChainId],
              options: {},
              methods: [],
              metadata: { name: 'Solana 1', keyring: { type: 'Snap Keyring' } },
            },
          },
        },
      },
    };
    renderPage(
      stateWithSolanaAccount as unknown as ReturnType<typeof createState>,
    );

    fireEvent.change(screen.getByTestId('token-management-search-input'), {
      target: { value: 'usdc' },
    });

    const row = screen.getByTestId(
      `token-management-cell-search-${solanaResultId.toLowerCase()}`,
    );
    expect(row.textContent ?? '').not.toContain(solanaChainId);
    expect(row.textContent ?? '').toContain(messages.networkNameSolana.message);
  });

  it('surfaces a friendly error message when the search request fails', () => {
    setTokenSearchState({ error: new Error('boom') });
    renderPage();

    fireEvent.change(screen.getByTestId('token-management-search-input'), {
      target: { value: 'usdc' },
    });

    expect(
      screen.getByTestId('token-management-search-error'),
    ).toBeInTheDocument();
  });

  it('hides the Add a custom token CTA when only a non-EVM network is enabled', () => {
    renderPage(
      createState({
        enabledNetworkMap: {
          solana: { [solanaChainId]: true },
        },
        accountGroupAssets: {
          [solanaChainId]: [solanaToken],
        },
      }),
    );

    expect(
      screen.queryByTestId('token-management-add-custom-token-button'),
    ).not.toBeInTheDocument();
  });

  it('renders an enabled toggle for non-native Solana tokens', () => {
    renderPage(
      createState({
        enabledNetworkMap: {
          eip155: { '0x1': true },
          solana: { [solanaChainId]: true },
        },
        accountGroupAssets: {
          '0x1': [mainnetToken],
          [solanaChainId]: [solanaToken],
        },
      }),
    );

    const solanaToggle = screen.getByTestId(
      `token-management-cell-${solanaChainId}:${solanaTokenAssetId.toLowerCase()}-toggle`,
    );

    expect(screen.getByText('Solana Token')).toBeInTheDocument();
    expect(
      screen.getByTestId(
        `token-management-cell-${solanaChainId}:${solanaTokenAssetId.toLowerCase()}-network-badge`,
      ),
    ).toBeInTheDocument();
    expect(solanaToggle).toBeInTheDocument();
    expect(solanaToggle.closest('.toggle-button')).toHaveClass(
      'toggle-button--on',
    );
    expect(solanaToggle.closest('.toggle-button')).not.toHaveClass(
      'toggle-button--disabled',
    );
  });

  it('renders a disabled on toggle for native tokens', () => {
    renderPage();

    const nativeToggle = screen.getByTestId(
      'token-management-cell-0x1:0x0000000000000000000000000000000000000000-toggle',
    );

    expect(nativeToggle).toBeInTheDocument();
    expect(nativeToggle.closest('.toggle-button')).toHaveClass(
      'toggle-button--on',
      'toggle-button--disabled',
    );
    expect(
      screen.getByTestId(
        'token-management-cell-0x1:0x0000000000000000000000000000000000000001-toggle',
      ),
    ).toBeInTheDocument();
  });
});
