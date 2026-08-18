import {
  getBalanceAwareSwapDefaults,
  hasPositiveTokenBalance,
  selectBestSwapSourceToken,
  type BalanceAwareSwapSourceToken,
  type BalanceAwareUserAsset,
} from './get-balance-aware-swap-defaults';

const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const POLYGON_USDC_ADDRESS = '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359';
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const POLYGON_NATIVE_ADDRESS = '0x0000000000000000000000000000000000001010';

const currentToken: BalanceAwareSwapSourceToken = {
  address: '0x6b175474e89094c44da98b954eedeac495271d0f',
  chainId: '0x1',
  decimals: 18,
  symbol: 'DAI',
  name: 'Dai Stablecoin',
};

const userAsset = (params: {
  assetId: string;
  chainId?: string;
  symbol: string;
  name?: string;
  decimals?: number;
  fiatBalance?: number;
  isNative?: boolean;
  balance?: string;
}): BalanceAwareUserAsset => ({
  assetId: params.assetId,
  address: params.assetId,
  chainId: params.chainId ?? '0x1',
  decimals: params.decimals ?? 18,
  symbol: params.symbol,
  name: params.name ?? params.symbol,
  isNative: params.isNative ?? false,
  balance: params.balance,
  ...(params.fiatBalance === undefined
    ? {}
    : { fiat: { balance: params.fiatBalance } }),
});

describe('hasPositiveTokenBalance', () => {
  it('returns true for positive numeric balances', () => {
    expect(hasPositiveTokenBalance(1)).toBe(true);
    expect(hasPositiveTokenBalance(0.0001)).toBe(true);
  });

  it('returns false for zero, negative, or non-finite numbers', () => {
    expect(hasPositiveTokenBalance(0)).toBe(false);
    expect(hasPositiveTokenBalance(-1)).toBe(false);
    expect(hasPositiveTokenBalance(Number.NaN)).toBe(false);
  });

  it('parses display strings with commas', () => {
    expect(hasPositiveTokenBalance('1,234.5')).toBe(true);
    expect(hasPositiveTokenBalance('0')).toBe(false);
    expect(hasPositiveTokenBalance('  ')).toBe(false);
  });
});

describe('selectBestSwapSourceToken', () => {
  it('picks the same-chain token with the highest fiat balance', () => {
    const result = selectBestSwapSourceToken(currentToken, {
      '0x1': [
        userAsset({
          assetId: WETH_ADDRESS,
          symbol: 'WETH',
          fiatBalance: 1000,
        }),
        userAsset({
          assetId: USDC_ADDRESS,
          symbol: 'USDC',
          decimals: 6,
          fiatBalance: 5000,
        }),
      ],
    });

    expect(result?.address).toBe(USDC_ADDRESS);
  });

  it('excludes the current token when selecting a same-chain source', () => {
    const result = selectBestSwapSourceToken(currentToken, {
      '0x1': [
        userAsset({
          assetId: currentToken.address,
          symbol: currentToken.symbol,
          fiatBalance: 9999,
        }),
        userAsset({
          assetId: WETH_ADDRESS,
          symbol: 'WETH',
          fiatBalance: 100,
        }),
      ],
    });

    expect(result?.address).toBe(WETH_ADDRESS);
  });

  it('prefers a cross-chain native token when no same-chain source exists', () => {
    const result = selectBestSwapSourceToken(currentToken, {
      '0x89': [
        userAsset({
          assetId: POLYGON_USDC_ADDRESS,
          chainId: '0x89',
          symbol: 'USDC',
          decimals: 6,
          fiatBalance: 5000,
        }),
        userAsset({
          assetId: POLYGON_NATIVE_ADDRESS,
          chainId: '0x89',
          symbol: 'POL',
          fiatBalance: 200,
          isNative: true,
        }),
      ],
    });

    expect(result?.address).toBe(POLYGON_NATIVE_ADDRESS);
  });

  it('picks the highest-fiat native among multiple cross-chain natives', () => {
    const result = selectBestSwapSourceToken(currentToken, {
      '0x89': [
        userAsset({
          assetId: POLYGON_NATIVE_ADDRESS,
          chainId: '0x89',
          symbol: 'POL',
          fiatBalance: 200,
          isNative: true,
        }),
      ],
      '0xa': [
        userAsset({
          assetId: ZERO_ADDRESS,
          chainId: '0xa',
          symbol: 'ETH',
          fiatBalance: 3000,
          isNative: true,
        }),
      ],
    });

    expect(result?.address).toBe(ZERO_ADDRESS);
  });

  it('falls back to the highest fiat non-native when no natives exist', () => {
    const result = selectBestSwapSourceToken(currentToken, {
      '0x89': [
        userAsset({
          assetId: POLYGON_USDC_ADDRESS,
          chainId: '0x89',
          symbol: 'USDC',
          decimals: 6,
          fiatBalance: 800,
        }),
      ],
    });

    expect(result?.address).toBe(POLYGON_USDC_ADDRESS);
  });

  it('returns null when no eligible funded sources exist', () => {
    expect(
      selectBestSwapSourceToken(currentToken, {
        '0x1': [
          userAsset({
            assetId: currentToken.address,
            symbol: currentToken.symbol,
            fiatBalance: 100,
          }),
          userAsset({
            assetId: WETH_ADDRESS,
            symbol: 'WETH',
            fiatBalance: 0,
          }),
          userAsset({
            assetId: USDC_ADDRESS,
            symbol: 'USDC',
            decimals: 6,
          }),
        ],
      }),
    ).toBeNull();
  });
});

