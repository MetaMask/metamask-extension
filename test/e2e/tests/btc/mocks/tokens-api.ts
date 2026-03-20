import { Mockttp } from 'mockttp';

const BTC_CAIP_ASSET_ID = 'bip122:000000000019d6689c085ae165831e93/slip44:0';
const BTC_CHAIN_CAIP_ID = 'bip122:000000000019d6689c085ae165831e93';

const SOL_CAIP_ASSET_ID =
  'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501';
const SOL_CHAIN_CAIP_ID = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp';
const SOL_USDC_CAIP_ASSET_ID =
  'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

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
 * decimals, and name for BTC and SOL native assets, which are required by
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

      if (assetIds.includes('eip155:1337')) {
        results.push({
          assetId: 'eip155:1337/slip44:60',
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

      return { statusCode: 200, json: results };
    });
