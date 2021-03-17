import { strict as assert } from 'assert';
import proxyquire from 'proxyquire';
import { MAINNET_CHAIN_ID } from '../../../../shared/constants/network';
import {
  TRADES_BASE_PROD_URL,
  TOKENS_BASE_PROD_URL,
  AGGREGATOR_METADATA_BASE_PROD_URL,
  TOP_ASSET_BASE_PROD_URL,
  TOKENS,
  EXPECTED_TOKENS_RESULT,
  MOCK_TRADE_RESPONSE_2,
  AGGREGATOR_METADATA,
  TOP_ASSETS,
} from './swaps-util-test-constants';

const swapsUtils = proxyquire('./swaps.util.js', {
  '../../helpers/utils/fetch-with-cache': {
    default: (url, fetchObject) => {
      assert.strictEqual(fetchObject.method, 'GET');
      if (url.match(TRADES_BASE_PROD_URL)) {
        assert.strictEqual(
          url,
          'https://api.metaswap.codefi.network/trades?destinationToken=0xE41d2489571d322189246DaFA5ebDe1F4699F498&sourceToken=0x617b3f8050a0BD94b6b1da02B4384eE5B4DF13F4&sourceAmount=2000000000000000000000000000000000000&slippage=3&timeout=10000&walletAddress=0xmockAddress',
        );
        return Promise.resolve(MOCK_TRADE_RESPONSE_2);
      }
      if (url.match(TOKENS_BASE_PROD_URL)) {
        assert.strictEqual(url, TOKENS_BASE_PROD_URL);
        return Promise.resolve(TOKENS);
      }
      if (url.match(AGGREGATOR_METADATA_BASE_PROD_URL)) {
        assert.strictEqual(url, AGGREGATOR_METADATA_BASE_PROD_URL);
        return Promise.resolve(AGGREGATOR_METADATA);
      }
      if (url.match(TOP_ASSET_BASE_PROD_URL)) {
        assert.strictEqual(url, TOP_ASSET_BASE_PROD_URL);
        return Promise.resolve(TOP_ASSETS);
      }
      return Promise.resolve();
    },
  },
});
const { fetchTokens, fetchAggregatorMetadata, fetchTopAssets } = swapsUtils;

describe('Swaps Util', function () {
  describe('fetchTokens', function () {
    it('should fetch tokens', async function () {
      const result = await fetchTokens(MAINNET_CHAIN_ID);
      assert.deepStrictEqual(result, EXPECTED_TOKENS_RESULT);
    });

    it('should fetch tokens on prod', async function () {
      const result = await fetchTokens(MAINNET_CHAIN_ID);
      assert.deepStrictEqual(result, EXPECTED_TOKENS_RESULT);
    });
  });

  describe('fetchAggregatorMetadata', function () {
    it('should fetch aggregator metadata', async function () {
      const result = await fetchAggregatorMetadata(MAINNET_CHAIN_ID);
      assert.deepStrictEqual(result, AGGREGATOR_METADATA);
    });

    it('should fetch aggregator metadata on prod', async function () {
      const result = await fetchAggregatorMetadata(MAINNET_CHAIN_ID);
      assert.deepStrictEqual(result, AGGREGATOR_METADATA);
    });
  });

  describe('fetchTopAssets', function () {
    const expectedResult = {
      '0x514910771af9ca656af840dff83e8264ecf986ca': {
        index: '0',
      },
      '0x04fa0d235c4abf4bcf4787af4cf447de572ef828': {
        index: '1',
      },
      '0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e': {
        index: '2',
      },
      '0x80fb784b7ed66730e8b1dbd9820afd29931aab03': {
        index: '3',
      },
      '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f': {
        index: '4',
      },
    };
    it('should fetch top assets', async function () {
      const result = await fetchTopAssets(MAINNET_CHAIN_ID);
      assert.deepStrictEqual(result, expectedResult);
    });

    it('should fetch top assets on prod', async function () {
      const result = await fetchTopAssets(MAINNET_CHAIN_ID);
      assert.deepStrictEqual(result, expectedResult);
    });
  });
});
