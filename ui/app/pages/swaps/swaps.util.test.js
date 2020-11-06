import { strict as assert } from 'assert'
import proxyquire from 'proxyquire'
import {
  TRADES_BASE_PROD_URL,
  TOKENS_BASE_PROD_URL,
  AGGREGATOR_METADATA_BASE_PROD_URL,
  TOP_ASSET_BASE_PROD_URL,
  TOKENS,
  MOCK_TRADE_RESPONSE_2,
  AGGREGATOR_METADATA,
  TOP_ASSETS,
} from './swaps-util-test-constants'

const swapsUtils = proxyquire('./swaps.util.js', {
  '../../helpers/utils/fetch-with-cache': {
    default: (url, fetchObject) => {
      assert.equal(fetchObject.method, 'GET')
      if (url.match(TRADES_BASE_PROD_URL)) {
        assert.equal(
          url,
          'https://api.metaswap.codefi.network/trades?destinationToken=0xE41d2489571d322189246DaFA5ebDe1F4699F498&sourceToken=0x617b3f8050a0BD94b6b1da02B4384eE5B4DF13F4&sourceAmount=2000000000000000000000000000000000000&slippage=3&timeout=10000&walletAddress=0xmockAddress',
        )
        return Promise.resolve(MOCK_TRADE_RESPONSE_2)
      }
      if (url.match(TOKENS_BASE_PROD_URL)) {
        assert.equal(url, TOKENS_BASE_PROD_URL)
        return Promise.resolve(TOKENS)
      }
      if (url.match(AGGREGATOR_METADATA_BASE_PROD_URL)) {
        assert.equal(url, AGGREGATOR_METADATA_BASE_PROD_URL)
        return Promise.resolve(AGGREGATOR_METADATA)
      }
      if (url.match(TOP_ASSET_BASE_PROD_URL)) {
        assert.equal(url, TOP_ASSET_BASE_PROD_URL)
        return Promise.resolve(TOP_ASSETS)
      }
      return Promise.resolve()
    },
  },
})
const {
  fetchTradesInfo,
  fetchTokens,
  fetchAggregatorMetadata,
  fetchTopAssets,
} = swapsUtils

describe('Swaps Util', function () {
  describe('fetchTradesInfo', function () {
    const expectedResult1 = {
      zeroEx: {
        trade: {
          // the ethereum transaction data for the swap
          data:
            '0xa6c3bf330000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000002386f26fc1000000000000000000000000000000000000000000000000000000000000000004e0000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000200000000000000000000000005591360f8c7640fea5771c9682d6b5ecb776e1f8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000021486a000000000000000000000000000000000000000000000000002386f26fc1000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005efe3c3b5dfc3a75ffc8add04bbdbac1e42fa234bf4549d8dab1bc44c8056eaf0e1dfe8600000000000000000000000000000000000000000000000000000000000001c000000000000000000000000000000000000000000000000000000000000003c00000000000000000000000000000000000000000000000000000000000000420000000000000000000000000000000000000000000000000000000000000042000000000000000000000000000000000000000000000000000000000000001c4dc1600f3000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb480000000000000000000000005591360f8c7640fea5771c9682d6b5ecb776e1f800000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000140000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc200000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000002000000000000000000000000036691c4f426eb8f42f150ebde43069a31cb080ad000000000000000000000000000000000000000000000000002386f26fc10000000000000000000000000000000000000000000000000000000000000021486a00000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000020000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000024f47261b0000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000010400000000000000000000000000000000000000000000000000000000000000869584cd0000000000000000000000001000000000000000000000000000000000000011000000000000000000000000000000000000000000000000000000005efe201b',
          from: '0x2369267687A84ac7B494daE2f1542C40E37f4455',
          value: '0x14401eab384000',
          to: '0x61935cbdd02287b511119ddb11aeb42f1593b7ef',
          gas: '0xa',
          gasPrice: undefined,
        },
        sourceAmount: '10000000000000000',
        destinationAmount: '2248687',
        error: null,
        sourceToken: TOKENS[0].address,
        destinationToken: TOKENS[1].address,
        fetchTime: 553,
        aggregator: 'zeroEx',
        aggType: 'AGG',
        approvalNeeded: {
          data:
            '0x095ea7b300000000000000000000000095e6f48254609a6ee006f7d493c8e5fb97094cef0000000000000000000000000000000000000000004a817c7ffffffdabf41c00',
          to: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
          value: '0x0',
          from: '0x2369267687A84ac7B494daE2f1542C40E37f4455',
          gas: '0x12',
          gasPrice: '0x34',
        },
        maxGas: 10,
        averageGas: 1,
        slippage: '3',
      },
    }
    const expectedResult2 = {
      zeroEx: {
        ...expectedResult1.zeroEx,
        sourceAmount: '20000000000000000',
      },
    }
    it('should fetch trade info on prod', async function () {
      const result = await fetchTradesInfo({
        TOKENS,
        slippage: '3',
        sourceToken: TOKENS[0].address,
        destinationToken: TOKENS[1].address,
        value: '2000000000000000000',
        fromAddress: '0xmockAddress',
        sourceSymbol: TOKENS[0].symbol,
        sourceDecimals: TOKENS[0].decimals,
        sourceTokenInfo: { ...TOKENS[0] },
        destinationTokenInfo: { ...TOKENS[1] },
      })
      assert.deepEqual(result, expectedResult2)
    })
  })

  describe('fetchTokens', function () {
    it('should fetch tokens', async function () {
      const result = await fetchTokens(true)
      assert.deepEqual(result, TOKENS)
    })

    it('should fetch tokens on prod', async function () {
      const result = await fetchTokens(false)
      assert.deepEqual(result, TOKENS)
    })
  })

  describe('fetchAggregatorMetadata', function () {
    it('should fetch aggregator metadata', async function () {
      const result = await fetchAggregatorMetadata(true)
      assert.deepEqual(result, AGGREGATOR_METADATA)
    })

    it('should fetch aggregator metadata on prod', async function () {
      const result = await fetchAggregatorMetadata(false)
      assert.deepEqual(result, AGGREGATOR_METADATA)
    })
  })

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
    }
    it('should fetch top assets', async function () {
      const result = await fetchTopAssets(true)
      assert.deepEqual(result, expectedResult)
    })

    it('should fetch top assets on prod', async function () {
      const result = await fetchTopAssets(false)
      assert.deepEqual(result, expectedResult)
    })
  })
})
