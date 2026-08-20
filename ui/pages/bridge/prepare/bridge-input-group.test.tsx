import React from 'react';
import {
  FeatureId,
  RequestStatus,
  UnifiedSwapBridgeEventName,
  formatChainIdToCaip,
} from '@metamask/bridge-controller';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { CaipAssetType } from '@metamask/utils';
import {
  en as messages,
  renderWithProvider,
} from '../../../../test/lib/render-helpers-navigate';
import { SWAP_PATH } from '../../../helpers/constants/routes';
import { createBridgeMockStore } from '../../../../test/data/bridge/mock-bridge-store';
import { MultichainNetworks } from '../../../../shared/constants/multichain/networks';
import { flushPromises } from '../../../../test/lib/timer-helpers';
import {
  getFromChains,
  getFromToken,
  getToChains,
  getToToken,
} from '../../../ducks/bridge/selectors';
import * as actions from '../../../ducks/bridge/actions';
import configureStore from '../../../store/store';
import { setBackgroundConnection } from '../../../store/background-connection';
import { toBridgeToken } from '../../../ducks/bridge/utils';
import BridgeAssetPickerPage from '../asset-picker';
import { BridgeInputGroup } from './bridge-input-group';

const mockUseVirtualizer = jest.fn();
const mockNavigate = jest.fn();
const mockUseLocation = jest.fn();

const mockTrackUnifiedSwapBridgeEvent = jest.fn();

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockUseLocation(),
  };
});

jest.mock('lodash/debounce', () => ({
  ...jest.requireActual('lodash/debounce'),
  debounce: (fn: (...args: unknown[]) => void) => fn,
}));

jest.mock('@tanstack/react-virtual', () => {
  const actual = jest.requireActual('@tanstack/react-virtual');
  return {
    ...actual,
    useVirtualizer: (...args: unknown[]) => mockUseVirtualizer(...args),
  };
});

const tokens = [
  {
    name: 'USD Coin',
    symbol: 'USDC',
    chainId: 'eip155:1',
    assetId:
      'eip155:1/erc20:0xaf88d065e77c8cC2239327C5EDb3A432268e5831' as CaipAssetType,
    decimals: 6,
  },
  {
    name: 'USDT',
    symbol: 'USDT',
    chainId: 'eip155:1',
    assetId:
      'eip155:1/erc20:0xaf88d065e77c8cC2239327C5EDb3A432268e5832' as CaipAssetType,
    decimals: 6,
  },
  {
    name: 'USDC',
    symbol: 'USDC',
    chainId: 'eip155:59144',
    assetId:
      'eip155:59144/erc20:0xaf88d065e77c8cC2239327C5EDb3A432268e5833' as CaipAssetType,
    decimals: 6,
  },
];

const tokensWithBalance = [
  {
    decimals: 10,
    symbol: 'UNI',
    name: 'Uniswap',
    chainId: 'eip155:1',
    assetId:
      'eip155:1/erc20:0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984' as CaipAssetType,
    balance: '.0000001',
    tokenFiatAmount: '0',
  },
  {
    decimals: 9,
    symbol: 'LINK',
    name: 'Link',
    chainId: 'eip155:1',
    assetId:
      'eip155:1/erc20:0x514910771AF9Ca656af840dff83E8264EcF986CA' as CaipAssetType,
    balance: '1',
    tokenFiatAmount: 100,
  },
];

const mockUsePopularTokens = jest
  .fn()
  .mockReturnValue({ popularTokensList: tokensWithBalance, isLoading: false });

const mockUseTokenSearchResults = jest.fn().mockReturnValue({
  searchResults: [],
  isSearchResultsLoading: false,
  onFetchMoreResults: jest.fn(),
  hasMoreResults: false,
});

jest.mock('../../../hooks/bridge/usePopularTokens', () => ({
  usePopularTokens: (...args: unknown[]) => mockUsePopularTokens(...args),
}));
jest.mock('../../../hooks/bridge/useTokenSearchResults', () => ({
  useTokenSearchResults: (...args: unknown[]) =>
    mockUseTokenSearchResults(...args),
}));

