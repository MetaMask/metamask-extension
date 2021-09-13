import nock from 'nock';
import { MOCKS } from '../../../test/jest';
import {
  MAINNET_CHAIN_ID,
  BSC_CHAIN_ID,
  POLYGON_CHAIN_ID,
  LOCALHOST_CHAIN_ID,
  RINKEBY_CHAIN_ID,
  KOVAN_CHAIN_ID,
} from '../../../shared/constants/network';
import {
  SWAPS_CHAINID_CONTRACT_ADDRESS_MAP,
  SWAPS_CHAINID_DEFAULT_TOKEN_MAP,
  WETH_CONTRACT_ADDRESS,
  WBNB_CONTRACT_ADDRESS,
  WMATIC_CONTRACT_ADDRESS,
  ETHEREUM,
  POLYGON,
  BSC,
  RINKEBY,
} from '../../../shared/constants/swaps';
import {
  TOKENS,
  EXPECTED_TOKENS_RESULT,
  MOCK_TRADE_RESPONSE_2,
  AGGREGATOR_METADATA,
  TOP_ASSETS,
} from './swaps-util-test-constants';
import {
  fetchTradesInfo,
  fetchTokens,
  fetchAggregatorMetadata,
  fetchTopAssets,
  isContractAddressValid,
  getNetworkNameByChainId,
  getSwapsLivenessForNetwork,
  countDecimals,
  shouldEnableDirectWrapping,
} from './swaps.util';

jest.mock('../../helpers/utils/storage-helpers.js', () => ({
  getStorageItem: jest.fn(),
  setStorageItem: jest.fn(),
}));

