import { zeroAddress } from 'ethereumjs-util';
import { renderHookWithProvider } from '../../test/lib/render-helpers';
import { createBridgeMockStore } from '../../test/jest/mock-store';
import { STATIC_MAINNET_TOKEN_LIST } from '../../shared/constants/tokens';
import {
  SWAPS_CHAINID_DEFAULT_TOKEN_MAP,
  SwapsTokenObject,
  TokenBucketPriority,
} from '../../shared/constants/swaps';
import { SwapsEthToken } from '../selectors';
import { useTokensWithFiltering } from './useTokensWithFiltering';

const mockUseTokenTracker = jest
  .fn()
  .mockReturnValue({ tokensWithBalances: [] });
jest.mock('./useTokenTracker', () => ({
  useTokenTracker: () => mockUseTokenTracker(),
}));

const chainId = '0x1';
const nativeToken = SWAPS_CHAINID_DEFAULT_TOKEN_MAP[chainId];

const buildExpectedToken = (
  token: SwapsTokenObject | SwapsEthToken,
  isNative = false,
  extra: Record<string, string> = {},
) => {
  const isSwapsEthToken = (t: unknown): t is SwapsEthToken =>
    typeof t === 'object' && t !== null && 'balance' in t;
  const isSwapsTokenObject = (t: unknown): t is SwapsTokenObject =>
    typeof t === 'object' && t !== null && 'iconUrl' in t;

  const { address, symbol, name, decimals } = token;

  return {
    ...token,
    decimals,
    iconUrl:
      isNative && isSwapsTokenObject(token)
        ? token.iconUrl
        : `https://static.cx.metamask.io/api/v1/tokenIcons/1/${address}.png`,
    name,
    primaryLabel: symbol,
    rawFiat: isNative ? extra.string ?? '' : '',
    rightPrimaryLabel: extra.string ? `${extra.string} ${symbol}` : undefined,
    rightSecondaryLabel:
      isNative && extra.string ? `${extra.string} ${symbol}` : '',
    secondaryLabel: name,
    symbol,
    ...extra,
    identiconAddress: null,
    balance: isSwapsEthToken(token) ? token.balance : undefined,
  };
};

