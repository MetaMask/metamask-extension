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
            "assetId": "eip155:10/erc20:0xc00e94Cb662C3520282E6f5717214004A7f26888",
            "balance": "5.030001",
            "chainId": "eip155:10",
            "decimals": 6,
            "name": "Compound",
            "symbol": "COMP",
            "tokenFiatAmount": 15236.151529110364,
          },
          {
            "assetId": "eip155:10/erc20:0x514910771AF9Ca656af840dff83E8264EcF986CA",
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
          {
            "assetId": "eip155:1/erc20:0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
            "balance": "0.0000001848",
            "chainId": "eip155:1",
            "decimals": 10,
            "name": "Uniswap",
            "symbol": "UNI",
            "tokenFiatAmount": 0.0010728914112762384,
          },
          {
            "assetId": "eip155:1/erc20:0x514910771AF9Ca656af840dff83E8264EcF986CA",
            "balance": "0.000000001",
            "chainId": "eip155:1",
            "decimals": 9,
            "name": "Link",
            "symbol": "LINK",
            "tokenFiatAmount": 0.0000030290553678041743,
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
          "eip155:1/erc20:0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984": {
            "assetId": "eip155:1/erc20:0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
            "balance": "0.0000001848",
            "chainId": "eip155:1",
            "decimals": 10,
            "name": "Uniswap",
            "symbol": "UNI",
            "tokenFiatAmount": 0.0010728914112762384,
          },
          "eip155:1/erc20:0x514910771AF9Ca656af840dff83E8264EcF986CA": {
            "assetId": "eip155:1/erc20:0x514910771AF9Ca656af840dff83E8264EcF986CA",
            "balance": "0.000000001",
            "chainId": "eip155:1",
            "decimals": 9,
            "name": "Link",
            "symbol": "LINK",
            "tokenFiatAmount": 0.0000030290553678041743,
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
          "eip155:10/erc20:0x514910771AF9Ca656af840dff83E8264EcF986CA": {
            "assetId": "eip155:10/erc20:0x514910771AF9Ca656af840dff83E8264EcF986CA",
            "balance": "9535.2030001",
            "chainId": "eip155:10",
            "decimals": 9,
            "name": "Link",
            "symbol": "LINK",
            "tokenFiatAmount": 2888.265783055537,
          },
          "eip155:10/erc20:0xc00e94Cb662C3520282E6f5717214004A7f26888": {
            "assetId": "eip155:10/erc20:0xc00e94Cb662C3520282E6f5717214004A7f26888",
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
          "eip155:1": 25.243203985501427,
          "eip155:10": 20648.66167132946,
          "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp": 212.89214978478,
        }
      `);
    });
  });
});
