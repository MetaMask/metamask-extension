import { Mockttp } from 'mockttp';

const BTC_CAIP_ASSET_ID = 'bip122:000000000019d6689c085ae165831e93/slip44:0';
const BTC_CHAIN_CAIP_ID = 'bip122:000000000019d6689c085ae165831e93';

const SOL_CAIP_ASSET_ID = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501';
const SOL_CHAIN_CAIP_ID = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp';
const SOL_USDC_CAIP_ASSET_ID =
  'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

const TRON_NATIVE_CAIP_ASSET_ID = 'tron:728126428/slip44:195';
const TRON_CHAIN_CAIP_ID = 'tron:728126428';

/**
 * Mock GET /v2/supportedNetworks for the Tokens API.
 *
 * The TokenDataSource calls this endpoint to determine which chain IDs are
 * supported before fetching asset metadata. Without non-EVM chains in the
 * response, the BTC/SOL assets are filtered out and no metadata is fetched,
 * leaving AssetsController.assetsInfo empty — which causes the balance
 * migration selector to skip those balances entirely.
 *
 * @param mockServer - The mock server instance.
 */
export const mockTokensV2SupportedNetworks = (mockServer: Mockttp) =>
  mockServer
    .forGet(/https:\/\/tokens\.api\.cx\.metamask\.io\/v2\/supportedNetworks/u)
    .always()
    .thenJson(200, {
      fullSupport: [
        BTC_CHAIN_CAIP_ID,
        SOL_CHAIN_CAIP_ID,
        TRON_CHAIN_CAIP_ID,
        'eip155:1',
        'eip155:137',
        'eip155:56',
        'eip155:1337',
        'eip155:42161',
        'eip155:10',
        'eip155:8453',
      ],
      partialSupport: [],
    });

/**
 * Mock GET /v3/assets for the Tokens API.
 *
 * The TokenDataSource calls this endpoint to fetch asset metadata
 * (assetsInfo) for assets whose metadata is missing. Provides symbol,
 * decimals, and name for a fixed set of chains (ETH 1337, BTC, SOL, Solana
 * USDC, Tron native), which are required by
 * getMultiChainBalancesControllerBalances to include the balance in its
 * output when the assetsUnifyState feature flag is enabled.
 *
 * @param mockServer - The mock server instance.
 */
export const mockTokensV3Assets = (mockServer: Mockttp) =>
  mockServer
    .forGet(/https:\/\/tokens\.api\.cx\.metamask\.io\/v3\/assets/u)
    .always()
    .thenCallback((request) => {
      const url = new URL(request.url);
      const assetIds = url.searchParams.getAll('assetIds').join(',');

      const results = [];

      if (
        assetIds.includes(
          'eip155:1/erc20:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        )
      ) {
        results.push({
          assetId: 'eip155:1/erc20:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
          name: 'USD Coin',
          symbol: 'USDC',
          decimals: 6,
        });
      }
      if (
        assetIds.includes(
          'eip155:1/erc20:0xdAC17F958D2ee523a2206206994597C13D831ec7',
        )
      ) {
        results.push({
          assetId: 'eip155:1/erc20:0xdAC17F958D2ee523a2206206994597C13D831ec7',
          name: 'Tether USD',
          symbol: 'USDT',
          decimals: 6,
        });
      }

      if (assetIds.includes('eip155:1')) {
        results.push({
          assetId: 'eip155:1/slip44:60',
          name: 'Ethereum',
          symbol: 'ETH',
          decimals: 18,
          iconUrl:
            'https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1337/slip44/60.png',
          coingeckoId: 'ethereum',
        });
      }

      if (assetIds.includes('eip155:1337')) {
        results.push({
          assetId: 'eip155:1337/slip44:1',
          name: 'Ethereum',
          symbol: 'ETH',
          decimals: 18,
          iconUrl:
            'https://static.cx.metamask.io/api/v2/tokenIcons/assets/eip155/1337/slip44/60.png',
          coingeckoId: 'ethereum',
        });
      }

      if (assetIds.includes('bip122:000000000019d6689c085ae165831e93')) {
        results.push({
          assetId: BTC_CAIP_ASSET_ID,
          name: 'Bitcoin',
          symbol: 'BTC',
          decimals: 8,
          iconUrl:
            'https://static.cx.metamask.io/api/v1/tokenIcons/bip122/000000000019d6689c085ae165831e93/slip44/0.png',
          coingeckoId: 'bitcoin',
        });
      }

      if (assetIds.includes('solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp')) {
        results.push({
          assetId: SOL_CAIP_ASSET_ID,
          name: 'Solana',
          symbol: 'SOL',
          decimals: 9,
          iconUrl:
            'https://static.cx.metamask.io/api/v2/tokenIcons/assets/solana/5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44/501.png',
          coingeckoId: 'solana',
        });
      }

      if (assetIds.includes('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')) {
        results.push({
          assetId: SOL_USDC_CAIP_ASSET_ID,
          name: 'USD Coin',
          symbol: 'USDC',
          decimals: 6,
          iconUrl:
            'https://static.cx.metamask.io/api/v2/tokenIcons/assets/solana/5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v.png',
          coingeckoId: 'usd-coin',
        });
      }

      if (assetIds.includes('tron:728126428/slip44:195')) {
        results.push({
          assetId: TRON_NATIVE_CAIP_ASSET_ID,
          name: 'Tron',
          symbol: 'TRX',
          decimals: 6,
          iconUrl:
            'https://static.cx.metamask.io/api/v2/tokenIcons/assets/tron/728126428/slip44/195.png',
          coingeckoId: 'tron',
        });
      }

      if (assetIds.includes('TUPM7K8REVzD2UdV4R5fe5M8XbnR2DdoJ6')) {
        results.push({
          assetId: 'tron:728126428/trc20:TUPM7K8REVzD2UdV4R5fe5M8XbnR2DdoJ6',
          name: 'HTX',
          symbol: 'HTX',
          decimals: 18,
        });
      }

      if (assetIds.includes('TBwoSTyywvLrgjSgaatxrBhxt3DGpVuENh')) {
        results.push({
          assetId: 'tron:728126428/trc20:TBwoSTyywvLrgjSgaatxrBhxt3DGpVuENh',
          name: 'SEED',
          symbol: 'SEED',
          decimals: 6,
        });
      }

      if (assetIds.includes('TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t')) {
        results.push({
          assetId: 'tron:728126428/trc20:TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
          name: 'Tether USD',
          symbol: 'USDT',
          decimals: 6,
        });
      }

      if (assetIds.includes('TXDk8mbtRbXeYuMNS83CfKPaYYT8XWv9Hz')) {
        results.push({
          assetId: 'tron:728126428/trc20:TXDk8mbtRbXeYuMNS83CfKPaYYT8XWv9Hz',
          name: 'Decentralized USD',
          symbol: 'USDD',
          decimals: 18,
        });
      }

      if (assetIds.includes('trc10:1005074')) {
        results.push({
          assetId: 'tron:728126428/trc10:1005074',
          name: 'GasFreeTransferSolution',
          symbol: 'GasFree4uCOM',
          decimals: 6,
        });
      }

      return { statusCode: 200, json: results };
    });
