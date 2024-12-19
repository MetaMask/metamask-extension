import { renderHookWithProvider } from '../../test/lib/render-helpers';
import { createBridgeMockStore } from '../../test/jest/mock-store';
import { STATIC_MAINNET_TOKEN_LIST } from '../../shared/constants/tokens';
import {
  SWAPS_CHAINID_DEFAULT_TOKEN_MAP,
  SwapsTokenObject,
  TokenBucketPriority,
} from '../../shared/constants/swaps';
import { useTokensWithFiltering } from './useTokensWithFiltering';

const mockUseTokenTracker = jest
  .fn()
  .mockReturnValue({ tokensWithBalances: [] });
jest.mock('./useTokenTracker', () => ({
  useTokenTracker: () => mockUseTokenTracker(),
}));

const TEST_CHAIN_ID = '0x1';
const NATIVE_TOKEN = SWAPS_CHAINID_DEFAULT_TOKEN_MAP[TEST_CHAIN_ID];

const MOCK_TOP_ASSETS = [
  { address: '0x6b3595068778dd592e39a122f4f5a5cf09c90fe2' }, // UNI
  { address: NATIVE_TOKEN.address },
  { address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984' }, // USDC
  { address: '0xdac17f958d2ee523a2206206994597c13d831ec7' }, // USDT
];

const MOCK_TOKEN_LIST_BY_ADDRESS: Record<string, SwapsTokenObject> = {
  [NATIVE_TOKEN.address]: NATIVE_TOKEN,
  ...STATIC_MAINNET_TOKEN_LIST,
};

describe('useTokensWithFiltering should return token list generator', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('when chainId === activeChainId and sorted by topAssets', () => {
    const mockStore = createBridgeMockStore();
    const { result } = renderHookWithProvider(
      () =>
        useTokensWithFiltering(
          MOCK_TOKEN_LIST_BY_ADDRESS,
          MOCK_TOP_ASSETS,
          TokenBucketPriority.top,
          TEST_CHAIN_ID,
        ),
      mockStore,
    );

    expect(result.current).toHaveLength(1);
    expect(typeof result.current).toStrictEqual('function');
    const tokenGenerator = result.current(() => true);
    expect(tokenGenerator.next().value).toStrictEqual({
      address: '0x0000000000000000000000000000000000000000',
      balance: undefined,
      decimals: 18,
      iconUrl: './images/eth_logo.svg',
      identiconAddress: null,
      image: './images/eth_logo.svg',
      name: 'Ether',
      primaryLabel: 'ETH',
      rawFiat: '',
      rightPrimaryLabel: undefined,
      rightSecondaryLabel: '',
      secondaryLabel: 'Ether',
      symbol: 'ETH',
      type: 'NATIVE',
    });
    expect(tokenGenerator.next().value).toStrictEqual({
      address: '0x6b3595068778dd592e39a122f4f5a5cf09c90fe2',
      aggregators: [],
      balance: undefined,
      decimals: 18,
      erc20: true,
      erc721: false,
      iconUrl:
        'https://static.cx.metamask.io/api/v1/tokenIcons/1/0x6b3595068778dd592e39a122f4f5a5cf09c90fe2.png',
      identiconAddress: null,
      image: 'images/contract/sushi.svg',
      name: 'SushiSwap',
      primaryLabel: 'SUSHI',
      rawFiat: '',
      rightPrimaryLabel: undefined,
      rightSecondaryLabel: '',
      secondaryLabel: 'SushiSwap',
      symbol: 'SUSHI',
      type: 'TOKEN',
    });
  });

  it('when chainId === activeChainId and sorted by balance', () => {
    const mockStore = createBridgeMockStore();
    mockUseTokenTracker.mockReturnValue({
      tokensWithBalances: [
        {
          address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
          balance: '0xa',
        },
      ],
    });
    const { result } = renderHookWithProvider(
      () =>
        useTokensWithFiltering(
          MOCK_TOKEN_LIST_BY_ADDRESS,
          MOCK_TOP_ASSETS,
          TokenBucketPriority.owned,
          TEST_CHAIN_ID,
        ),
      mockStore,
    );

    expect(result.current).toHaveLength(1);
    expect(typeof result.current).toStrictEqual('function');
    const tokenGenerator = result.current(() => true);
    expect(tokenGenerator.next().value).toStrictEqual({
      address: '0x0000000000000000000000000000000000000000',
      balance: '0x0',
      decimals: 18,
      iconUrl: './images/eth_logo.svg',
      identiconAddress: null,
      image: './images/eth_logo.svg',
      name: 'Ether',
      primaryLabel: 'ETH',
      rawFiat: '0',
      rightPrimaryLabel: '0 ETH',
      rightSecondaryLabel: '$0.00 USD',
      secondaryLabel: 'Ether',
      string: '0',
      symbol: 'ETH',
      type: 'NATIVE',
    });
    expect(tokenGenerator.next().value).toStrictEqual({
      address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
      aggregators: [],
      balance: '0xa',
      decimals: 6,
      erc20: true,
      iconUrl:
        'https://static.cx.metamask.io/api/v1/tokenIcons/1/0xdac17f958d2ee523a2206206994597c13d831ec7.png',
      identiconAddress: null,
      image: 'images/contract/usdt.svg',
      name: 'Tether USD',
      primaryLabel: 'USDT',
      rawFiat: '',
      rightPrimaryLabel: undefined,
      rightSecondaryLabel: '',
      secondaryLabel: 'Tether USD',
      symbol: 'USDT',
      type: 'TOKEN',
    });
  });
});
