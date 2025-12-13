import { formatChainIdToCaip } from '@metamask/bridge-controller';
import {
  createBridgeMockStore,
  MOCK_EVM_ACCOUNT,
} from '../../../test/data/bridge/mock-bridge-store';
import { CHAIN_IDS } from '../../../shared/constants/network';
import { MultichainNetworks } from '../../../shared/constants/multichain/networks';
import { getAccountGroupsByAddress } from '../../selectors/multichain-accounts/account-tree';
import {
  getBridgeBalancesByChainId,
  getBridgeAssetsByAssetId,
  getBridgeSortedAssets,
} from './asset-selectors';

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
            "assetId": "eip155:1/erc20:0x1f9840a85d5af5bf1d1762f925bdaddc4201f984",
            "balance": "10.0412340001",
            "chainId": "eip155:1",
            "decimals": 10,
            "name": "Uniswap",
            "symbol": "UNI",
            "tokenFiatAmount": 58296.28634914631,
          },
          {
            "assetId": "eip155:1/erc20:0x514910771af9ca656af840dff83e8264ecf986ca",
            "balance": "5.032030001",
            "chainId": "eip155:1",
            "decimals": 9,
            "name": "Link",
            "symbol": "LINK",
            "tokenFiatAmount": 15242.297485480694,
          },
          {
            "assetId": "eip155:10/erc20:0xc00e94cb662c3520282e6f5717214004a7f26888",
            "balance": "5.030001",
            "chainId": "eip155:10",
            "decimals": 6,
            "name": "Compound",
            "symbol": "COMP",
            "tokenFiatAmount": 15236.151529110364,
          },
          {
            "assetId": "eip155:10/erc20:0x514910771af9ca656af840dff83e8264ecf986ca",
            "balance": "9535.2030001",
            "chainId": "eip155:10",
            "decimals": 9,
            "name": "Link",
            "symbol": "LINK",
            "tokenFiatAmount": 2888.265783055537,
          },
          {
            "assetId": "eip155:10/slip44:60",
            "balance": "1.0000125",
            "chainId": "eip155:10",
            "decimals": 18,
            "name": "Ether",
            "symbol": "ETH",
            "tokenFiatAmount": 2524.2443591635597,
          },
          {
            "assetId": "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501",
            "balance": "1.530",
            "chainId": "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
            "decimals": 18,
            "name": "Solana",
            "symbol": "SOL",
            "tokenFiatAmount": 210.8493,
          },
          {
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
            "tokenFiatAmount": 25.242128065034784,
          },
          {
            "assetId": "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
            "balance": "2.043238",
            "chainId": "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
            "decimals": 6,
            "name": "USDC",
            "symbol": "USDC",
            "tokenFiatAmount": 2.04284978478,
          },
        ]
      `);
      expect(balanceByAssetId).toMatchInlineSnapshot(`
        {
          "bip122:000000000019d6689c085ae165831e93/slip44:0": {
            "assetId": "bip122:000000000019d6689c085ae165831e93/slip44:0",
            "balance": ".001",
            "chainId": "bip122:000000000019d6689c085ae165831e93",
            "decimals": 18,
            "name": "Bitcoin",
            "symbol": "BTC",
            "tokenFiatAmount": 91.238,
          },
          "eip155:1/erc20:0x1f9840a85d5af5bf1d1762f925bdaddc4201f984": {
            "assetId": "eip155:1/erc20:0x1f9840a85d5af5bf1d1762f925bdaddc4201f984",
            "balance": "10.0412340001",
            "chainId": "eip155:1",
            "decimals": 10,
            "name": "Uniswap",
            "symbol": "UNI",
            "tokenFiatAmount": 58296.28634914631,
          },
          "eip155:1/erc20:0x514910771af9ca656af840dff83e8264ecf986ca": {
            "assetId": "eip155:1/erc20:0x514910771af9ca656af840dff83e8264ecf986ca",
            "balance": "5.032030001",
            "chainId": "eip155:1",
            "decimals": 9,
            "name": "Link",
            "symbol": "LINK",
            "tokenFiatAmount": 15242.297485480694,
          },
          "eip155:1/slip44:60": {
            "assetId": "eip155:1/slip44:60",
            "balance": "0.01",
            "chainId": "eip155:1",
            "decimals": 18,
            "name": "Ether",
            "symbol": "ETH",
            "tokenFiatAmount": 25.242128065034784,
          },
          "eip155:10/erc20:0x514910771af9ca656af840dff83e8264ecf986ca": {
            "assetId": "eip155:10/erc20:0x514910771af9ca656af840dff83e8264ecf986ca",
            "balance": "9535.2030001",
            "chainId": "eip155:10",
            "decimals": 9,
            "name": "Link",
            "symbol": "LINK",
            "tokenFiatAmount": 2888.265783055537,
          },
          "eip155:10/erc20:0xc00e94cb662c3520282e6f5717214004a7f26888": {
            "assetId": "eip155:10/erc20:0xc00e94cb662c3520282e6f5717214004a7f26888",
            "balance": "5.030001",
            "chainId": "eip155:10",
            "decimals": 6,
            "name": "Compound",
            "symbol": "COMP",
            "tokenFiatAmount": 15236.151529110364,
          },
          "eip155:10/slip44:60": {
            "assetId": "eip155:10/slip44:60",
            "balance": "1.0000125",
            "chainId": "eip155:10",
            "decimals": 18,
            "name": "Ether",
            "symbol": "ETH",
            "tokenFiatAmount": 2524.2443591635597,
          },
          "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501": {
            "assetId": "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501",
            "balance": "1.530",
            "chainId": "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
            "decimals": 18,
            "name": "Solana",
            "symbol": "SOL",
            "tokenFiatAmount": 210.8493,
          },
          "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v": {
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
          "eip155:1": 73563.82596269203,
          "eip155:10": 20648.66167132946,
          "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp": 212.89214978478,
        }
      `);
    });
  });
});