const ASSET_PICKER_BUTTON_TEST_ID = 'asset-picker-button';

const InputGroup = ({
  mockState,
  ...props
}: {
  mockState: ReturnType<typeof createBridgeMockStore>;
} & Partial<React.ComponentProps<typeof BridgeInputGroup>>) => {
  return (
    <BridgeInputGroup
      token={getFromToken(mockState)}
      buttonProps={{ testId: ASSET_PICKER_BUTTON_TEST_ID }}
      amountFieldProps={{
        testId: 'from-amount',
        autoFocus: true,
        value: '1',
      }}
      isDestination={false}
      setIsAssetPickerOpen={jest.fn()}
      {...props}
    />
  );
};

const renderBridgeInputGroup = (
  stateOverrides: Parameters<typeof createBridgeMockStore>[0] = {},
  props: Partial<React.ComponentProps<typeof BridgeInputGroup>> = {},
) => {
  const mockState = createBridgeMockStore(stateOverrides);

  return renderWithProvider(
    <InputGroup mockState={mockState} {...props} />,
    configureStore(mockState),
  );
};

// When the network management feature flag is enabled, token selection happens
// on a dedicated page instead of the modal. This renders that page directly,
// mirroring how `BridgeInputGroup` navigates to it. The picker's "source vs
// destination" mode is derived from the bridge slice flags.
const renderAssetPickerPage = (
  stateOverrides: Parameters<typeof createBridgeMockStore>[0] = {},
  {
    isDestination = false,
    isSrcAssetPickerOpen,
    isDestAssetPickerOpen,
  }: {
    isDestination?: boolean;
    isSrcAssetPickerOpen?: boolean;
    isDestAssetPickerOpen?: boolean;
  } = {},
) => {
  const mockState = createBridgeMockStore({
    ...stateOverrides,
    bridgeSliceOverrides: {
      ...stateOverrides.bridgeSliceOverrides,
      isSrcAssetPickerOpen: isSrcAssetPickerOpen ?? !isDestination,
      isDestAssetPickerOpen: isDestAssetPickerOpen ?? isDestination,
    },
  });

  return renderWithProvider(
    <BridgeAssetPickerPage />,
    configureStore(mockState),
  );
};

const setupFetchMock = (
  searchResults = tokens,
  hasNextPage = false,
  popularResults = tokens.slice(0, 2),
) => {
  mockUsePopularTokens.mockReturnValue({
    popularTokensList: popularResults.map((token) => toBridgeToken(token)),
    isLoading: false,
  });
  mockUseTokenSearchResults.mockReturnValue({
    searchResults: searchResults.map((token) => toBridgeToken(token)),
    isSearchResultsLoading: false,
    onFetchMoreResults: jest.fn(),
    hasMoreResults: hasNextPage,
  });
};

const fillSearchInput = async (searchQuery: string, expectedValue?: string) => {
  const searchInput = screen.getByTestId('bridge-asset-picker-search-input');
  await act(async () => {
    await searchInput.focus();
    await userEvent.keyboard(searchQuery);
  });
  await waitFor(() => {
    expect(screen.getByTestId('bridge-asset-picker-search-input')).toHaveValue(
      expectedValue ?? searchQuery,
    );
  });
};

