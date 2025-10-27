import { Mockttp } from 'mockttp';

const INFURA_BTC_MAINNET_URL =
  'https://bitcoin-mainnet.infura.io/v3/5b98a22672004ef1bf40a80123c5c48d';

const GENESIS_BLOCK_HASH =
  '000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f';

/* eslint-disable @typescript-eslint/naming-convention */

/**
 * Mocks Bitcoin Esplora blockchain endpoints for a fresh wallet with no transactions.
 * This allows Bitcoin account discovery to complete without timing out.
 *
 * @param mockServer - The mock server instance
 * @returns Array of mocked endpoints
 */
export async function mockBitcoinBlockchain(mockServer: Mockttp) {
  return [
    await mockServer
      .forGet(`${INFURA_BTC_MAINNET_URL}/esplora/blocks`)
      .always()
      .thenJson(200, [
        {
          id: '000000000000000000005645962b8ea026323dd3eb24a7ee39c60f285a259bc2',
          height: 918176,
          version: 566566912,
          timestamp: 1759922068,
          tx_count: 3575,
          size: 1681759,
          weight: 3993790,
          merkle_root:
            '7672f7b0d4a6d322ddbdb5b6aa1802352329862af3d116c3aedef2efc167c9e5',
          previousblockhash:
            '000000000000000000012dca96f7e4803c607e2f34d41a2a7ae8f4afb00ae1a7',
          mediantime: 1759919229,
          nonce: 3365112101,
          bits: 385998260,
          difficulty: 150839487445890.5,
        },
      ]),

    // Mock any scripthash transaction lookups - returns empty for fresh wallet
    await mockServer
      .forGet(
        /^https:\/\/bitcoin-mainnet\.infura\.io\/v3\/[^/]+\/esplora\/scripthash\/[0-9a-f]{64}\/txs$/u,
      )
      .always()
      .thenJson(200, []),

    // Mock genesis block hash lookup
    await mockServer
      .forGet(`${INFURA_BTC_MAINNET_URL}/esplora/block-height/0`)
      .always()
      .thenReply(200, GENESIS_BLOCK_HASH),

    // Mock fee estimates
    await mockServer
      .forGet(`${INFURA_BTC_MAINNET_URL}/esplora/fee-estimates`)
      .always()
      .thenJson(200, {
        '1': 2.0,
        '2': 2.0,
        '3': 1.5,
        '4': 1.3,
        '5': 1.3,
        '6': 1.075,
        '7': 1.075,
        '8': 1.075,
        '9': 1.075,
        '10': 1.075,
        '144': 1.075,
        '504': 1.023,
        '1008': 1.023,
      }),
  ];
}

/**
 * Mocks Bitcoin price API endpoints.
 * Returns mock price data to prevent price fetching failures.
 *
 * @param mockServer - The mock server instance
 * @returns Array of mocked endpoints
 */
export async function mockBitcoinPriceApi(mockServer: Mockttp) {
  return [
    await mockServer
      .forGet(
        /^https:\/\/price\.api\.cx\.metamask\.io\/v1\/spot-prices\/bitcoin/u,
      )
      .always()
      .thenJson(200, {
        price: 45000,
        marketCap: 850000000000,
        allTimeHigh: 69000,
        allTimeLow: 0.05,
        totalVolume: 25000000000,
        circulatingSupply: 19500000,
        pricePercentChange1h: 0.5,
        pricePercentChange1d: 1.2,
        pricePercentChange7d: 3.5,
        pricePercentChange14d: 5.0,
        pricePercentChange30d: 8.0,
        pricePercentChange200d: 15.0,
        pricePercentChange1y: 50.0,
      }),
  ];
}
