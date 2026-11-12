import {
  API_RESPONSES,
  buildBridgeTokensSearch,
  buildBridgeTxStatus,
  buildExchangeRates,
  buildFourByteSignatures,
  buildMultiaccountBalancesV5,
  buildSpotPrice,
  buildTxSentinelBatchStatus,
} from '.';

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
        buildExchangeRates({ xyz: 1 } as Parameters<
          typeof buildExchangeRates
        >[0]),
      ).toThrow('No exchange rate fixture for "xyz"');
    });
  });

  describe('buildSpotPrice', () => {
    it('keeps the fixture fields the test does not override', () => {
      expect(buildSpotPrice({ price: 1700 })).toStrictEqual({
        ...API_RESPONSES['price-v3-spot-prices']['eip155:1/slip44:60'],
        price: 1700,
      });
    });
  });

  describe('buildMultiaccountBalancesV5', () => {
    it('counts the given rows', () => {
      const rows = [
        { accountId: 'eip155:1:0xabc', assetId: 'eip155:1/slip44:60' },
        { accountId: 'eip155:1:0xdef', assetId: 'eip155:1/slip44:60' },
      ];

      const response = buildMultiaccountBalancesV5(rows);

      expect(response.count).toBe(2);
      expect(response.balances[1]).toStrictEqual({
        ...API_RESPONSES['accounts-v5-multiaccount-balances'].balances[0],
        ...rows[1],
      });
    });
  });

  describe('buildBridgeTxStatus', () => {
    it('merges chain overrides with the fixture chains', () => {
      const response = buildBridgeTxStatus({ srcChain: { chainId: 10 } });

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

  describe('buildTxSentinelBatchStatus', () => {
    it('keys the status by the given UUID', () => {
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
