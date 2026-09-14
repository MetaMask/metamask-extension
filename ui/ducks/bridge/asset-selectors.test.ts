import { formatChainIdToCaip } from '@metamask/bridge-controller';
import { toChecksumHexAddress } from '@metamask/controller-utils';
import {
  createBridgeMockStore,
  MOCK_BITCOIN_ACCOUNT,
  MOCK_EVM_ACCOUNT,
  MOCK_SOLANA_ACCOUNT,
} from '../../../test/data/bridge/mock-bridge-store';
import { mockTokenData } from '../../../test/data/bridge/mock-token-data';
import { CHAIN_IDS } from '../../../shared/constants/network';
import { MultichainNetworks } from '../../../shared/constants/multichain/networks';
import { getAccountGroupsByAddress } from '../../selectors/multichain-accounts/account-tree';
import {
  getBridgeBalancesByChainId,
  getBridgeAssetsByAssetId,
  getBridgeSortedAssets,
} from './asset-selectors';

const ETH_RATE = 2524.25;
const ETH_MAINNET = 'eip155:1/slip44:60';
const ETH_LINEA = 'eip155:59144/slip44:60';
const ETH_OPTIMISM = 'eip155:10/slip44:60';
const UNI = toChecksumHexAddress('0x1f9840a85d5af5bf1d1762f925bdaddc4201f984');
const LINK = toChecksumHexAddress('0x514910771af9ca656af840dff83e8264ecf986ca');
const COMP = toChecksumHexAddress('0xc00e94cb662c3520282e6f5717214004a7f26888');
const UNI_MAINNET = `eip155:1/erc20:${UNI}`;
const LINK_MAINNET = `eip155:1/erc20:${LINK}`;
const UNI_LINEA = `eip155:59144/erc20:${UNI}`;
const LINK_LINEA = `eip155:59144/erc20:${LINK}`;
const COMP_LINEA = `eip155:59144/erc20:${COMP}`;
const LINK_OPTIMISM = `eip155:10/erc20:${LINK}`;
const COMP_OPTIMISM = `eip155:10/erc20:${COMP}`;
const SOL_NATIVE = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501';
const SOL_USDC =
  'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const BTC_NATIVE = 'bip122:000000000019d6689c085ae165831e93/slip44:0';

const fungible = (price: number, lastUpdated = 1) => ({
  assetPriceType: 'fungible' as const,
  price,
  usdPrice: price,
  lastUpdated,
});

/**
 * Unified AssetsController state mirroring legacy mock-token-data balances
 * plus createBridgeMockStore Solana/BTC balances and conversion rates.
 */
const UNIFIED_BRIDGE_ASSET_STATE = {
  selectedCurrency: 'usd',
  assetsInfo: {
    ...mockTokenData.assetsInfo,
    [SOL_NATIVE]: {
      type: 'native',
      decimals: 18,
      symbol: 'SOL',
      name: 'Solana',
    },
    [SOL_USDC]: {
      type: 'spl',
      decimals: 6,
      symbol: 'USDC',
      name: 'USDC',
    },
    [BTC_NATIVE]: {
      type: 'native',
      decimals: 18,
      symbol: 'BTC',
      name: 'Bitcoin',
    },
  },
  assetsBalance: {
    ...mockTokenData.assetsBalance,
    [MOCK_SOLANA_ACCOUNT.id]: {
      [SOL_NATIVE]: { amount: '1.530' },
      [SOL_USDC]: { amount: '2.043238' },
    },
    [MOCK_BITCOIN_ACCOUNT.id]: {
      [BTC_NATIVE]: { amount: '.001' },
    },
  },
  assetsPrice: {
    [ETH_MAINNET]: fungible(ETH_RATE),
    [ETH_LINEA]: fungible(ETH_RATE),
    [ETH_OPTIMISM]: fungible(ETH_RATE),
    // Legacy marketData prices were in native ETH units
    [UNI_MAINNET]: fungible(2.3 * ETH_RATE),
    [LINK_MAINNET]: fungible(1.2 * ETH_RATE),
    [UNI_LINEA]: fungible(0.0023 * ETH_RATE),
    [LINK_LINEA]: fungible(0.00012 * ETH_RATE),
    [COMP_LINEA]: fungible(1.2 * ETH_RATE),
    [LINK_OPTIMISM]: fungible(0.00012 * ETH_RATE),
    [COMP_OPTIMISM]: fungible(1.2 * ETH_RATE),
    [SOL_NATIVE]: fungible(137.81, 1764366649784),
    [SOL_USDC]: fungible(0.99981, 1764366649785),
    [BTC_NATIVE]: fungible(91238, 1764366649),
  },
};