const MOCK_TOP_ASSETS = [
  { address: nativeToken.address },
  { address: '0x6b3595068778dd592e39a122f4f5a5cf09c90fe2' }, // UNI
  { address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984' }, // USDC
  { address: '0xdac17f958d2ee523a2206206994597c13d831ec7' }, // USDT
];

const MOCK_TOKEN_LIST_BY_ADDRESS: Record<string, SwapsTokenObject> = {
  [nativeToken.address]: nativeToken,
  ...STATIC_MAINNET_TOKEN_LIST,
};

describe('useTokensWithFiltering', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return token list ordered by topAssets', () => {
    const mockStore = createBridgeMockStore();
    const { result } = renderHookWithProvider(
      () =>
        useTokensWithFiltering<SwapsTokenObject>(
          '',
          MOCK_TOKEN_LIST_BY_ADDRESS,
          MOCK_TOP_ASSETS,
          chainId,
          TokenBucketPriority.top,
        ),
      mockStore,
    );

    expect(result.current).toHaveLength(30);
    const expectedTokens = [
      buildExpectedToken(nativeToken, true),
      ...[
        '0x6b3595068778dd592e39a122f4f5a5cf09c90fe2', // UNI
        '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', // USDC
        '0xdac17f958d2ee523a2206206994597c13d831ec7', // USDT
      ].map((a) => buildExpectedToken(MOCK_TOKEN_LIST_BY_ADDRESS[a])),
      ...Object.keys(STATIC_MAINNET_TOKEN_LIST).map((a) =>
        buildExpectedToken(MOCK_TOKEN_LIST_BY_ADDRESS[a]),
      ),
    ];
    result.current.forEach(
      (token: SwapsTokenObject | SwapsEthToken, idx: number) => {
        expect(token).toStrictEqual(expectedTokens[idx]);
      },
    );
  });

  it('should return token list without native if balance is 0', () => {
    const mockStore = createBridgeMockStore();
    const { result } = renderHookWithProvider(
      () =>
        useTokensWithFiltering<SwapsTokenObject>(
          '',
          MOCK_TOKEN_LIST_BY_ADDRESS,
          [
            { address: '0x6b3595068778dd592e39a122f4f5a5cf09c90fe2' }, // UNI
            { address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984' }, // USDC
            { address: '0xdac17f958d2ee523a2206206994597c13d831ec7' }, // USDT
          ],
          chainId,
          TokenBucketPriority.owned,
        ),
      mockStore,
    );

    expect(result.current).toHaveLength(30);
    const expectedTokens = [
      ...[
        '0x6b3595068778dd592e39a122f4f5a5cf09c90fe2', // SUSHI
        '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', // UNI
        '0xdac17f958d2ee523a2206206994597c13d831ec7', // USDT
      ].map((a) => buildExpectedToken(MOCK_TOKEN_LIST_BY_ADDRESS[a])),
      buildExpectedToken(nativeToken, true),
      ...Object.keys(STATIC_MAINNET_TOKEN_LIST).map((a) =>
        buildExpectedToken(MOCK_TOKEN_LIST_BY_ADDRESS[a]),
      ),
    ];
    result.current.forEach((token: SwapsTokenObject, idx: number) => {
      expect(token).toStrictEqual(expectedTokens[idx]);
    });
  });

  it('should return filtered token list based on search query', () => {
    const mockStore = createBridgeMockStore();
    const appendedTokenFields = { string: '5' };
    mockUseTokenTracker.mockReturnValue({
      tokensWithBalances: [
        {
          ...MOCK_TOKEN_LIST_BY_ADDRESS[
            '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984'
          ],
          ...appendedTokenFields,
        },
        {
          ...MOCK_TOKEN_LIST_BY_ADDRESS[
            '0xb9d7cb55f463405cdfbe4e90a6d2df01c2b92bf1'
          ],
          ...appendedTokenFields,
        },
        {
          ...MOCK_TOKEN_LIST_BY_ADDRESS[
            '0x0a625fcec657053fe2d9fffdeb1dbb4e412cf8a8'
          ],
          ...appendedTokenFields,
        },
      ],
    });
    const { result } = renderHookWithProvider(
      () =>
        useTokensWithFiltering<SwapsTokenObject>(
          'UNI',
          MOCK_TOKEN_LIST_BY_ADDRESS,
          MOCK_TOP_ASSETS,
          chainId,
          TokenBucketPriority.owned,
          3,
        ),
      mockStore,
    );

    expect(result.current).toHaveLength(3);
    const expectedTokens = [
      ...[
        '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', // UNI
        '0xb9d7cb55f463405cdfbe4e90a6d2df01c2b92bf1', // aUNI
        '0x0a625fcec657053fe2d9fffdeb1dbb4e412cf8a8', // iUNI
      ].map((a) => ({
        ...buildExpectedToken(
          MOCK_TOKEN_LIST_BY_ADDRESS[a],
          false,
          appendedTokenFields,
        ),
      })),
    ];
    result.current.forEach(
      (token: SwapsTokenObject | SwapsEthToken, idx: number) => {
        expect(token).toStrictEqual(expectedTokens[idx]);
      },
    );
  });

  it('should return max number of tokens', () => {
    const mockStore = createBridgeMockStore();
    const appendedTokenFields = { string: '5' };
    mockUseTokenTracker.mockReturnValue({
      tokensWithBalances: [
        {
          ...MOCK_TOKEN_LIST_BY_ADDRESS[
            '0x6b3595068778dd592e39a122f4f5a5cf09c90fe2' // SUSHI
          ],
          ...appendedTokenFields,
        },
      ],
    });
    const { result } = renderHookWithProvider(
      () =>
        useTokensWithFiltering<SwapsTokenObject>(
          '',
          MOCK_TOKEN_LIST_BY_ADDRESS,
          MOCK_TOP_ASSETS,
          chainId,
          TokenBucketPriority.owned,
          3,
        ),
      mockStore,
    );

    expect(result.current).toHaveLength(3);
    const expectedTokens = [
      buildExpectedToken(
        MOCK_TOKEN_LIST_BY_ADDRESS[
          '0x6b3595068778dd592e39a122f4f5a5cf09c90fe2' // SUSHI
        ],
        false,
        appendedTokenFields,
      ),
      buildExpectedToken(MOCK_TOKEN_LIST_BY_ADDRESS[zeroAddress()], true),
      buildExpectedToken(
        MOCK_TOKEN_LIST_BY_ADDRESS[
          '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984' // UNI
        ],
      ),
    ];
    result.current.forEach(
      (token: SwapsTokenObject | SwapsEthToken, idx: number) => {
        expect(token).toStrictEqual(expectedTokens[idx]);
      },
    );
  });
});
