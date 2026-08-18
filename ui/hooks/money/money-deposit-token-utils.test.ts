import type { KeyringAccountType } from '@metamask/keyring-api';
import type { Hex } from '@metamask/utils';
import { MUSD_TOKEN_ADDRESS } from '../../components/app/musd/constants';
import { CHAIN_IDS } from '../../../shared/constants/chain-ids';
import {
  AssetStandard,
  type Asset,
} from '../../pages/confirmations/types/send';
import {
  calculateMoneyProjectedEarnings,
  convertMoneyFiatToUsd,
  filterMoneyDepositTokens,
  isNoFeeMoneyDepositToken,
  parseMoneySubsidizedRoutes,
} from './money-deposit-token-utils';

const createAsset = (overrides: Partial<Asset> = {}): Asset => ({
  accountType: 'eip155:eoa' as KeyringAccountType,
  address: '0x0000000000000000000000000000000000000001',
  chainId: CHAIN_IDS.MAINNET,
  decimals: 18,
  fiat: { balance: 10, currency: 'usd' },
  image: 'token.png',
  name: 'Token',
  rawBalance: '0x1',
  standard: AssetStandard.ERC20,
  symbol: 'TOK',
  ...overrides,
});

describe('calculateMoneyProjectedEarnings', () => {
  it('projects one year using the APY decimal', () => {
    expect(calculateMoneyProjectedEarnings(5000, 0.04)).toBeCloseTo(200);
  });
});

describe('convertMoneyFiatToUsd', () => {
  it('converts using the USD-to-selected-currency ratio', () => {
    expect(convertMoneyFiatToUsd(2300, 2300, 2500)).toBe(2500);
  });

  it('returns undefined when rates are unavailable', () => {
    expect(convertMoneyFiatToUsd(100, undefined, 1)).toBeUndefined();
  });
});

describe('filterMoneyDepositTokens', () => {
  const defaultOptions = {
    blockedTokens: { chainIds: [], tokens: [] },
    minBalance: 0.01,
    currentCurrency: 'usd',
    currencyRates: {},
    networkConfigurations: {},
  };

  it('keeps funded EVM assets sorted by USD value', () => {
    const result = filterMoneyDepositTokens({
      ...defaultOptions,
      assets: [
        createAsset({ symbol: 'LOW', fiat: { balance: 5, currency: 'usd' } }),
        createAsset({
          address: '0x0000000000000000000000000000000000000002',
          symbol: 'HIGH',
          fiat: { balance: 20, currency: 'usd' },
        }),
      ],
    });

    expect(result.map(({ symbol }) => symbol)).toStrictEqual(['HIGH', 'LOW']);
  });

  it('excludes non-EVM, blocked, dust, and missing-fiat assets', () => {
    const blockedAddress = '0x0000000000000000000000000000000000000002';
    const result = filterMoneyDepositTokens({
      ...defaultOptions,
      blockedTokens: {
        tokens: [{ address: blockedAddress, chainId: CHAIN_IDS.MAINNET }],
      },
      assets: [
        createAsset({
          accountType: 'solana:data-account' as KeyringAccountType,
          chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
          symbol: 'SOL',
        }),
        createAsset({ address: blockedAddress, symbol: 'BLOCKED' }),
        createAsset({
          address: '0x0000000000000000000000000000000000000003',
          symbol: 'DUST',
          fiat: { balance: 0.001, currency: 'usd' },
        }),
        createAsset({
          address: '0x0000000000000000000000000000000000000004',
          symbol: 'UNKNOWN',
          fiat: undefined,
        }),
      ],
    });

    expect(result).toStrictEqual([]);
  });

  it('normalizes selected-currency values to USD', () => {
    const result = filterMoneyDepositTokens({
      ...defaultOptions,
      assets: [createAsset({ fiat: { balance: 2300, currency: 'eur' } })],
      currentCurrency: 'eur',
      currencyRates: {
        ETH: { conversionRate: 2300, usdConversionRate: 2500 },
      },
      networkConfigurations: {
        [CHAIN_IDS.MAINNET]: { nativeCurrency: 'ETH' },
      },
    });

    expect(result[0].moneyFiatAmountUsd).toBe(2500);
  });

  it('keeps assets that meet the minimum after USD normalization', () => {
    const result = filterMoneyDepositTokens({
      ...defaultOptions,
      assets: [createAsset({ fiat: { balance: 0.009, currency: 'eur' } })],
      currentCurrency: 'eur',
      currencyRates: {
        ETH: { conversionRate: 2000, usdConversionRate: 2500 },
      },
      networkConfigurations: {
        [CHAIN_IDS.MAINNET]: { nativeCurrency: 'ETH' },
      },
    });

    expect(result).toHaveLength(1);
  });

  it('excludes assets below the minimum after USD normalization', () => {
    const result = filterMoneyDepositTokens({
      ...defaultOptions,
      assets: [createAsset({ fiat: { balance: 0.011, currency: 'eur' } })],
      currentCurrency: 'eur',
      currencyRates: {
        ETH: { conversionRate: 2500, usdConversionRate: 2000 },
      },
      networkConfigurations: {
        [CHAIN_IDS.MAINNET]: { nativeCurrency: 'ETH' },
      },
    });

    expect(result).toStrictEqual([]);
  });
});

