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
} from '.';

const SPOT_PRICE_FIELDS = [
  'dilutedMarketCap',
  'id',
  'marketCap',
  'price',
  'pricePercentChange1d',
  'totalVolume',
];

describe('api-responses', () => {
  describe('buildExchangeRates', () => {
    it('returns only the requested tickers with the given values', () => {
      expect(buildExchangeRates({ eth: 0.5, usd: 1 })).toStrictEqual({
        eth: { ...API_RESPONSES['price-v1-exchange-rates'].eth, value: 0.5 },
        usd: { ...API_RESPONSES['price-v1-exchange-rates'].usd, value: 1 },
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
    it('keeps the pinned fixture fields and the caller overrides', () => {
      const spot = buildSpotPrice({
        price: 1700,
        assetPriceType: 'fungible',
      });

      expect(spot).toMatchObject({
        ...API_RESPONSES['price-v3-spot-prices']['eip155:1/slip44:60'],
        price: 1700,
        assetPriceType: 'fungible',
      });
      expect(Object.keys(spot).sort()).toStrictEqual(
        [...SPOT_PRICE_FIELDS, 'assetPriceType'].sort(),
      );
    });
  });

  describe('buildMultiaccountBalancesV5', () => {
    it('counts the rows and does not copy fields the caller omitted', () => {
      const rows = [
        {
          accountId: 'eip155:1:0xabc',
          assetId: 'eip155:1/slip44:60',
          balance: '25',
        },
        {
          accountId: 'eip155:1:0xdef',
          assetId: 'eip155:1/slip44:60',
          balance: '1',
        },
      ];

      const response = buildMultiaccountBalancesV5(rows);

      expect(response.count).toBe(2);
      expect(response.unprocessedNetworks).toStrictEqual(
        API_RESPONSES['accounts-v5-multiaccount-balances'].unprocessedNetworks,
      );
      expect(response.balances[1]).toStrictEqual(rows[1]);
      expect(Object.keys(response.balances[0]).sort()).toStrictEqual(
        ['accountId', 'assetId', 'balance'].sort(),
      );
    });
  });

  describe('buildBridgeTxStatus', () => {
    it('merges chain overrides with the fixture chains', () => {
      const response = buildBridgeTxStatus({
        status: 'PENDING',
        srcChain: { chainId: 10 },
      });

      expect(response.status).toBe('PENDING');
      expect(response.srcChain).toStrictEqual({
        ...API_RESPONSES['bridge-get-tx-status'].srcChain,
        chainId: 10,
      });
      expect(response.destChain).toStrictEqual(
        API_RESPONSES['bridge-get-tx-status'].destChain,
      );
    });
  });

  describe('buildBridgeTokensSearch', () => {
    it('wraps the tokens in the search page envelope', () => {
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

  describe('buildBridgePopularToken', () => {
    it('fills the token from the fixture', () => {
      expect(buildBridgePopularToken({ symbol: 'DAI' }).symbol).toBe('DAI');
    });
  });

  describe('buildTokensV3Asset', () => {
    it('overrides the fields the caller sets', () => {
      expect(
        buildTokensV3Asset({ assetId: 'eip155:1/slip44:60', symbol: 'ETH' })
          .symbol,
      ).toBe('ETH');
    });
  });

  describe('buildTokenListToken', () => {
    it('overrides the token list entry', () => {
      expect(buildTokenListToken({ symbol: 'bar' }).symbol).toBe('bar');
    });
  });

  describe('buildAccountsSupportedNetworksV2', () => {
    it('overrides support lists', () => {
      expect(
        buildAccountsSupportedNetworksV2({
          fullSupport: [],
          partialSupport: [],
        }),
      ).toStrictEqual({ fullSupport: [], partialSupport: [] });
    });
  });

  describe('buildGasPrices', () => {
    it('returns the fixture when nothing is overridden', () => {
      expect(buildGasPrices()).toStrictEqual(API_RESPONSES['gas-prices']);
    });
  });

  describe('buildTxSentinelNetwork', () => {
    it('overrides the fields the caller sets', () => {
      expect(buildTxSentinelNetwork().network).toBe(
        API_RESPONSES['tx-sentinel-network'].network,
      );
      expect(buildTxSentinelNetwork({ sendBundle: false }).sendBundle).toBe(
        false,
      );
    });
  });

  describe('buildTxSentinelBatchStatus', () => {
    it('keys the status by the given UUID', () => {
      expect(buildTxSentinelBatchStatus('uuid-0')['uuid-0'].minedHash).toBe(
        API_RESPONSES['tx-sentinel-batch-status'][
          '0d506aaa-5e38-4cab-ad09-2039cb7a0f33'
        ].minedHash,
      );
      const response = buildTxSentinelBatchStatus('uuid-1', {
        minedTx: 'reverted',
      });

      expect(Object.keys(response)).toStrictEqual(['uuid-1']);
      expect(response['uuid-1'].minedTx).toBe('reverted');
    });
  });

  describe('buildFourByteSignatures', () => {
    it('returns one result with the given signature', () => {
      const response = buildFourByteSignatures({
        // eslint-disable-next-line @typescript-eslint/naming-convention
        text_signature: 'approve(address,uint256)',
      });

      expect(response.results).toHaveLength(1);
      expect(response.results[0].text_signature).toBe(
        'approve(address,uint256)',
      );
    });
  });
});