describe('BridgeInputGroup', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    mockTrackUnifiedSwapBridgeEvent.mockResolvedValue(undefined);
    setBackgroundConnection({
      trackUnifiedSwapBridgeEvent: mockTrackUnifiedSwapBridgeEvent,
      getStatePatches: jest.fn(),
    } as never);
    mockUseVirtualizer.mockReturnValue({
      getVirtualItems: () =>
        tokens.map((token, index) => ({
          index,
          start: index * 78,
          key: token.assetId,
        })),
      getTotalSize: () => 78 * tokens.length,
      measureElement: () => 78,
    });
    mockUseLocation.mockReturnValue({
      pathname: '/',
      search: '',
      hash: '',
      state: null,
      key: 'default',
    });
  });

  // @ts-expect-error - each is a valid test function
  it.each([
    [false, 'source'],
    [true, 'destination'],
  ] as const)(
    'tracks opening the %s asset picker',
    async (isDestination: boolean, assetLocation: 'source' | 'destination') => {
      renderBridgeInputGroup({}, { isDestination });

      await act(async () => {
        await userEvent.click(screen.getByTestId(ASSET_PICKER_BUTTON_TEST_ID));
      });
      await flushPromises();

      expect(mockTrackUnifiedSwapBridgeEvent).toHaveBeenCalledWith(
        UnifiedSwapBridgeEventName.AssetPickerOpened,
        {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          asset_location: assetLocation,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          feature_id: FeatureId.UNIFIED_SWAP_BRIDGE,
        },
      );
    },
  );

  it('passes fetched security metadata to the selected asset button', () => {
    const { getByTestId } = renderBridgeInputGroup(
      {},
      { tokenSecurityData: { isVerified: true } },
    );

    expect(
      getByTestId('bridge-selected-asset-verified-badge'),
    ).toBeInTheDocument();
  });

  it('leaves the selected asset button unchanged without fetched metadata', () => {
    const { queryByTestId } = renderBridgeInputGroup();

    expect(
      queryByTestId('bridge-selected-asset-verified-badge'),
    ).not.toBeInTheDocument();
  });

  it('moves the caret only when the input denomination changes', () => {
    const mockState = createBridgeMockStore();
    const view = renderWithProvider(
      <InputGroup mockState={mockState} />,
      configureStore(mockState),
    );
    const input = view.getByTestId('from-amount') as HTMLInputElement;
    const setSelectionRangeSpy = jest.spyOn(input, 'setSelectionRange');

    act(() => {
      view.rerender(
        <InputGroup
          mockState={mockState}
          amountFieldProps={{
            testId: 'from-amount',
            autoFocus: true,
            value: '12',
          }}
        />,
      );
    });

    expect(setSelectionRangeSpy).not.toHaveBeenCalled();

    act(() => {
      view.rerender(<InputGroup mockState={mockState} amountInputPrefix="$" />);
    });

    expect(setSelectionRangeSpy).toHaveBeenCalledTimes(1);
  });

  it('renders a destination amount skeleton while the quote is loading', () => {
    setupFetchMock();

    const { getByTestId, queryByTestId, queryByText } = renderBridgeInputGroup(
      {
        bridgeStateOverrides: {
          quotesLoadingStatus: RequestStatus.LOADING,
        },
      },
      {
        isDestination: true,
        showAmountSkeleton: true,
        amountFieldProps: {
          testId: 'to-amount',
          autoFocus: false,
          value: '0',
          readOnly: true,
          disabled: true,
          className: 'amount-input',
        },
      },
    );

    expect(getByTestId('to-amount-loading-skeleton')).toBeInTheDocument();
    expect(queryByTestId('to-amount')).not.toBeInTheDocument();
    expect(queryByText(/Calculating/u)).not.toBeInTheDocument();
  });

  it('replaces the asset picker route when closing the page', async () => {
    setupFetchMock();

    renderAssetPickerPage();

    await waitFor(() => {
      expect(
        screen.getByTestId('bridge-asset-picker-search-input'),
      ).toBeVisible();
    });

    await userEvent.click(screen.getByLabelText(messages.back.message));

    expect(mockNavigate).toHaveBeenCalledWith(
      { pathname: SWAP_PATH, search: '' },
      { replace: true, state: { token: undefined } },
    );
  });

  it('clears picker flags when browser navigation unmounts the page', async () => {
    setupFetchMock();
    const setDestinationPickerOpenSpy = jest.spyOn(
      actions,
      'setIsDestAssetPickerOpen',
    );
    const setSourcePickerOpenSpy = jest.spyOn(
      actions,
      'setIsSrcAssetPickerOpen',
    );

    const { unmount } = renderAssetPickerPage(
      {},
      {
        isSrcAssetPickerOpen: true,
        isDestAssetPickerOpen: false,
      },
    );

    await waitFor(() => {
      expect(
        screen.getByTestId('bridge-asset-picker-search-input'),
      ).toBeVisible();
    });

    unmount();

    expect(setDestinationPickerOpenSpy).not.toHaveBeenCalled();
    expect(setSourcePickerOpenSpy).not.toHaveBeenCalled();
    setDestinationPickerOpenSpy.mockRestore();
    setSourcePickerOpenSpy.mockRestore();
  });

  it('uses the source picker when both picker flags are stale-open', async () => {
    setupFetchMock(
      undefined,
      false,
      tokens.slice(0, 2).concat(tokensWithBalance),
    );

    const stateOverrides = {
      featureFlagOverrides: {
        bridgeConfig: {
          chainRanking: [
            { chainId: MultichainNetworks.SOLANA },
            { chainId: MultichainNetworks.BITCOIN },
            { chainId: formatChainIdToCaip(1) },
            { chainId: formatChainIdToCaip(10) },
            { chainId: formatChainIdToCaip(137) },
            { chainId: formatChainIdToCaip(56) },
            { chainId: MultichainNetworks.TRON },
          ],
        },
      },
    };

    const { getByTestId } = renderAssetPickerPage(stateOverrides, {
      isSrcAssetPickerOpen: true,
      isDestAssetPickerOpen: true,
    });

    await waitFor(() => {
      expect(getByTestId('bridge-asset-picker-search-input')).toBeVisible();
    });

    await act(async () => {
      await getByTestId('multichain-asset-picker__network').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('bridge-network-picker-popover')).toBeVisible();
    });

    expect(
      screen.getAllByTestId(/bridge-network-picker-popover-item-/u),
    ).toHaveLength(6);
  });

  // @ts-expect-error - each is a valid test function
  it.each([
    [
      'source',
      getFromToken,
      undefined,
      getFromChains,
      false,
      { expectedDefaultToken: 'ETH', expectedNetworkCount: 6 },
    ],
    [
      'destination',
      getToToken,
      {
        eip155: {
          '0x1': true,
        },
      },
      getToChains,
      true,
      { expectedDefaultToken: 'mUSD', expectedNetworkCount: 7 },
    ],
  ])(
    'should render %s networks',
    async (
      _description: string,
      getToken: typeof getFromToken,
      enabledNetworkMap: Record<string, Record<string, boolean>>,
      _getChains: typeof getFromChains,
      isDestination: boolean,
      {
        expectedDefaultToken,
        expectedNetworkCount,
      }: { expectedDefaultToken: string; expectedNetworkCount: number },
    ) => {
      setupFetchMock(
        undefined,
        false,
        tokens.slice(0, 2).concat(tokensWithBalance),
      );

      mockUseLocation.mockReturnValue({
        pathname: '/',
        search: isDestination ? '?field=dest' : '',
        hash: '',
        state: null,
        key: 'default',
      });
      const stateOverrides = {
        metamaskStateOverrides: {
          enabledNetworkMap,
        },
        featureFlagOverrides: {
          bridgeConfig: {
            chainRanking: [
              { chainId: MultichainNetworks.SOLANA },
              { chainId: MultichainNetworks.BITCOIN },
              { chainId: formatChainIdToCaip(1) },
              { chainId: formatChainIdToCaip(10) },
              { chainId: formatChainIdToCaip(137) },
              { chainId: formatChainIdToCaip(56) },
              { chainId: MultichainNetworks.TRON },
            ],
          },
        },
      };
      const mockState = createBridgeMockStore(stateOverrides);
      // Ensure the default token is what we expect for this picker mode.
      expect(getToken(mockState).symbol).toBe(expectedDefaultToken);

      const { getByTestId } = renderAssetPickerPage(stateOverrides, {
        isDestination,
      });

      await waitFor(() => {
        expect(getByTestId('bridge-asset-picker-search-input')).toBeVisible();
      });
      await flushPromises();

      const networkPicker = getByTestId('multichain-asset-picker__network');
      await fillSearchInput('SD');
      await act(async () => {
        await networkPicker.click();
      });

      const networkPickerPopover = screen.getByTestId(
        'bridge-network-picker-popover',
      );
      await waitFor(() => {
        expect(networkPickerPopover).toBeVisible();
      });

      expect(networkPickerPopover).toMatchSnapshot();

      const networkItems = screen.getAllByTestId(
        /bridge-network-picker-popover-item-/u,
      );
      expect(networkItems).toHaveLength(expectedNetworkCount);

      const solanaNetworkItem = screen.getByTestId(
        'network-list-item-solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
      );
      // `mousedown` reproduces the real-browser sequence: the asset picker's
      // outside-click handler runs on `mousedown` (before `click`) and must not
      // close the asset picker when selecting a network.
      fireEvent.mouseDown(solanaNetworkItem);
      fireEvent.click(solanaNetworkItem);
      await waitFor(() => {
        // The asset picker stays open; only the network picker closes.
        expect(getByTestId('bridge-asset-picker-search-input')).toBeVisible();
        expect(
          screen.queryByTestId('bridge-network-picker-popover'),
        ).not.toBeInTheDocument();
        expect(mockUsePopularTokens.mock.lastCall).toStrictEqual([
          expect.objectContaining({
            accountGroupId: 'entropy:01K2FF18CTTXJYD34R78X4N1N1/0',
            assetsToInclude: [
              {
                accountType: 'solana:data-account',
                assetId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
                balance: '1.530',
                chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
                decimals: 18,
                iconUrl:
                  'https://static.cx.metamask.io/api/v2/tokenIcons/assets/solana/5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44/501.png',
                name: 'Solana',
                rwaData: undefined,
                symbol: 'SOL',
                tokenFiatAmount: 210.8493,
                isVerified: undefined,
                securityData: undefined,
              },
              {
                accountType: 'solana:data-account',
                assetId:
                  'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
                balance: '2.043238',
                chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
                decimals: 6,
                iconUrl:
                  'https://static.cx.metamask.io/api/v2/tokenIcons/assets/solana/5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v.png',
                name: 'USDC',
                rwaData: undefined,
                symbol: 'USDC',
                tokenFiatAmount: 2.04284978478,
                isVerified: undefined,
                securityData: undefined,
              },
            ],
            fetchTokens: expect.any(Function),
          }),
        ]);
        expect(mockUseTokenSearchResults.mock.lastCall).toStrictEqual([
          expect.objectContaining({
            accountGroupId: 'entropy:01K2FF18CTTXJYD34R78X4N1N1/0',
            assetsToInclude: [
              {
                accountType: 'solana:data-account',
                assetId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
                balance: '1.530',
                chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
                decimals: 18,
                iconUrl:
                  'https://static.cx.metamask.io/api/v2/tokenIcons/assets/solana/5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44/501.png',
                name: 'Solana',
                rwaData: undefined,
                symbol: 'SOL',
                tokenFiatAmount: 210.8493,
              },
              {
                accountType: 'solana:data-account',
                assetId:
                  'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
                balance: '2.043238',
                chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
                decimals: 6,
                iconUrl:
                  'https://static.cx.metamask.io/api/v2/tokenIcons/assets/solana/5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v.png',
                name: 'USDC',
                rwaData: undefined,
                symbol: 'USDC',
                tokenFiatAmount: 2.04284978478,
              },
            ],
            chainIds: new Set(['solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp']),
            searchQuery: 'SD',
          }),
        ]);
      });
    },
  );
});