describe('Bridge asset selectors', () => {
  describe('getBridgeAssetsWithBalance', () => {
    it('returns all assets with balance for the given account group and selected asset', () => {
      const state = createBridgeMockStore({
        featureFlagOverrides: {
          bridgeConfig: {
            refreshRate: 30000,
            priceImpactThreshold: {
              normal: 1,
              gasless: 2,
            },
            maxRefreshCount: 5,
            support: true,
            chains: {
              [CHAIN_IDS.MAINNET]: {
                isActiveSrc: true,
                isActiveDest: true,
              },
              [CHAIN_IDS.OPTIMISM]: {
                isActiveSrc: true,
                isActiveDest: true,
              },
              [CHAIN_IDS.POLYGON]: {
                isActiveSrc: true,
                isActiveDest: true,
              },
              [MultichainNetworks.SOLANA]: {
                isActiveSrc: true,
                isActiveDest: true,
              },
              [MultichainNetworks.BITCOIN]: {
                isActiveSrc: true,
                isActiveDest: true,
              },
              [MultichainNetworks.TRON]: {
                isActiveSrc: true,
                isActiveDest: true,
              },
            },
            chainRanking: [
              { chainId: formatChainIdToCaip(CHAIN_IDS.MAINNET) },
              { chainId: formatChainIdToCaip(CHAIN_IDS.OPTIMISM) },
              { chainId: formatChainIdToCaip(CHAIN_IDS.POLYGON) },
              { chainId: MultichainNetworks.SOLANA },
              { chainId: MultichainNetworks.BITCOIN },
              { chainId: MultichainNetworks.TRON },
            ],
          },
        },
        metamaskStateOverrides: {
          ...UNIFIED_BRIDGE_ASSET_STATE,
        },
      });

      const [accountGroup] = getAccountGroupsByAddress(state, [
        MOCK_EVM_ACCOUNT.address,
      ]);
      const assetsWithBalance = getBridgeSortedAssets(state, accountGroup.id);
      const balanceByAssetId = getBridgeAssetsByAssetId(state, accountGroup.id);
      const balanceByChainId = getBridgeBalancesByChainId(
        state,
        accountGroup.id,
      );

      expect(assetsWithBalance).toMatchInlineSnapshot(`
        [
          {
            "assetId": "eip155:10/erc20:0xc00e94Cb662C3520282E6f5717214004A7f26888",
            "balance": "5.030001",
            "chainId": "eip155:10",
            "decimals": 6,
            "iconUrl": undefined,
            "name": "Compound",
            "rwaData": undefined,
            "symbol": "COMP",
            "tokenFiatAmount": 15236.3760291,
          },
          {
            "assetId": "eip155:10/erc20:0x514910771AF9Ca656af840dff83E8264EcF986CA",
            "balance": "9535.2030001",
            "chainId": "eip155:10",
            "decimals": 9,
            "iconUrl": undefined,
            "name": "Link",
            "rwaData": undefined,
            "symbol": "LINK",
            "tokenFiatAmount": 2888.308340760291,
          },
          {
            "assetId": "eip155:10/slip44:60",
            "balance": "1.0000125",
            "chainId": "eip155:10",
            "decimals": 18,
            "name": "Ether",
            "symbol": "ETH",
            "tokenFiatAmount": 2524.281553125,
          },
          {
            "accountType": "solana:data-account",
            "assetId": "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501",
            "balance": "1.530",
            "chainId": "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
            "decimals": 18,
            "name": "Solana",
            "symbol": "SOL",
            "tokenFiatAmount": 210.8493,
          },
          {
            "accountType": "bip122:p2wpkh",
            "assetId": "bip122:000000000019d6689c085ae165831e93/slip44:0",
            "balance": ".001",
            "chainId": "bip122:000000000019d6689c085ae165831e93",
            "decimals": 18,
            "name": "Bitcoin",
            "symbol": "BTC",
            "tokenFiatAmount": 91.238,
          },
          {
            "assetId": "eip155:1/slip44:60",
            "balance": "0.01",
            "chainId": "eip155:1",
            "decimals": 18,
            "name": "Ether",
            "symbol": "ETH",
            "tokenFiatAmount": 25.2425,
          },
          {
            "accountType": "solana:data-account",
            "assetId": "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
            "balance": "2.043238",
            "chainId": "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
            "decimals": 6,
            "name": "USDC",
            "symbol": "USDC",
            "tokenFiatAmount": 2.04284978478,
          },
          {
            "assetId": "eip155:1/erc20:0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
            "balance": "0.0000001848",
            "chainId": "eip155:1",
            "decimals": 10,
            "iconUrl": undefined,
            "name": "Uniswap",
            "rwaData": undefined,
            "symbol": "UNI",
            "tokenFiatAmount": 0.00107290722,
          },
          {
            "assetId": "eip155:1/erc20:0x514910771AF9Ca656af840dff83E8264EcF986CA",
            "balance": "0.000000001",
            "chainId": "eip155:1",
            "decimals": 9,
            "iconUrl": undefined,
            "name": "Link",
            "rwaData": undefined,
            "symbol": "LINK",
            "tokenFiatAmount": 0.0000030291,
          },
          {
            "assetId": "eip155:1/erc20:0x6B3595068778DD592e39A122f4f5a5cF09C90fE2",
            "balance": "0",
            "chainId": "eip155:1",
            "decimals": 18,
            "iconUrl": undefined,
            "name": "Sushi",
            "rwaData": undefined,
            "symbol": "SUSHI",
            "tokenFiatAmount": 0,
          },
        ]
      `);
      expect(balanceByAssetId).toMatchInlineSnapshot(`
        {
          "bip122:000000000019d6689c085ae165831e93/slip44:0": {
            "accountType": "bip122:p2wpkh",
            "assetId": "bip122:000000000019d6689c085ae165831e93/slip44:0",
            "balance": ".001",
            "chainId": "bip122:000000000019d6689c085ae165831e93",
            "decimals": 18,
            "name": "Bitcoin",
            "symbol": "BTC",
            "tokenFiatAmount": 91.238,
          },
          "eip155:1/erc20:0x1f9840a85d5af5bf1d1762f925bdaddc4201f984": {
            "assetId": "eip155:1/erc20:0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
            "balance": "0.0000001848",
            "chainId": "eip155:1",
            "decimals": 10,
            "iconUrl": undefined,
            "name": "Uniswap",
            "rwaData": undefined,
            "symbol": "UNI",
            "tokenFiatAmount": 0.00107290722,
          },
          "eip155:1/erc20:0x514910771af9ca656af840dff83e8264ecf986ca": {
            "assetId": "eip155:1/erc20:0x514910771AF9Ca656af840dff83E8264EcF986CA",
            "balance": "0.000000001",
            "chainId": "eip155:1",
            "decimals": 9,
            "iconUrl": undefined,
            "name": "Link",
            "rwaData": undefined,
            "symbol": "LINK",
            "tokenFiatAmount": 0.0000030291,
          },
          "eip155:1/erc20:0x6b3595068778dd592e39a122f4f5a5cf09c90fe2": {
            "assetId": "eip155:1/erc20:0x6B3595068778DD592e39A122f4f5a5cF09C90fE2",
            "balance": "0",
            "chainId": "eip155:1",
            "decimals": 18,
            "iconUrl": undefined,
            "name": "Sushi",
            "rwaData": undefined,
            "symbol": "SUSHI",
            "tokenFiatAmount": 0,
          },
          "eip155:1/slip44:60": {
            "assetId": "eip155:1/slip44:60",
            "balance": "0.01",
            "chainId": "eip155:1",
            "decimals": 18,
            "name": "Ether",
            "symbol": "ETH",
            "tokenFiatAmount": 25.2425,
          },
          "eip155:10/erc20:0x514910771af9ca656af840dff83e8264ecf986ca": {
            "assetId": "eip155:10/erc20:0x514910771AF9Ca656af840dff83E8264EcF986CA",
            "balance": "9535.2030001",
            "chainId": "eip155:10",
            "decimals": 9,
            "iconUrl": undefined,
            "name": "Link",
            "rwaData": undefined,
            "symbol": "LINK",
            "tokenFiatAmount": 2888.308340760291,
          },
          "eip155:10/erc20:0xc00e94cb662c3520282e6f5717214004a7f26888": {
            "assetId": "eip155:10/erc20:0xc00e94Cb662C3520282E6f5717214004A7f26888",
            "balance": "5.030001",
            "chainId": "eip155:10",
            "decimals": 6,
            "iconUrl": undefined,
            "name": "Compound",
            "rwaData": undefined,
            "symbol": "COMP",
            "tokenFiatAmount": 15236.3760291,
          },
          "eip155:10/slip44:60": {
            "assetId": "eip155:10/slip44:60",
            "balance": "1.0000125",
            "chainId": "eip155:10",
            "decimals": 18,
            "name": "Ether",
            "symbol": "ETH",
            "tokenFiatAmount": 2524.281553125,
          },
          "solana:5eykt4usfv8p8njdtrepy1vzqkqzkvdp/slip44:501": {
            "accountType": "solana:data-account",
            "assetId": "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501",
            "balance": "1.530",
            "chainId": "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
            "decimals": 18,
            "name": "Solana",
            "symbol": "SOL",
            "tokenFiatAmount": 210.8493,
          },
          "solana:5eykt4usfv8p8njdtrepy1vzqkqzkvdp/token:epjfwdd5aufqssqem2qn1xzybapc8g4weggkzwytdt1v": {
            "accountType": "solana:data-account",
            "assetId": "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
            "balance": "2.043238",
            "chainId": "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
            "decimals": 6,
            "name": "USDC",
            "symbol": "USDC",
            "tokenFiatAmount": 2.04284978478,
          },
        }
      `);

      expect(balanceByChainId).toMatchInlineSnapshot(`
        {
          "bip122:000000000019d6689c085ae165831e93": 91.238,
          "eip155:1": 25.24357593632,
          "eip155:10": 20648.96592298529,
          "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp": 212.89214978478,
        }
      `);
    });

    it('uses allTokens as fallback when token is absent from tokensChainsCache', () => {
      const FALLBACK_TOKEN_ADDRESS =
        '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef';
      const FALLBACK_ASSET_ID = `eip155:1/erc20:${toChecksumHexAddress(
        FALLBACK_TOKEN_ADDRESS,
      )}`;
      const state = createBridgeMockStore({
        featureFlagOverrides: {
          bridgeConfig: {
            refreshRate: 30000,
            priceImpactThreshold: { normal: 1, gasless: 2 },
            maxRefreshCount: 5,
            support: true,
            chains: {
              [CHAIN_IDS.MAINNET]: {
                isActiveSrc: true,
                isActiveDest: true,
              },
            },
            chainRanking: [{ chainId: formatChainIdToCaip(CHAIN_IDS.MAINNET) }],
          },
        },
        metamaskStateOverrides: {
          ...UNIFIED_BRIDGE_ASSET_STATE,
          // Token present in unified assets (→ allTokens) but not tokensChainsCache
          assetsInfo: {
            ...UNIFIED_BRIDGE_ASSET_STATE.assetsInfo,
            [FALLBACK_ASSET_ID]: {
              type: 'erc20',
              decimals: 18,
              symbol: 'FALL',
              name: 'Fallback Token',
              image: 'https://example.com/fall.png',
            },
          },
          assetsBalance: {
            ...UNIFIED_BRIDGE_ASSET_STATE.assetsBalance,
            [MOCK_EVM_ACCOUNT.id]: {
              ...UNIFIED_BRIDGE_ASSET_STATE.assetsBalance[MOCK_EVM_ACCOUNT.id],
              [FALLBACK_ASSET_ID]: { amount: '1' },
            },
          },
          tokensChainsCache: {
            [CHAIN_IDS.MAINNET]: {
              timestamp: 111111,
              data: {},
            },
          },
        },
      });

      const [accountGroup] = getAccountGroupsByAddress(state, [
        MOCK_EVM_ACCOUNT.address,
      ]);
      const assetsWithBalance = getBridgeSortedAssets(state, accountGroup.id);

      const fallbackAsset = assetsWithBalance.find((a) =>
        a.assetId.toLowerCase().includes(FALLBACK_TOKEN_ADDRESS),
      );
      expect(fallbackAsset).toBeDefined();
      expect(fallbackAsset).toMatchObject({
        symbol: 'FALL',
        name: 'Fallback Token',
        decimals: 18,
        iconUrl: 'https://example.com/fall.png',
        balance: '1',
        chainId: formatChainIdToCaip(CHAIN_IDS.MAINNET),
      });
    });

    it('falls back to allTokens when tokensChainsCache is absent from state', () => {
      const FALLBACK_TOKEN_ADDRESS =
        '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef';
      const state = createBridgeMockStore({
        featureFlagOverrides: {
          bridgeConfig: {
            refreshRate: 30000,
            priceImpactThreshold: { normal: 1, gasless: 2 },
            maxRefreshCount: 5,
            support: true,
            chains: {
              [CHAIN_IDS.MAINNET]: {
                isActiveSrc: true,
                isActiveDest: true,
              },
            },
            chainRanking: [{ chainId: formatChainIdToCaip(CHAIN_IDS.MAINNET) }],
          },
        },
        metamaskStateOverrides: {
          allTokens: {
            [CHAIN_IDS.MAINNET]: {
              [MOCK_EVM_ACCOUNT.address]: [
                {
                  address: FALLBACK_TOKEN_ADDRESS,
                  decimals: 18,
                  symbol: 'FALL',
                  name: 'Fallback Token',
                  image: 'https://example.com/fall.png',
                },
              ],
            },
          },
          tokenBalances: {
            [MOCK_EVM_ACCOUNT.address]: {
              [CHAIN_IDS.MAINNET]: {
                [FALLBACK_TOKEN_ADDRESS]: '0xDE0B6B3A7640000', // 1e18 → "1"
              },
            },
          },
        },
      });

      // `TokenListController` is no longer initialized, so state has no cache.
      Reflect.deleteProperty(state.metamask, 'tokensChainsCache');

      const [accountGroup] = getAccountGroupsByAddress(state, [
        MOCK_EVM_ACCOUNT.address,
      ]);
      const assetsWithBalance = getBridgeSortedAssets(state, accountGroup.id);

      expect(
        assetsWithBalance.find((asset) =>
          asset.assetId.toLowerCase().includes(FALLBACK_TOKEN_ADDRESS),
        ),
      ).toMatchObject({
        symbol: 'FALL',
        name: 'Fallback Token',
        decimals: 18,
        balance: '1',
      });
    });

    it('returns empty results when accountGroupId is undefined', () => {
      const state = createBridgeMockStore({
        featureFlagOverrides: {
          bridgeConfig: {
            refreshRate: 30000,
            priceImpactThreshold: {
              normal: 1,
              gasless: 2,
            },
            maxRefreshCount: 5,
            support: true,
            chains: {
              [CHAIN_IDS.MAINNET]: {
                isActiveSrc: true,
                isActiveDest: true,
              },
            },
            chainRanking: [{ chainId: formatChainIdToCaip(CHAIN_IDS.MAINNET) }],
          },
        },
        metamaskStateOverrides: {
          ...UNIFIED_BRIDGE_ASSET_STATE,
        },
      });

      // Simulate the caller pattern: accountGroup is undefined when address has no matching group
      const [accountGroup] = getAccountGroupsByAddress(state, [
        'non-existent-address',
      ]);
      expect(accountGroup).toBeUndefined();

      expect(getBridgeSortedAssets(state, accountGroup?.id)).toEqual([]);
      expect(getBridgeAssetsByAssetId(state, accountGroup?.id)).toEqual({});
      expect(getBridgeBalancesByChainId(state, accountGroup?.id)).toEqual({});
    });
  });
});