describe('parseMoneySubsidizedRoutes', () => {
  it('resolves aliases and ignores malformed routes', () => {
    expect(
      parseMoneySubsidizedRoutes({
        chains: { ethereum: CHAIN_IDS.MAINNET, monad: CHAIN_IDS.MONAD },
        tokens: {
          usdc: '0x0000000000000000000000000000000000000001',
          musd: MUSD_TOKEN_ADDRESS,
        },
        routes: [
          ['ethereum', 'usdc', 'monad', 'musd'],
          ['missing', 'usdc', 'monad', 'musd'],
        ],
      }),
    ).toStrictEqual([
      {
        sourceChain: CHAIN_IDS.MAINNET,
        sourceToken: '0x0000000000000000000000000000000000000001',
        targetChain: CHAIN_IDS.MONAD,
        targetToken: MUSD_TOKEN_ADDRESS.toLowerCase(),
      },
    ]);
  });
});

describe('isNoFeeMoneyDepositToken', () => {
  it('recognizes a subsidized route targeting Monad mUSD', () => {
    const token: { address: Hex; chainId: Hex; symbol: string } = {
      address: '0x0000000000000000000000000000000000000001',
      chainId: CHAIN_IDS.MAINNET,
      symbol: 'TOKEN',
    };
    const routes = parseMoneySubsidizedRoutes({
      chains: { ethereum: CHAIN_IDS.MAINNET, monad: CHAIN_IDS.MONAD },
      tokens: { source: token.address, musd: MUSD_TOKEN_ADDRESS },
      routes: [['ethereum', 'source', 'monad', 'musd']],
    });

    expect(isNoFeeMoneyDepositToken(token, routes)).toBe(true);
  });

  it('recognizes Monad mUSD without a configured route', () => {
    expect(
      isNoFeeMoneyDepositToken(
        {
          address: MUSD_TOKEN_ADDRESS,
          chainId: CHAIN_IDS.MONAD,
          symbol: 'mUSD',
        },
        [],
      ),
    ).toBe(true);
  });

  it('rejects a route targeting another chain', () => {
    const token: { address: Hex; chainId: Hex; symbol: string } = {
      address: '0x0000000000000000000000000000000000000001',
      chainId: CHAIN_IDS.MAINNET,
      symbol: 'TOKEN',
    };
    const routes = parseMoneySubsidizedRoutes({
      chains: { ethereum: CHAIN_IDS.MAINNET },
      tokens: { source: token.address, musd: MUSD_TOKEN_ADDRESS },
      routes: [['ethereum', 'source', 'ethereum', 'musd']],
    });

    expect(isNoFeeMoneyDepositToken(token, routes)).toBe(false);
  });

  it('optimistically recognizes stablecoins without route configuration', () => {
    expect(
      isNoFeeMoneyDepositToken(
        {
          address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          chainId: CHAIN_IDS.MAINNET,
          symbol: 'USDC',
        },
        [],
      ),
    ).toBe(true);
  });

  it('does not optimistically recognize non-stable assets', () => {
    expect(
      isNoFeeMoneyDepositToken(
        {
          address: '0x0000000000000000000000000000000000000001',
          chainId: CHAIN_IDS.MAINNET,
          symbol: 'ETH',
        },
        [],
      ),
    ).toBe(false);
  });

  it('optimistically recognizes stablecoins missing from served routes', () => {
    const routes = parseMoneySubsidizedRoutes({
      chains: { ethereum: CHAIN_IDS.MAINNET, monad: CHAIN_IDS.MONAD },
      tokens: {
        other: '0x0000000000000000000000000000000000000002',
        musd: MUSD_TOKEN_ADDRESS,
      },
      routes: [['ethereum', 'other', 'monad', 'musd']],
    });

    expect(
      isNoFeeMoneyDepositToken(
        {
          address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          chainId: CHAIN_IDS.MAINNET,
          symbol: 'USDC',
        },
        routes,
      ),
    ).toBe(true);
  });
});
