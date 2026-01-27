import React from 'react';
import { formatChainIdToCaip } from '@metamask/bridge-controller';
import { act, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import {
  createBridgeMockStore,
  MOCK_EVM_ACCOUNT,
} from '../../../../test/data/bridge/mock-bridge-store';
import { MultichainNetworks } from '../../../../shared/constants/multichain/networks';
import {
  getFromChains,
  getFromToken,
  getToChains,
  getToToken,
} from '../../../ducks/bridge/selectors';
import * as actions from '../../../ducks/bridge/actions';
import configureStore from '../../../store/store';
import { BridgeInputGroup } from './bridge-input-group';

const mockHandleFetch = jest.fn();
const mockUseVirtualizer = jest.fn();

jest.mock('@metamask/controller-utils', () => ({
  ...jest.requireActual('@metamask/controller-utils'),
  handleFetch: (...args: unknown[]) => mockHandleFetch(...args),
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
    assetId: 'eip155:1/erc20:0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    decimals: 6,
  },
  {
    name: 'USDT',
    symbol: 'USDT',
    chainId: 'eip155:1',
    assetId: 'eip155:1/erc20:0xaf88d065e77c8cC2239327C5EDb3A432268e5832',
    decimals: 6,
  },
  {
    name: 'USDC',
    symbol: 'USDC',
    chainId: 'eip155:59144',
    assetId: 'eip155:59144/erc20:0xaf88d065e77c8cC2239327C5EDb3A432268e5833',
    decimals: 6,
  },
];

const tokensWithBalance = [
  {
    decimals: 10,
    symbol: 'UNI',
    name: 'Uniswap',
    chainId: 'eip155:1',
    assetId: 'eip155:1/erc20:0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
  },
  {
    decimals: 9,
    symbol: 'LINK',
    name: 'Link',
    chainId: 'eip155:1',
    assetId: 'eip155:1/erc20:0x514910771AF9Ca656af840dff83E8264EcF986CA',
  },
];

const ASSET_PICKER_BUTTON_TEST_ID = 'asset-picker-button';

const renderBridgeInputGroup = (
  stateOverrides: Parameters<typeof createBridgeMockStore>[0] = {},
  props: Partial<React.ComponentProps<typeof BridgeInputGroup>> = {},
) => {
  const mockState = createBridgeMockStore({ ...stateOverrides });
  return renderWithProvider(
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
      {...props}
    />,
    configureStore(mockState),
  );
};

const setupFetchMock = (
  searchResults = tokens,
  hasNextPage = false,
  popularResults = tokens.slice(0, 2),
) => {
  mockHandleFetch.mockImplementation((url) =>
    url.includes('search')
      ? {
          data: searchResults,
          pageInfo: {
            hasNextPage,
            endCursor: undefined,
          },
        }
      : popularResults,
  );
};

const openAssetPicker = async () => {
  await act(async () => {
    await userEvent.click(screen.getByTestId(ASSET_PICKER_BUTTON_TEST_ID));
  });
  await waitFor(() => {
    expect(screen.getByTestId('bridge-asset-picker-modal')).toBeVisible();
  });
};

const fillSearchInput = async (searchQuery: string) => {
  const searchInput = screen.getByTestId('bridge-asset-picker-search-input');
  await act(async () => {
    await searchInput.focus();
    await userEvent.keyboard(searchQuery);
  });
};

const expectAssetListToMatch = (stringifiedSnapshot: string) => {
  expect(
    screen.getAllByTestId('bridge-asset').map(({ textContent }) => textContent),
  ).toMatchInlineSnapshot(stringifiedSnapshot);
};

describe('BridgeInputGroup', () => {
  beforeEach(() => {
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
    jest.clearAllMocks();
  });

  it('should search for tokens', async () => {
    setupFetchMock();
    const { getByTestId } = renderBridgeInputGroup();

    expect(getByTestId(ASSET_PICKER_BUTTON_TEST_ID)).toHaveTextContent('ETH');

    await openAssetPicker();
    expect(getByTestId('bridge-asset-picker-modal')).toMatchSnapshot();
    expectAssetListToMatch(
      `
      [
        "USDCUSD Coin",
        "USDTUSDT",
      ]
    `,
    );

    await fillSearchInput('U');
    await waitFor(() => {
      expectAssetListToMatch(
        `
        [
          "UNI$0.00Uniswap<0.000001 UNI",
        ]
      `,
      );
    });

    await fillSearchInput('SD');
    await waitFor(() => {
      expectAssetListToMatch(
        `
        [
          "USDCUSD Coin",
          "USDTUSDT",
          "USDCUSDC",
        ]
      `,
      );
    });

    expect(mockHandleFetch.mock.calls.map((call) => [call[0], call[1].body]))
      .toMatchInlineSnapshot(`
      [
        [
          "https://bridge.api.cx.metamask.io/getTokens/popular",
          "{"chainIds":["eip155:1"],"includeAssets":[{"decimals":18,"symbol":"ETH","name":"Ether","chainId":"eip155:1","image":"https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/slip44/60.png","assetId":"eip155:1/slip44:60","balance":"0.01","tokenFiatAmount":25.242128065034784},{"decimals":10,"symbol":"UNI","name":"Uniswap","chainId":"eip155:1","image":"https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/erc20/0x1f9840a85d5af5bf1d1762f925bdaddc4201f984.png","assetId":"eip155:1/erc20:0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984","balance":"0.0000001848","tokenFiatAmount":0.0010728914112762384},{"decimals":9,"symbol":"LINK","name":"Link","chainId":"eip155:1","image":"https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/erc20/0x514910771af9ca656af840dff83e8264ecf986ca.png","assetId":"eip155:1/erc20:0x514910771AF9Ca656af840dff83E8264EcF986CA","balance":"0.000000001","tokenFiatAmount":0.0000030290553678041743}]}",
        ],
        [
          "https://bridge.api.cx.metamask.io/getTokens/search",
          "{"chainIds":["eip155:1"],"includeAssets":[],"query":"USD"}",
        ],
      ]
    `);

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
    expectAssetListToMatch(
      `
      [
        "USDCUSD Coin",
        "USDTUSDT",
      ]
      `,
    );

    await fillSearchInput('USD');
    await waitFor(() => {
      expectAssetListToMatch(
        `
        [
          "USDCUSD Coin",
        ]
        `,
      );
    });
    expect(mockHandleFetch).toHaveBeenCalledTimes(2);
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
    expectAssetListToMatch(
      `
      [
        "USDCUSD Coin",
        "USDTUSDT",
        "UNI$0.00Uniswap<0.000001 UNI",
      ]
    `,
    );

    expect(mockHandleFetch.mock.calls.map((call) => [call[0], call[1].body]))
      .toMatchInlineSnapshot(`
      [
        [
          "https://bridge.api.cx.metamask.io/getTokens/popular",
          "{"chainIds":["eip155:1"],"includeAssets":[{"decimals":18,"symbol":"ETH","name":"Ether","chainId":"eip155:1","image":"https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/slip44/60.png","assetId":"eip155:1/slip44:60","balance":"0.01","tokenFiatAmount":25.242128065034784},{"decimals":10,"symbol":"UNI","name":"Uniswap","chainId":"eip155:1","image":"https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/erc20/0x1f9840a85d5af5bf1d1762f925bdaddc4201f984.png","assetId":"eip155:1/erc20:0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984","balance":"0.0000001848","tokenFiatAmount":0.0010728914112762384},{"decimals":9,"symbol":"LINK","name":"Link","chainId":"eip155:1","image":"https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1/erc20/0x514910771af9ca656af840dff83e8264ecf986ca.png","assetId":"eip155:1/erc20:0x514910771AF9Ca656af840dff83E8264EcF986CA","balance":"0.000000001","tokenFiatAmount":0.0000030290553678041743}]}",
        ],
      ]
    `);

    expect(mockUseVirtualizer).toHaveBeenCalledWith({
      count: 4,
      gap: 0,
      estimateSize: expect.any(Function),
      overscan: 10,
      getScrollElement: expect.any(Function),
      initialOffset: expect.any(Number),
      onChange: expect.any(Function),
    });
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
      const abortSpy = jest.spyOn(AbortController.prototype, 'abort');

      const { getByTestId } = renderBridgeInputGroup(stateOverrides, {
        isDestination,
        token: getToken(mockState),
        networks: getChains(mockState),
      });

      expect(getByTestId(ASSET_PICKER_BUTTON_TEST_ID)).toHaveTextContent(
        expectedDefaultToken,
      );

      await openAssetPicker();
      expectAssetListToMatch(
        `
        [
          "USDCUSD Coin",
          "USDTUSDT",
          "UNI$0.00Uniswap<0.000001 UNI",
        ]
      `,
      );

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
        expect(abortSpy).toHaveBeenCalledTimes(4);
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
        expect(abortSpy).toHaveBeenCalledTimes(7);
      });

      expect(mockHandleFetch.mock.calls).toMatchSnapshot();
      expect(mockHandleFetch).toHaveBeenCalledTimes(3);

      expect(abortSpy.mock.calls.flat()).toStrictEqual([
        'Search query changed',
        'Search query changed',
        'Search query changed',
        'Page unmounted',
        'Search query changed',
        'Asset balances changed',
        'Asset balances changed',
      ]);
    },
  );
});
