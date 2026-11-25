import { readdirSync, readFileSync } from 'fs';
import path from 'path';
import {
  API_ENDPOINTS,
  accountsBalancesV5,
  accountsSupportedNetworksV2,
  bridgeGetTokensPopular,
  bridgeGetTokensSearch,
  bridgeGetTxStatus,
  contentfulServedAssets,
  findDuplicateEndpoints,
  fourByteSignatures,
  gasPrices,
  priceV1ExchangeRates,
  priceV3Spot,
  tokenList,
  tokensV3Assets,
  txSentinelBatchStatus,
  txSentinelNetwork,
} from '.';

const fixtureIds = readdirSync(__dirname)
  .filter((name) => name.endsWith('.json'))
  .map((name) => name.slice(0, -'.json'.length))
  .sort();

const endpoints = Object.entries(API_ENDPOINTS);

const USDC_ASSET_ID =
  'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';

/**
 * Whether the endpoint matcher accepts a URL, following mockttp: a string
 * matches the URL without its query, a regex is tested against the full URL.
 *
 * @param matcher - The endpoint matcher.
 * @param url - The URL to test.
 * @returns True when the matcher accepts the URL.
 */
function matches(matcher: string | RegExp, url: string): boolean {
  return typeof matcher === 'string'
    ? url.split('?')[0] === matcher
    : matcher.test(url);
}

