import { useTokensWithFiltering } from './useTokensWithFiltering';
import { renderHookWithProvider } from '../../test/lib/render-helpers';
import { createBridgeMockStore } from '../../test/jest/mock-store';
import {
  STATIC_MAINNET_TOKEN_LIST,
  TokenDetails,
} from '../../shared/constants/tokens';

const nativeToken = {
  address: '0x123',
  symbol: 'ETH',
};

const chainId = '0x1';

const buildExpectedToken = (
  t,
  isNative = false,
  extra: Record<string, string> = {},
) => {
  const { address, symbol, name, decimals, balance, iconUrl } = t;
  const f = {
    ...t,
    decimals,
    iconUrl,
    name,
    primaryLabel: symbol,
    rawFiat: '',
    rightPrimaryLabel: extra.string ? `${extra.string} ${symbol}` : undefined,
    rightSecondaryLabel: '',
    secondaryLabel: name,
    symbol,
    ...extra,
  };
  if (isNative) {
    f.balance = balance;
    f.identiconAddress = address;
    f.rawFiat = extra.string ?? '';
    f.rightSecondaryLabel = extra.string ? `${extra.string} ${symbol}` : '';
  } else {
    f.iconUrl = `https://static.cx.metamask.io/api/v1/tokenIcons/1/${address}.png`;
    f.identiconAddress = null;
    f.balance = undefined;
  }
  return f;
};

describe('useTokensWithFiltering', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return token list', () => {
    const mockStore = createBridgeMockStore();
    const { result } = renderHookWithProvider(
      () =>
        useTokensWithFiltering<TokenDetails>(
          nativeToken,
          '',
          {},
          () => false,
          chainId,
        ),
      mockStore,
    );

    expect(result.current).toHaveLength(31);
    const expectedTokens = [
      buildExpectedToken(nativeToken, true),
      ...[
        '0x6b3595068778dd592e39a122f4f5a5cf09c90fe2', // SUSHI
        '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', // UNI
        '0xdac17f958d2ee523a2206206994597c13d831ec7', // USDT
        '0x514910771af9ca656af840dff83e8264ecf986ca', // LINK
      ].map((a) => buildExpectedToken(mockStore.metamask.tokenList[a])),
      ...Object.keys(STATIC_MAINNET_TOKEN_LIST).map((a) =>
        buildExpectedToken(STATIC_MAINNET_TOKEN_LIST[a]),
      ),
    ];
    result.current.forEach((token, idx) => {
      expect(token).toStrictEqual(expectedTokens[idx]);
    });
  });

  it('should default to current chain if chainId is not specified', () => {
    // TODO add token with balance and assert order
    const mockStore = createBridgeMockStore();
    const { result } = renderHookWithProvider(
      () =>
        useTokensWithFiltering<TokenDetails>(nativeToken, '', {}, () => false),
      mockStore,
    );

    expect(result.current).toHaveLength(31);
    const expectedTokens = [
      buildExpectedToken(nativeToken, true),
      ...[
        '0x6b3595068778dd592e39a122f4f5a5cf09c90fe2', // SUSHI
        '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', // UNI
        '0xdac17f958d2ee523a2206206994597c13d831ec7', // USDT
        '0x514910771af9ca656af840dff83e8264ecf986ca', // LINK
      ].map((a) => buildExpectedToken(mockStore.metamask.tokenList[a])),
      ...Object.keys(STATIC_MAINNET_TOKEN_LIST).map((a) =>
        buildExpectedToken(STATIC_MAINNET_TOKEN_LIST[a]),
      ),
    ];
    result.current.forEach((token, idx) => {
      expect(token).toStrictEqual(expectedTokens[idx]);
    });
  });

  it('should return filtered token list based on search query', () => {
    const mockStore = createBridgeMockStore();
    const appendedTokenFields = { string: '5' };
    const { result } = renderHookWithProvider(
      () =>
        useTokensWithFiltering<
          TokenDetails & Partial<typeof appendedTokenFields>
        >(nativeToken, 'UNI', appendedTokenFields, () => false, chainId),
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
          mockStore.metamask.tokenList[a],
          false,
          appendedTokenFields,
        ),
        string: '5',
      })),
    ];
    result.current.forEach((token, idx) => {
      expect(token).toStrictEqual(expectedTokens[idx]);
    });
  });

  it('should move disabled token to end of list when matched', () => {
    const mockStore = createBridgeMockStore();
    // TODO add token that's not owned by user and is disabled then query for that token
    const appendedTokenFields = { string: '1' };
    const { result } = renderHookWithProvider(
      () =>
        useTokensWithFiltering<
          TokenDetails & Partial<typeof appendedTokenFields>
        >(
          nativeToken,
          'NI',
          appendedTokenFields,
          ({ symbol }) => {
            console.log(symbol);
            return ['UNI', 'SUSHI'].includes(symbol);
          },
          chainId,
        ),
      mockStore,
    );

    expect(result.current).toHaveLength(5);
    const expectedTokens = [
      '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', // UNI
      '0x665f77fba5975ab40ce61c90f28007fb5b09d7b1', // GENIE
      '0x711d2c47aff84b96ad0f36983b1c41be2c509e18', // NIKITA
      '0xb9d7cb55f463405cdfbe4e90a6d2df01c2b92bf1', // aUNI
      '0x0a625fcec657053fe2d9fffdeb1dbb4e412cf8a8', // iUNI
    ].map((a) =>
      buildExpectedToken(
        mockStore.metamask.tokenList[a],
        false,
        appendedTokenFields,
      ),
    );
    result.current.forEach((token, idx) => {
      expect(token).toStrictEqual(expectedTokens[idx]);
    });
  });

  it('should return max tokens', () => {
    const mockStore = createBridgeMockStore();
    const appendedTokenFields = { string: '5' };
    const { result } = renderHookWithProvider(
      () =>
        useTokensWithFiltering<
          TokenDetails & Partial<typeof appendedTokenFields>
        >(
          nativeToken,
          '',
          appendedTokenFields,
          ({ symbol }) => {
            console.log(symbol);
            return ['UNI', 'SUSHI'].includes(symbol);
          },
          chainId,
          1,
        ),
      mockStore,
    );

    expect(result.current).toHaveLength(2);
    const expectedTokens = [
      buildExpectedToken(nativeToken, true, appendedTokenFields),
      ...[
        '0xdac17f958d2ee523a2206206994597c13d831ec7', // USDT
      ].map((a) =>
        buildExpectedToken(
          mockStore.metamask.tokenList[a],
          false,
          appendedTokenFields,
        ),
      ),
    ];
    result.current.forEach((token, idx) => {
      expect(token).toStrictEqual(expectedTokens[idx]);
    });
  });
});