describe('getBalanceAwareSwapDefaults', () => {
  it('keeps the current token as from when it has balance', () => {
    const result = getBalanceAwareSwapDefaults({
      currentToken,
      currentTokenBalance: '1',
      assetsByChain: {
        '0x1': [
          userAsset({
            assetId: USDC_ADDRESS,
            symbol: 'USDC',
            decimals: 6,
            fiatBalance: 5000,
          }),
        ],
      },
    });

    expect(result).toEqual({
      sourceToken: currentToken,
    });
  });

  it('keeps the current token as from when only the page balance is positive', () => {
    const result = getBalanceAwareSwapDefaults({
      currentToken,
      currentTokenBalance: '0.5',
      assetsByChain: {
        '0x1': [
          userAsset({
            assetId: currentToken.address,
            symbol: currentToken.symbol,
            balance: '0',
            fiatBalance: 0,
          }),
          userAsset({
            assetId: WETH_ADDRESS,
            symbol: 'WETH',
            fiatBalance: 9000,
          }),
        ],
      },
    });

    expect(result).toEqual({
      sourceToken: currentToken,
    });
  });

  it('sets the best funded source as from and current token as to when balance is zero', () => {
    const result = getBalanceAwareSwapDefaults({
      currentToken,
      currentTokenBalance: '0',
      assetsByChain: {
        '0x1': [
          userAsset({
            assetId: WETH_ADDRESS,
            symbol: 'WETH',
            fiatBalance: 1000,
          }),
          userAsset({
            assetId: USDC_ADDRESS,
            symbol: 'USDC',
            decimals: 6,
            fiatBalance: 5000,
          }),
        ],
      },
    });

    expect(result.sourceToken?.address).toBe(USDC_ADDRESS);
    expect(result.destTokenAssetId).toBe(
      'eip155:1/erc20:0x6B175474E89094C44Da98b954EedeAC495271d0F',
    );
  });

  it('falls back to the current token when no eligible funded source exists', () => {
    const result = getBalanceAwareSwapDefaults({
      currentToken,
      currentTokenBalance: '0',
      assetsByChain: {
        '0x1': [
          userAsset({
            assetId: currentToken.address,
            symbol: currentToken.symbol,
            fiatBalance: 100,
          }),
        ],
      },
    });

    expect(result).toEqual({
      sourceToken: currentToken,
    });
  });

  it('keeps the current token as from when only the asset list reports a balance', () => {
    const result = getBalanceAwareSwapDefaults({
      currentToken,
      // The Token Detail Page renders an unparsable balance when its route
      // lookup misses the held asset.
      currentTokenBalance: 'NaN',
      assetsByChain: {
        '0x1': [
          userAsset({
            assetId: currentToken.address,
            symbol: currentToken.symbol,
            balance: '50',
            fiatBalance: 0,
          }),
          userAsset({
            assetId: WETH_ADDRESS,
            symbol: 'WETH',
            fiatBalance: 9000,
          }),
        ],
      },
    });

    expect(result).toEqual({
      sourceToken: currentToken,
    });
  });

  it('matches the native asset by chain when the page uses the zero address', () => {
    const nativeToken: BalanceAwareSwapSourceToken = {
      address: ZERO_ADDRESS,
      chainId: '0x1',
      decimals: 18,
      symbol: 'ETH',
      name: 'Ether',
    };

    const result = getBalanceAwareSwapDefaults({
      currentToken: nativeToken,
      assetsByChain: {
        '0x1': [
          userAsset({
            assetId: 'eip155:1/slip44:60',
            symbol: 'ETH',
            balance: '24.998',
            fiatBalance: 75000,
            isNative: true,
          }),
        ],
      },
    });

    expect(result).toEqual({
      sourceToken: nativeToken,
    });
  });

  it('reads the chain from the asset map key when an asset omits its chain id', () => {
    const { chainId: _omitted, ...assetWithoutChainId } = userAsset({
      assetId: currentToken.address,
      symbol: currentToken.symbol,
      balance: '2',
      fiatBalance: 10,
    });

    const result = getBalanceAwareSwapDefaults({
      currentToken,
      assetsByChain: {
        '0x1': [assetWithoutChainId],
      },
    });

    expect(result).toEqual({
      sourceToken: currentToken,
    });
  });

  it('ignores assets that carry neither an address nor an asset id', () => {
    const result = getBalanceAwareSwapDefaults({
      currentToken,
      currentTokenBalance: '0',
      assetsByChain: {
        '0x1': [
          {
            assetId: '',
            symbol: 'UNKNOWN',
            decimals: 18,
            fiat: { balance: 100 },
          } as BalanceAwareUserAsset,
          userAsset({
            assetId: WETH_ADDRESS,
            symbol: 'WETH',
            fiatBalance: 10,
          }),
        ],
      },
    });

    expect(result.sourceToken?.address).toBe(WETH_ADDRESS);
  });

  it('keeps a funded non-EVM native as from when the page passes the zero address', () => {
    const bitcoinChainId = 'bip122:000000000019d6689c085ae165831e93';
    const bitcoinToken: BalanceAwareSwapSourceToken = {
      address: ZERO_ADDRESS,
      chainId: bitcoinChainId,
      decimals: 8,
      symbol: 'BTC',
      name: 'Bitcoin',
    };

    const result = getBalanceAwareSwapDefaults({
      currentToken: bitcoinToken,
      assetsByChain: {
        '0x1': [
          userAsset({
            assetId: USDC_ADDRESS,
            symbol: 'USDC',
            decimals: 6,
            fiatBalance: 5000,
          }),
        ],
        [bitcoinChainId]: [
          {
            assetId: `${bitcoinChainId}/slip44:0`,
            chainId: bitcoinChainId,
            symbol: 'BTC',
            name: 'Bitcoin',
            decimals: 8,
            isNative: true,
            balance: '10',
            fiat: { balance: 1635.5 },
          },
        ],
      },
    });

    expect(result).toEqual({
      sourceToken: bitcoinToken,
    });
  });

  it('sets an unfunded non-EVM native as the destination', () => {
    const bitcoinToken: BalanceAwareSwapSourceToken = {
      address: ZERO_ADDRESS,
      chainId: 'bip122:000000000019d6689c085ae165831e93',
      decimals: 8,
      symbol: 'BTC',
      name: 'Bitcoin',
    };

    const result = getBalanceAwareSwapDefaults({
      currentToken: bitcoinToken,
      assetsByChain: {
        '0x1': [
          userAsset({
            assetId: USDC_ADDRESS,
            symbol: 'USDC',
            decimals: 6,
            fiatBalance: 5000,
          }),
        ],
      },
    });

    expect(result.sourceToken?.address).toBe(USDC_ADDRESS);
    expect(result.destTokenAssetId).toBe(
      'bip122:000000000019d6689c085ae165831e93/slip44:0',
    );
  });

  it('resolves current balance from the asset list when no page balance is passed', () => {
    const result = getBalanceAwareSwapDefaults({
      currentToken,
      assetsByChain: {
        '0x1': [
          userAsset({
            assetId: currentToken.address,
            symbol: currentToken.symbol,
            balance: '2',
            fiatBalance: 10,
          }),
          userAsset({
            assetId: USDC_ADDRESS,
            symbol: 'USDC',
            decimals: 6,
            fiatBalance: 5000,
          }),
        ],
      },
    });

    expect(result).toEqual({
      sourceToken: currentToken,
    });
  });
});
