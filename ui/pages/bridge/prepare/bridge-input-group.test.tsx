import React, { useState } from 'react';
import {
  RequestStatus,
  formatChainIdToCaip,
} from '@metamask/bridge-controller';
import { act, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { CaipAssetType } from '@metamask/utils';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import {
  createBridgeMockStore,
  MOCK_EVM_ACCOUNT,
} from '../../../../test/data/bridge/mock-bridge-store';
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
import { toBridgeToken } from '../../../ducks/bridge/utils';
import { BridgeInputGroup } from './bridge-input-group';

const mockUseVirtualizer = jest.fn();

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
  const [isAssetPickerOpen, setIsAssetPickerOpen] = useState(false);

  return (
    <BridgeInputGroup
      header={'Swap'}
      token={getFromToken(mockState)}
      onAssetChange={(asset) => {
        actions.setFromToken(asset);
      }}
      networks={getFromChains(mockState)}
      accountAddress={MOCK_EVM_ACCOUNT.address}
      buttonProps={{ testId: ASSET_PICKER_BUTTON_TEST_ID }}
      amountFieldProps={{
        testId: 'from-amount',
        autoFocus: true,
        value: '1',
      }}
      isDestination={false}
      isAssetPickerOpen={isAssetPickerOpen}
      setIsAssetPickerOpen={setIsAssetPickerOpen}
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

const openAssetPicker = async () => {
  await act(async () => {
    await userEvent.click(screen.getByTestId(ASSET_PICKER_BUTTON_TEST_ID));
  });
  await flushPromises();
  await waitFor(() => {
    expect(screen.getByTestId('bridge-asset-picker-modal')).toBeVisible();
  });
  await flushPromises();
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
  });

  it('should search for tokens', async () => {
    setupFetchMock();
    const { getByTestId } = renderBridgeInputGroup();

    expect(getByTestId(ASSET_PICKER_BUTTON_TEST_ID)).toHaveTextContent('ETH');

    await openAssetPicker();
    expect(getByTestId('bridge-asset-picker-modal')).toMatchSnapshot();
    expect(
      screen
        .getAllByTestId('bridge-asset')
        .map(({ textContent }) => textContent),
    ).toMatchInlineSnapshot(`
      [
        "USDCUSD Coin",
        "USDTUSDT",
      ]
    `);

    await fillSearchInput('U');
    await fillSearchInput('SD', 'USD');
    await waitFor(() => {
      expect(
        screen
          .getAllByTestId('bridge-asset')
          .map(({ textContent }) => textContent),
      ).toMatchInlineSnapshot(`
              [
                "USDCUSD Coin",
                "USDTUSDT",
                "USDCUSDC",
              ]
          `);
    });

    expect(mockUseTokenSearchResults.mock.lastCall).toMatchSnapshot();

    expect(getByTestId('bridge-asset-picker-modal')).toMatchSnapshot();
    expect(mockUseVirtualizer).toHaveBeenCalledWith({
      count: 3,
      gap: 0,
      estimateSize: expect.any(Function),
      overscan: 10,
      getScrollElement: expect.any(Function),
      initialOffset: expect.any(Number),
      onChange: expect.any(Function),
    });
  });

  it('should search for tokens with hasNextPage', async () => {
    setupFetchMock(tokens.slice(0, 1), true);

    const { getByTestId, getAllByTestId } = renderBridgeInputGroup();
    expect(getByTestId(ASSET_PICKER_BUTTON_TEST_ID)).toHaveTextContent('ETH');

    await openAssetPicker();
    expect(
      screen
        .getAllByTestId('bridge-asset')
        .map(({ textContent }) => textContent),
    ).toMatchInlineSnapshot(`
      [
        "USDCUSD Coin",
        "USDTUSDT",
      ]
    `);

    await fillSearchInput('USD');
    await waitFor(() => {
      expect(
        screen
          .getAllByTestId('bridge-asset')
          .map(({ textContent }) => textContent),
      ).toMatchInlineSnapshot(`
        [
          "USDCUSD Coin",
        ]
      `);
    });
    expect(mockUseTokenSearchResults.mock.lastCall).toMatchSnapshot();
    expect(getAllByTestId('bridge-asset-loading-skeleton')).toHaveLength(2);

    expect(mockUseVirtualizer).toHaveBeenCalledWith({
      count: 2,
      gap: 0,
      estimateSize: expect.any(Function),
      overscan: 10,
      getScrollElement: expect.any(Function),
      initialOffset: expect.any(Number),
      onChange: expect.any(Function),
    });
  });

  it('should render popular tokens', async () => {
    setupFetchMock(
      undefined,
      false,
      tokens.slice(0, 2).concat(tokensWithBalance),
    );

    const { getByTestId } = renderBridgeInputGroup();

    expect(getByTestId(ASSET_PICKER_BUTTON_TEST_ID)).toHaveTextContent('ETH');

    await openAssetPicker();

    expect(
      screen
        .getAllByTestId('bridge-asset')
        .map(({ textContent }) => textContent),
    ).toMatchInlineSnapshot(`
        [
          "USDCUSD Coin",
          "USDTUSDT",
          "UNI$0.00Uniswap<0.000001 UNI",
        ]
      `);

    expect(mockUsePopularTokens.mock.lastCall).toMatchSnapshot();

    expect(mockUseVirtualizer.mock.lastCall).toStrictEqual([
      expect.objectContaining({
        count: 4,
        gap: 0,
        overscan: 10,
      }),
    ]);
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

  // @ts-expect-error - each is a valid test function
  it.each([
    [
      'source',
      getFromToken,
      undefined,
      getFromChains,
      false,
      { expectedDefaultToken: 'ETH', expectedNetworkCount: 5 },
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
      { expectedDefaultToken: 'mUSD', expectedNetworkCount: 8 },
    ],
  ])(
    'should render %s networks',
    async (
      _description: string,
      getToken: typeof getFromToken,
      enabledNetworkMap: Record<string, Record<string, boolean>>,
      getChains: typeof getFromChains,
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

      const { getByTestId } = renderBridgeInputGroup(stateOverrides, {
        isDestination,
        token: getToken(mockState),
        networks: getChains(mockState),
      });

      expect(getByTestId(ASSET_PICKER_BUTTON_TEST_ID)).toHaveTextContent(
        expectedDefaultToken,
      );

      await openAssetPicker();

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
      expect(
        networkPickerPopover.getElementsByTagName('p').length,
      ).toStrictEqual(expectedNetworkCount);

      await act(async () => {
        await userEvent.click(
          networkPickerPopover.getElementsByTagName('p')[1],
        );
      });
      await waitFor(() => {
        expect(networkPickerPopover).not.toBeVisible();
        expect(mockUsePopularTokens.mock.lastCall).toStrictEqual([
          expect.objectContaining({
            accountAddress: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
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
          }),
        ]);
        expect(mockUseTokenSearchResults.mock.lastCall).toStrictEqual([
          expect.objectContaining({
            accountAddress: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
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
