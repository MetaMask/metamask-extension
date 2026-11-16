import { readdirSync, readFileSync } from 'fs';
import path from 'path';
import {
  API_RESPONSES,
  buildAccountsSupportedNetworksV2,
  buildBridgePopularToken,
  buildBridgeTokensSearch,
  buildBridgeTxStatus,
  buildExchangeRates,
  buildFourByteSignatures,
  buildGasPrices,
  buildMultiaccountBalancesV5,
  buildSpotPrice,
  buildTokenListToken,
  buildTokensV3Asset,
  buildTxSentinelBatchStatus,
  buildTxSentinelNetwork,
  placeholderOf,
  withOverrides,
} from '.';

const REGISTRY_FILE = 'sources.json';

type RegistryEntry = {
  method?: string;
  url?: string;
  mode?: string;
  reason?: string;
  follows?: string;
};

const fixtureIds = readdirSync(__dirname)
  .filter((name) => name.endsWith('.json') && name !== REGISTRY_FILE)
  .map((name) => name.slice(0, -'.json'.length))
  .sort();

const registry: Record<string, RegistryEntry> = JSON.parse(
  readFileSync(path.join(__dirname, REGISTRY_FILE), 'utf8'),
);

const USDC_ASSET_ID =
  'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';

describe('api-responses', () => {
  describe('fixture files, registry and API_RESPONSES', () => {
    it('registers every fixture file', () => {
      expect(Object.keys(registry).sort()).toStrictEqual(fixtureIds);
    });

    it('exports every fixture file from API_RESPONSES', () => {
      expect(Object.keys(API_RESPONSES).sort()).toStrictEqual(fixtureIds);
    });

    for (const id of fixtureIds) {
      it(`${id} has a valid registry entry`, () => {
        const { method, url, mode, reason, follows } = registry[id];

        expect(['write', 'derived', 'skip']).toContain(mode);
        expect(url).toMatch(/^https:\/\//u);
        expect(mode !== 'write' || method === 'GET').toBe(true);
        expect(mode !== 'skip' || Boolean(reason?.trim())).toBe(true);
        expect(mode !== 'derived' || fixtureIds.includes(follows ?? '')).toBe(
          true,
        );
      });
    }
  });

  describe('override types', () => {
    it('require identity fields and reject unknown keys', () => {
      // @ts-expect-error: a spot price needs the asset's id.
      buildSpotPrice({ price: 1 });
      // @ts-expect-error: a v3 asset needs its assetId.
      buildTokensV3Asset({ symbol: 'USDC' });
      // @ts-expect-error: a token list entry needs its address.
      buildTokenListToken({ symbol: 'USDC' });
      // @ts-expect-error: a bridge token needs its address and assetId.
      buildBridgePopularToken({ symbol: 'USDC' });
      buildBridgeTokensSearch([
        // @ts-expect-error: a bridge token needs its address and assetId.
        { symbol: 'USDC' },
      ]);
      // @ts-expect-error: misspelled field.
      buildSpotPrice({ id: USDC_ASSET_ID, prce: 1 });
      // @ts-expect-error: misspelled field.
      buildGasPrices({ SafeGasPrise: '1' });

      expect(true).toBe(true);
    });
  });

  describe('withOverrides', () => {
    it('merges nested objects and replaces arrays and scalars', () => {
      expect(
        withOverrides(
          { a: { b: 1, c: 2 }, list: [1, 2], keep: 'x' },
          { a: { b: 3 }, list: [9] },
        ),
      ).toStrictEqual({ a: { b: 3, c: 2 }, list: [9], keep: 'x' });
    });
  });

  describe('placeholderOf', () => {
    it('keeps the shape and drops the values', () => {
      expect(
        placeholderOf({
          id: 'ethereum',
          price: 3010,
          active: true,
          missing: null,
          tags: ['a'],
          rows: [{ name: 'x' }],
        }),
      ).toStrictEqual({
        id: '',
        price: 0,
        active: false,
        missing: null,
        tags: [],
        rows: [{ name: '' }],
      });
    });
  });

  describe('buildExchangeRates', () => {
    it('returns only the requested tickers with the given values', () => {
      expect(buildExchangeRates({ eth: 0.5, usd: 2 })).toStrictEqual({
        eth: { ...API_RESPONSES['price-v1-exchange-rates'].eth, value: 0.5 },
        usd: { ...API_RESPONSES['price-v1-exchange-rates'].usd, value: 2 },
      });
    });

    it('throws for a ticker the fixture does not have', () => {
      expect(() =>
        buildExchangeRates({
          xyz: 1,
        } as Parameters<typeof buildExchangeRates>[0]),
      ).toThrow('No exchange rate fixture for "xyz"');
    });
  });

  describe('buildSpotPrice', () => {
    it('does not copy the fixture asset onto another asset', () => {
      const spot = buildSpotPrice({ id: USDC_ASSET_ID, price: 0.9999 });
      const fixtureEntry = API_RESPONSES['price-v3-spot']['eip155:1/slip44:60'];

      expect(spot.id).toBe(USDC_ASSET_ID);
      expect(spot.price).toBe(0.9999);
      expect(spot.totalVolume).toBe(0);
      expect(spot.dilutedMarketCap).toBe(0);
      expect(Object.keys(spot).sort()).toStrictEqual(
        Object.keys(fixtureEntry).sort(),
      );
    });
  });

  describe('buildTokensV3Asset', () => {
    it('applies overrides and takes unset fields from the fixture shape', () => {
      const asset = buildTokensV3Asset({
        assetId: 'eip155:1/slip44:60',
        symbol: 'ETH',
        occurrences: 100,
      });

      expect(asset.assetId).toBe('eip155:1/slip44:60');
      expect(asset.symbol).toBe('ETH');
      expect(asset.occurrences).toBe(100);
      expect(asset.name).toBe('');
      expect(asset.decimals).toBe(0);
    });
  });

  describe('buildTokenListToken', () => {
    it('applies overrides and takes unset fields from the fixture shape', () => {
      const token = buildTokenListToken({
        address: '0x2efa2cb29c2341d8e5ba7d3262c9e9d6f1bf3711',
        symbol: 'foo',
      });

      expect(token.address).toBe('0x2efa2cb29c2341d8e5ba7d3262c9e9d6f1bf3711');
      expect(token.symbol).toBe('foo');
      expect(token.aggregators).toStrictEqual([]);
      expect(token.storage).toStrictEqual({ balance: 0, approval: 0 });
    });
  });

  describe('buildBridgePopularToken', () => {
    it('applies overrides and takes unset fields from the fixture shape', () => {
      const token = buildBridgePopularToken({
        address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        assetId: USDC_ASSET_ID,
        symbol: 'USDC',
      });

      expect(token.symbol).toBe('USDC');
      expect(token.assetId).toBe(USDC_ASSET_ID);
      expect(token.name).toBe('');
      expect(token.decimals).toBe(0);
    });
  });

  describe('buildBridgeTokensSearch', () => {
    it('wraps the tokens in the fixture page envelope', () => {
      const token = {
        address: '0x1',
        assetId: 'eip155:1/erc20:0x1',
        symbol: 'ONE',
        decimals: 6,
        name: 'One',
      };

      expect(buildBridgeTokensSearch([token])).toStrictEqual({
        data: [token],
        pageInfo: API_RESPONSES['bridge-get-tokens-search'].pageInfo,
      });
    });
  });

  describe('buildMultiaccountBalancesV5', () => {
    it('counts the rows and fills unset row fields from the fixture shape', () => {
      const response = buildMultiaccountBalancesV5([
        { accountId: 'eip155:1:0xabc', assetId: USDC_ASSET_ID },
        { accountId: 'eip155:1:0xdef', assetId: USDC_ASSET_ID, balance: '7' },
      ]);

      expect(response.count).toBe(2);
      expect(response.unprocessedNetworks).toStrictEqual(
        API_RESPONSES['accounts-balances-v5'].unprocessedNetworks,
      );
      expect(response.balances[0]).toStrictEqual({
        accountId: 'eip155:1:0xabc',
        assetId: USDC_ASSET_ID,
        balance: '',
      });
      expect(response.balances[1].balance).toBe('7');
    });
  });

  describe('buildBridgeTxStatus', () => {
    it('merges chain overrides with the fixture chains', () => {
      const response = buildBridgeTxStatus({
        status: 'PENDING',
        srcChain: { chainId: 10 },
      });

      expect(response.status).toBe('PENDING');
      expect(response.bridge).toBe(
        API_RESPONSES['bridge-get-tx-status'].bridge,
      );
      expect(response.srcChain).toStrictEqual({
        ...API_RESPONSES['bridge-get-tx-status'].srcChain,
        chainId: 10,
      });
      expect(response.destChain).toStrictEqual(
        API_RESPONSES['bridge-get-tx-status'].destChain,
      );
    });
  });

  describe('buildAccountsSupportedNetworksV2', () => {
    it('replaces the lists it is given and keeps the others', () => {
      const response = buildAccountsSupportedNetworksV2({ fullSupport: [] });

      expect(response.fullSupport).toStrictEqual([]);
      expect(response.partialSupport).toStrictEqual(
        API_RESPONSES['accounts-supported-networks-v2'].partialSupport,
      );
    });
  });

  describe('buildGasPrices', () => {
    it('applies overrides and keeps unset fields from the fixture', () => {
      const response = buildGasPrices({ FastGasPrice: '99' });

      expect(response.FastGasPrice).toBe('99');
      expect(response.SafeGasPrice).toBe(
        API_RESPONSES['gas-prices'].SafeGasPrice,
      );
    });

    it('returns the fixture when nothing is overridden', () => {
      expect(buildGasPrices()).toStrictEqual(API_RESPONSES['gas-prices']);
    });
  });

  describe('buildTxSentinelNetwork', () => {
    it('applies overrides and keeps unset fields from the fixture', () => {
      const network = buildTxSentinelNetwork({
        sendBundle: true,
        cubistSigners: ['0x1111111111111111111111111111111111111111'],
      });

      expect(network.sendBundle).toBe(true);
      expect(network.cubistSigners).toStrictEqual([
        '0x1111111111111111111111111111111111111111',
      ]);
      expect(network.network).toBe(
        API_RESPONSES['tx-sentinel-network'].network,
      );
    });

    it('returns the fixture when nothing is overridden', () => {
      expect(buildTxSentinelNetwork()).toStrictEqual(
        API_RESPONSES['tx-sentinel-network'],
      );
    });
  });

  describe('buildTxSentinelBatchStatus', () => {
    it('keys the status by the given UUID and keeps unset fields', () => {
      const response = buildTxSentinelBatchStatus('uuid-1', {
        minedTx: 'reverted',
      });
      const [fixtureStatus] = Object.values(
        API_RESPONSES['tx-sentinel-batch-status'],
      );

      expect(Object.keys(response)).toStrictEqual(['uuid-1']);
      expect(response['uuid-1'].minedTx).toBe('reverted');
      expect(response['uuid-1'].isSettled).toBe(fixtureStatus.isSettled);
    });

    it('returns the fixture status when nothing is overridden', () => {
      const [fixtureStatus] = Object.values(
        API_RESPONSES['tx-sentinel-batch-status'],
      );

      expect(buildTxSentinelBatchStatus('uuid-0')['uuid-0']).toStrictEqual(
        fixtureStatus,
      );
    });
  });

  describe('buildFourByteSignatures', () => {
    it('returns one result with the given signature', () => {
      const response = buildFourByteSignatures({
        // eslint-disable-next-line @typescript-eslint/naming-convention
        hex_signature: '0x095ea7b3',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        text_signature: 'approve(address,uint256)',
      });

      expect(response.count).toBe(API_RESPONSES['4byte-signatures'].count);
      expect(response.results).toHaveLength(1);
      expect(response.results[0].text_signature).toBe(
        'approve(address,uint256)',
      );
      expect(response.results[0].bytes_signature).toBe('');
    });
  });
});