describe('API endpoint definitions', () => {
  describe('consistency', () => {
    it('defines one endpoint for every JSON fixture in the folder', () => {
      expect(Object.keys(API_ENDPOINTS).sort()).toStrictEqual(fixtureIds);
    });

    for (const [key, endpoint] of endpoints) {
      it(`keys ${key} by its id and serves its JSON fixture`, () => {
        expect(endpoint.id).toBe(key);
        expect(endpoint.body).toStrictEqual(
          JSON.parse(readFileSync(path.join(__dirname, `${key}.json`), 'utf8')),
        );
      });

      it(`matches the sync URL of ${key}`, () => {
        expect(endpoint.syncUrl).toMatch(/^https:\/\//u);
        expect(matches(endpoint.url, endpoint.syncUrl)).toBe(true);
      });
    }

    it('has no duplicate ids or endpoints', () => {
      expect(findDuplicateEndpoints(endpoints)).toStrictEqual([]);
    });

    it('serves the fixture as the default for 4byte, tx-sentinel /network and the token list', () => {
      expect(fourByteSignatures.hasFixtureDefault).toBe(true);
      expect(txSentinelNetwork.hasFixtureDefault).toBe(true);
      expect(tokenList.hasFixtureDefault).toBe(true);
    });
  });

  describe('identity fields', () => {
    it('require the asset identity and reject unknown keys', () => {
      // @ts-expect-error: a spot price needs its Price API slug.
      priceV3Spot.response({ [USDC_ASSET_ID]: { price: 1 } });
      // @ts-expect-error: a v3 asset needs its assetId.
      tokensV3Assets.response([{ symbol: 'USDC' }]);
      // @ts-expect-error: a token list entry needs its address.
      tokenList.response([{ symbol: 'USDC' }]);
      // @ts-expect-error: a bridge token needs its address and assetId.
      bridgeGetTokensPopular.response([{ symbol: 'USDC' }]);
      // @ts-expect-error: a bridge token needs its address and assetId.
      bridgeGetTokensSearch.response([{ symbol: 'USDC' }]);
      // @ts-expect-error: a balance row needs its accountId and assetId.
      accountsBalancesV5.response([{ balance: '1' }]);
      accountsBalancesV5.response([
        // @ts-expect-error: a balance row needs its balance.
        { accountId: 'eip155:1:0xabc', assetId: USDC_ASSET_ID },
      ]);
      // @ts-expect-error: a 4byte result needs its signature.
      fourByteSignatures.response({ id: 1 });
      priceV3Spot.response({
        // @ts-expect-error: misspelled field.
        [USDC_ASSET_ID]: { id: 'usd-coin', prce: 1 },
      });
      // @ts-expect-error: misspelled field.
      gasPrices.response({ SafeGasPrise: '1' });

      expect(true).toBe(true);
    });
  });

  describe('priceV1ExchangeRates', () => {
    it('returns only the requested tickers with the given values', () => {
      expect(priceV1ExchangeRates.response({ eth: 0.5, usd: 2 })).toStrictEqual(
        {
          eth: { ...priceV1ExchangeRates.body.eth, value: 0.5 },
          usd: { ...priceV1ExchangeRates.body.usd, value: 2 },
        },
      );
    });

    it('throws for a ticker without a fixture entry', () => {
      expect(() =>
        priceV1ExchangeRates.response({ xyz: 1 } as unknown as Record<
          'eth',
          number
        >),
      ).toThrow('No exchange rate fixture for "xyz"');
    });
  });

  describe('priceV3Spot', () => {
    it('keeps the caller slug and never copies the fixture asset or the map key', () => {
      const response = priceV3Spot.response({
        [USDC_ASSET_ID]: { id: 'usd-coin', price: 0.9999 },
      });
      const entry = response[USDC_ASSET_ID];
      const fixtureEntry = priceV3Spot.body['eip155:1/slip44:60'];

      expect(entry.id).toBe('usd-coin');
      expect(entry.price).toBe(0.9999);
      expect(entry.totalVolume).toBe(0);
      expect(entry.dilutedMarketCap).toBe(0);
      expect(Object.keys(entry).sort()).toStrictEqual(
        Object.keys(fixtureEntry).sort(),
      );
    });
  });

  describe('tokensV3Assets', () => {
    it('applies overrides and takes unset fields from the fixture shape', () => {
      const [asset] = tokensV3Assets.response([
        { assetId: 'eip155:1/slip44:60', symbol: 'ETH', occurrences: 100 },
      ]);

      expect(asset.symbol).toBe('ETH');
      expect(asset.occurrences).toBe(100);
      expect(asset.name).toBe('');
      expect(asset.decimals).toBe(0);
    });
  });

  describe('tokenList', () => {
    it('applies overrides and takes unset fields from the fixture shape', () => {
      const [token] = tokenList.response([
        {
          address: '0x2efa2cb29c2341d8e5ba7d3262c9e9d6f1bf3711',
          symbol: 'foo',
        },
      ]);

      expect(token.symbol).toBe('foo');
      expect(token.aggregators).toStrictEqual([]);
      expect(token.storage).toStrictEqual({ balance: 0, approval: 0 });
    });
  });

  describe('bridge tokens', () => {
    it('builds popular tokens from the fixture shape', () => {
      const [token] = bridgeGetTokensPopular.response([
        {
          address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          assetId: USDC_ASSET_ID,
          symbol: 'USDC',
        },
      ]);

      expect(token.symbol).toBe('USDC');
      expect(token.name).toBe('');
      expect(token.decimals).toBe(0);
    });

    it('wraps search results in the fixture page envelope', () => {
      const token = {
        address: '0x1',
        assetId: 'eip155:1/erc20:0x1',
        symbol: 'ONE',
        decimals: 6,
        name: 'One',
      };

      expect(bridgeGetTokensSearch.response([token])).toStrictEqual({
        data: [token],
        pageInfo: bridgeGetTokensSearch.body.pageInfo,
      });
    });
  });

  describe('accountsBalancesV5', () => {
    it('counts the rows and keeps the unprocessed networks from the fixture', () => {
      const response = accountsBalancesV5.response([
        { accountId: 'eip155:1:0xabc', assetId: USDC_ASSET_ID, balance: '3' },
        { accountId: 'eip155:1:0xdef', assetId: USDC_ASSET_ID, balance: '7' },
      ]);

      expect(response.count).toBe(2);
      expect(response.unprocessedNetworks).toStrictEqual(
        accountsBalancesV5.body.unprocessedNetworks,
      );
      expect(response.balances[0].balance).toBe('3');
      expect(response.balances[1].balance).toBe('7');
    });
  });

  describe('envelope endpoints', () => {
    it('merges nested overrides for bridgeGetTxStatus', () => {
      const response = bridgeGetTxStatus.response({
        status: 'PENDING',
        srcChain: { chainId: 10 },
      });

      expect(response.status).toBe('PENDING');
      expect(response.bridge).toBe(bridgeGetTxStatus.body.bridge);
      expect(response.srcChain).toStrictEqual({
        ...bridgeGetTxStatus.body.srcChain,
        chainId: 10,
      });
    });

    it('replaces lists for accountsSupportedNetworksV2', () => {
      const response = accountsSupportedNetworksV2.response({
        fullSupport: [],
      });

      expect(response.fullSupport).toStrictEqual([]);
      expect(response.partialSupport).toStrictEqual(
        accountsSupportedNetworksV2.body.partialSupport,
      );
    });

    it('keeps unset gas prices from the fixture', () => {
      const response = gasPrices.response({ FastGasPrice: '99' });

      expect(response.FastGasPrice).toBe('99');
      expect(response.SafeGasPrice).toBe(gasPrices.body.SafeGasPrice);
    });

    it('keeps unset tx-sentinel network flags from the fixture', () => {
      const response = txSentinelNetwork.response({
        sendBundle: true,
        cubistSigners: ['0x1111111111111111111111111111111111111111'],
      });

      expect(response.sendBundle).toBe(true);
      expect(response.network).toBe(txSentinelNetwork.body.network);
    });

    it('keys the batch status by the given UUID', () => {
      const response = txSentinelBatchStatus.response({
        uuid: 'uuid-1',
        minedTx: 'reverted',
      });
      const [fixtureStatus] = Object.values(txSentinelBatchStatus.body);

      expect(Object.keys(response)).toStrictEqual(['uuid-1']);
      expect(response['uuid-1'].minedTx).toBe('reverted');
      expect(response['uuid-1'].isSettled).toBe(fixtureStatus.isSettled);
    });

    it('returns one 4byte result with the given signature', () => {
      const response = fourByteSignatures.response({
        // eslint-disable-next-line @typescript-eslint/naming-convention
        hex_signature: '0x095ea7b3',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        text_signature: 'approve(address,uint256)',
      });

      expect(response.count).toBe(fourByteSignatures.body.count);
      expect(response.results).toHaveLength(1);
      expect(response.results[0].bytes_signature).toBe('');
    });
  });

  describe('contentfulServedAssets', () => {
    it('returns no assets when includes is missing', () => {
      expect(contentfulServedAssets({})).toStrictEqual([]);
      expect(contentfulServedAssets({ includes: {} })).toStrictEqual([]);
    });

    it('drops placeholder assets that have no id', () => {
      expect(
        contentfulServedAssets({
          includes: {
            Asset: [{ sys: { id: '' } }, { sys: { id: 'banner' } }],
          },
        }),
      ).toStrictEqual([{ sys: { id: 'banner' } }]);
    });
  });
});