describe('Swaps Util', () => {
  afterAll(() => {
    nock.cleanAll();
  });

  describe('fetchTradesInfo', () => {
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
        fee: 0.875,
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
    };
    const expectedResult2 = {
      zeroEx: {
        ...expectedResult1.zeroEx,
        sourceAmount: '20000000000000000',
      },
    };
    it('should fetch trade info on prod', async () => {
      nock('https://api.metaswap.codefi.network')
        .get('/trades')
        .query(true)
        .reply(200, MOCK_TRADE_RESPONSE_2);

      const result = await fetchTradesInfo(
        {
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
        },
        { chainId: MAINNET_CHAIN_ID },
      );
      expect(result).toStrictEqual(expectedResult2);
    });
  });

  describe('fetchTokens', () => {
    beforeAll(() => {
      nock('https://api.metaswap.codefi.network')
        .persist()
        .get('/tokens')
        .reply(200, TOKENS);
    });

    it('should fetch tokens', async () => {
      const result = await fetchTokens(MAINNET_CHAIN_ID);
      expect(result).toStrictEqual(EXPECTED_TOKENS_RESULT);
    });

    it('should fetch tokens on prod', async () => {
      const result = await fetchTokens(MAINNET_CHAIN_ID);
      expect(result).toStrictEqual(EXPECTED_TOKENS_RESULT);
    });
  });

  describe('fetchAggregatorMetadata', () => {
    beforeAll(() => {
      nock('https://api.metaswap.codefi.network')
        .persist()
        .get('/aggregatorMetadata')
        .reply(200, AGGREGATOR_METADATA);
    });

    it('should fetch aggregator metadata', async () => {
      const result = await fetchAggregatorMetadata(MAINNET_CHAIN_ID);
      expect(result).toStrictEqual(AGGREGATOR_METADATA);
    });

    it('should fetch aggregator metadata on prod', async () => {
      const result = await fetchAggregatorMetadata(MAINNET_CHAIN_ID);
      expect(result).toStrictEqual(AGGREGATOR_METADATA);
    });
  });

  describe('fetchTopAssets', () => {
    beforeAll(() => {
      nock('https://api.metaswap.codefi.network')
        .persist()
        .get('/topAssets')
        .reply(200, TOP_ASSETS);
    });

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
    it('should fetch top assets', async () => {
      const result = await fetchTopAssets(MAINNET_CHAIN_ID);
      expect(result).toStrictEqual(expectedResult);
    });

    it('should fetch top assets on prod', async () => {
      const result = await fetchTopAssets(MAINNET_CHAIN_ID);
      expect(result).toStrictEqual(expectedResult);
    });
  });

  describe('isContractAddressValid', () => {
    let usedTradeTxParams;

    beforeEach(() => {
      usedTradeTxParams = {
        data: 'testData',
        from: '0xe53a5bc256898bfa5673b20aceeb2b2152075d17',
        gas: '2427c',
        gasPrice: '27592f5a00',
        to: WETH_CONTRACT_ADDRESS,
        value: '0xde0b6b3a7640000',
      };
    });

    it('returns true if "to" is WETH contract address', () => {
      expect(
        isContractAddressValid(usedTradeTxParams.to, MAINNET_CHAIN_ID),
      ).toBe(true);
    });

    it('returns true if "to" is WETH contract address with some uppercase chars', () => {
      usedTradeTxParams.to = '0xc02AAA39B223fe8d0a0e5c4f27ead9083c756cc2';
      expect(
        isContractAddressValid(usedTradeTxParams.to, MAINNET_CHAIN_ID),
      ).toBe(true);
    });

    it('returns true if "to" is ETH mainnet contract address on ETH mainnet', () => {
      usedTradeTxParams.to =
        SWAPS_CHAINID_CONTRACT_ADDRESS_MAP[MAINNET_CHAIN_ID];
      expect(
        isContractAddressValid(usedTradeTxParams.to, MAINNET_CHAIN_ID),
      ).toBe(true);
    });

    it('returns true if "to" is WBNB contract address on BSC mainnet', () => {
      usedTradeTxParams.to = WBNB_CONTRACT_ADDRESS;
      expect(isContractAddressValid(usedTradeTxParams.to, BSC_CHAIN_ID)).toBe(
        true,
      );
    });

    it('returns true if "to" is WMATIC contract address on Polygon mainnet', () => {
      usedTradeTxParams.to = WMATIC_CONTRACT_ADDRESS;
      expect(
        isContractAddressValid(usedTradeTxParams.to, POLYGON_CHAIN_ID),
      ).toBe(true);
    });

    it('returns false if "to" is BSC contract address on ETH mainnet', () => {
      usedTradeTxParams.to = SWAPS_CHAINID_CONTRACT_ADDRESS_MAP[BSC_CHAIN_ID];
      expect(
        isContractAddressValid(usedTradeTxParams.to, MAINNET_CHAIN_ID),
      ).toBe(false);
    });

    it('returns false if contractAddress is null', () => {
      expect(isContractAddressValid(null, LOCALHOST_CHAIN_ID)).toBe(false);
    });

    it('returns false if chainId is incorrect', () => {
      expect(
        isContractAddressValid(usedTradeTxParams.to, 'incorrectChainId'),
      ).toBe(false);
    });

    it('returns true if "to" is BSC contract address on BSC network', () => {
      usedTradeTxParams.to = SWAPS_CHAINID_CONTRACT_ADDRESS_MAP[BSC_CHAIN_ID];
      expect(isContractAddressValid(usedTradeTxParams.to, BSC_CHAIN_ID)).toBe(
        true,
      );
    });

    it('returns true if "to" is Polygon contract address on Polygon network', () => {
      usedTradeTxParams.to =
        SWAPS_CHAINID_CONTRACT_ADDRESS_MAP[POLYGON_CHAIN_ID];
      expect(
        isContractAddressValid(usedTradeTxParams.to, POLYGON_CHAIN_ID),
      ).toBe(true);
    });

    it('returns true if "to" is Rinkeby contract address on Rinkeby network', () => {
      usedTradeTxParams.to =
        SWAPS_CHAINID_CONTRACT_ADDRESS_MAP[RINKEBY_CHAIN_ID];
      expect(
        isContractAddressValid(usedTradeTxParams.to, RINKEBY_CHAIN_ID),
      ).toBe(true);
    });

    it('returns true if "to" is testnet contract address', () => {
      usedTradeTxParams.to =
        SWAPS_CHAINID_CONTRACT_ADDRESS_MAP[LOCALHOST_CHAIN_ID];
      expect(
        isContractAddressValid(usedTradeTxParams.to, LOCALHOST_CHAIN_ID),
      ).toBe(true);
    });

    it('returns true if "to" is testnet contract address with some uppercase chars', () => {
      usedTradeTxParams.to = '0x881D40237659C251811CEC9c364ef91dC08D300C';
      expect(
        isContractAddressValid(usedTradeTxParams.to, LOCALHOST_CHAIN_ID),
      ).toBe(true);
    });

    it('returns false if "to" has mismatch with current chainId', () => {
      usedTradeTxParams.to = SWAPS_CHAINID_CONTRACT_ADDRESS_MAP[BSC_CHAIN_ID];
      expect(
        isContractAddressValid(usedTradeTxParams.to, LOCALHOST_CHAIN_ID),
      ).toBe(false);
    });
  });

  describe('getNetworkNameByChainId', () => {
    it('returns "ethereum" for mainnet chain ID', () => {
      expect(getNetworkNameByChainId(MAINNET_CHAIN_ID)).toBe(ETHEREUM);
    });

    it('returns "bsc" for mainnet chain ID', () => {
      expect(getNetworkNameByChainId(BSC_CHAIN_ID)).toBe(BSC);
    });

    it('returns "polygon" for mainnet chain ID', () => {
      expect(getNetworkNameByChainId(POLYGON_CHAIN_ID)).toBe(POLYGON);
    });

    it('returns "rinkeby" for Rinkeby chain ID', () => {
      expect(getNetworkNameByChainId(RINKEBY_CHAIN_ID)).toBe(RINKEBY);
    });

    it('returns an empty string for an unsupported network', () => {
      expect(getNetworkNameByChainId(KOVAN_CHAIN_ID)).toBe('');
    });
  });

  describe('getSwapsLivenessForNetwork', () => {
    it('returns info that Swaps are enabled and cannot use API v2 for localhost chain ID', () => {
      const expectedSwapsLiveness = {
        swapsFeatureIsLive: true,
        useNewSwapsApi: false,
      };
      expect(
        getSwapsLivenessForNetwork(
          MOCKS.createFeatureFlagsResponse(),
          LOCALHOST_CHAIN_ID,
        ),
      ).toMatchObject(expectedSwapsLiveness);
    });

    it('returns info that Swaps are enabled and cannot use API v2 for Rinkeby chain ID', () => {
      const expectedSwapsLiveness = {
        swapsFeatureIsLive: true,
        useNewSwapsApi: false,
      };
      expect(
        getSwapsLivenessForNetwork(
          MOCKS.createFeatureFlagsResponse(),
          RINKEBY_CHAIN_ID,
        ),
      ).toMatchObject(expectedSwapsLiveness);
    });

    it('returns info that Swaps are disabled and cannot use API v2 if network name is not found', () => {
      const expectedSwapsLiveness = {
        swapsFeatureIsLive: false,
        useNewSwapsApi: false,
      };
      expect(
        getSwapsLivenessForNetwork(
          MOCKS.createFeatureFlagsResponse(),
          KOVAN_CHAIN_ID,
        ),
      ).toMatchObject(expectedSwapsLiveness);
    });

    it('returns info that Swaps are enabled and can use API v2 for mainnet chain ID', () => {
      const expectedSwapsLiveness = {
        swapsFeatureIsLive: true,
        useNewSwapsApi: true,
      };
      expect(
        getSwapsLivenessForNetwork(
          MOCKS.createFeatureFlagsResponse(),
          MAINNET_CHAIN_ID,
        ),
      ).toMatchObject(expectedSwapsLiveness);
    });

    it('returns info that Swaps are enabled but can only use API v1 for mainnet chain ID', () => {
      const expectedSwapsLiveness = {
        swapsFeatureIsLive: true,
        useNewSwapsApi: false,
      };
      const swapsFeatureFlags = MOCKS.createFeatureFlagsResponse();
      swapsFeatureFlags[ETHEREUM].extension_active = false;
      expect(
        getSwapsLivenessForNetwork(swapsFeatureFlags, MAINNET_CHAIN_ID),
      ).toMatchObject(expectedSwapsLiveness);
    });
  });

  describe('countDecimals', () => {
    it('returns 0 decimals for an undefined value', () => {
      expect(countDecimals()).toBe(0);
    });

    it('returns 0 decimals for number: 1', () => {
      expect(countDecimals(1)).toBe(0);
    });

    it('returns 1 decimals for number: 1.1', () => {
      expect(countDecimals(1.1)).toBe(1);
    });

    it('returns 3 decimals for number: 1.123', () => {
      expect(countDecimals(1.123)).toBe(3);
    });

    it('returns 9 decimals for number: 1.123456789', () => {
      expect(countDecimals(1.123456789)).toBe(9);
    });
  });

  describe('shouldEnableDirectWrapping', () => {
    const randomTokenAddress = '0x881d40237659c251811cec9c364ef91234567890';

    it('returns true if swapping from ETH to WETH', () => {
      expect(
        shouldEnableDirectWrapping(
          MAINNET_CHAIN_ID,
          SWAPS_CHAINID_DEFAULT_TOKEN_MAP[MAINNET_CHAIN_ID]?.address,
          WETH_CONTRACT_ADDRESS,
        ),
      ).toBe(true);
    });

    it('returns true if swapping from WETH to ETH', () => {
      expect(
        shouldEnableDirectWrapping(
          MAINNET_CHAIN_ID,
          WETH_CONTRACT_ADDRESS,
          SWAPS_CHAINID_DEFAULT_TOKEN_MAP[MAINNET_CHAIN_ID]?.address,
        ),
      ).toBe(true);
    });

    it('returns false if swapping from ETH to a non-WETH token', () => {
      expect(
        shouldEnableDirectWrapping(
          MAINNET_CHAIN_ID,
          SWAPS_CHAINID_DEFAULT_TOKEN_MAP[MAINNET_CHAIN_ID]?.address,
          randomTokenAddress,
        ),
      ).toBe(false);
    });

    it('returns true if swapping from BNB to WBNB', () => {
      expect(
        shouldEnableDirectWrapping(
          BSC_CHAIN_ID,
          SWAPS_CHAINID_DEFAULT_TOKEN_MAP[BSC_CHAIN_ID]?.address,
          WBNB_CONTRACT_ADDRESS,
        ),
      ).toBe(true);
    });

    it('returns true if swapping from WBNB to BNB', () => {
      expect(
        shouldEnableDirectWrapping(
          BSC_CHAIN_ID,
          WBNB_CONTRACT_ADDRESS,
          SWAPS_CHAINID_DEFAULT_TOKEN_MAP[BSC_CHAIN_ID]?.address,
        ),
      ).toBe(true);
    });

    it('returns false if swapping from BNB to a non-WBNB token', () => {
      expect(
        shouldEnableDirectWrapping(
          BSC_CHAIN_ID,
          SWAPS_CHAINID_DEFAULT_TOKEN_MAP[BSC_CHAIN_ID]?.address,
          randomTokenAddress,
        ),
      ).toBe(false);
    });

    it('returns true if swapping from MATIC to WMATIC', () => {
      expect(
        shouldEnableDirectWrapping(
          POLYGON_CHAIN_ID,
          SWAPS_CHAINID_DEFAULT_TOKEN_MAP[POLYGON_CHAIN_ID]?.address,
          WMATIC_CONTRACT_ADDRESS,
        ),
      ).toBe(true);
    });

    it('returns true if swapping from WMATIC to MATIC', () => {
      expect(
        shouldEnableDirectWrapping(
          POLYGON_CHAIN_ID,
          WMATIC_CONTRACT_ADDRESS,
          SWAPS_CHAINID_DEFAULT_TOKEN_MAP[POLYGON_CHAIN_ID]?.address,
        ),
      ).toBe(true);
    });

    it('returns false if swapping from MATIC to a non-WMATIC token', () => {
      expect(
        shouldEnableDirectWrapping(
          POLYGON_CHAIN_ID,
          SWAPS_CHAINID_DEFAULT_TOKEN_MAP[POLYGON_CHAIN_ID]?.address,
          randomTokenAddress,
        ),
      ).toBe(false);
    });

    it('returns false if a source token is undefined', () => {
      expect(
        shouldEnableDirectWrapping(
          MAINNET_CHAIN_ID,
          undefined,
          WETH_CONTRACT_ADDRESS,
        ),
      ).toBe(false);
    });

    it('returns false if a destination token is undefined', () => {
      expect(
        shouldEnableDirectWrapping(MAINNET_CHAIN_ID, WETH_CONTRACT_ADDRESS),
      ).toBe(false);
    });
  });
});
