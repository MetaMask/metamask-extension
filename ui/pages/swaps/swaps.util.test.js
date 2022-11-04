import nock from 'nock';
import { MOCKS } from '../../../test/jest';
import { CHAIN_IDS, CURRENCY_SYMBOLS } from '../../../shared/constants/network';
import { getSwapsTokensReceivedFromTxMeta } from '../../../shared/lib/transactions-controller-utils';
import {
  SWAPS_CHAINID_CONTRACT_ADDRESS_MAP,
  SWAPS_CHAINID_DEFAULT_TOKEN_MAP,
  WETH_CONTRACT_ADDRESS,
  WBNB_CONTRACT_ADDRESS,
  WMATIC_CONTRACT_ADDRESS,
  ETHEREUM,
  POLYGON,
  BSC,
  GOERLI,
  AVALANCHE,
} from '../../../shared/constants/swaps';
import {
  fetchTradesInfo,
  shouldEnableDirectWrapping,
} from '../../../shared/lib/swaps-utils';
import {
  TOKENS,
  EXPECTED_TOKENS_RESULT,
  MOCK_TRADE_RESPONSE_2,
  AGGREGATOR_METADATA,
  TOP_ASSETS,
} from './swaps-util-test-constants';
import {
  fetchTokens,
  fetchAggregatorMetadata,
  fetchTopAssets,
  isContractAddressValid,
  getNetworkNameByChainId,
  getSwapsLivenessForNetwork,
  countDecimals,
  showRemainingTimeInMinAndSec,
  getFeeForSmartTransaction,
  formatSwapsValueForDisplay,
} from './swaps.util';

jest.mock('../../../shared/lib/storage-helpers', () => ({
  getStorageItem: jest.fn(),
  setStorageItem: jest.fn(),
}));

describe('Swaps Util', () => {
  afterEach(() => {
    nock.cleanAll();
  });

  describe('fetchTradesInfo', () => {
    const expectedResult1 = {
      zeroEx: {
        trade: {
          // the ethereum transaction data for the swap
          data: '0xa6c3bf330000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000002386f26fc1000000000000000000000000000000000000000000000000000000000000000004e0000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000200000000000000000000000005591360f8c7640fea5771c9682d6b5ecb776e1f8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000021486a000000000000000000000000000000000000000000000000002386f26fc1000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005efe3c3b5dfc3a75ffc8add04bbdbac1e42fa234bf4549d8dab1bc44c8056eaf0e1dfe8600000000000000000000000000000000000000000000000000000000000001c000000000000000000000000000000000000000000000000000000000000003c00000000000000000000000000000000000000000000000000000000000000420000000000000000000000000000000000000000000000000000000000000042000000000000000000000000000000000000000000000000000000000000001c4dc1600f3000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb480000000000000000000000005591360f8c7640fea5771c9682d6b5ecb776e1f800000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000140000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc200000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000002000000000000000000000000036691c4f426eb8f42f150ebde43069a31cb080ad000000000000000000000000000000000000000000000000002386f26fc10000000000000000000000000000000000000000000000000000000000000021486a00000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000020000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000024f47261b0000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000010400000000000000000000000000000000000000000000000000000000000000869584cd0000000000000000000000001000000000000000000000000000000000000011000000000000000000000000000000000000000000000000000000005efe201b',
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
          data: '0x095ea7b300000000000000000000000095e6f48254609a6ee006f7d493c8e5fb97094cef0000000000000000000000000000000000000000004a817c7ffffffdabf41c00',
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
      nock('https://swap.metaswap.codefi.network')
        .get('/networks/1/trades')
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
        { chainId: CHAIN_IDS.MAINNET },
      );
      expect(result).toStrictEqual(expectedResult2);
    });
  });

  describe('fetchTokens', () => {
    beforeEach(() => {
      nock('https://swap.metaswap.codefi.network')
        .persist()
        .get('/networks/1/tokens')
        .reply(200, TOKENS);
    });

    it('should fetch tokens', async () => {
      const result = await fetchTokens(CHAIN_IDS.MAINNET);
      expect(result).toStrictEqual(EXPECTED_TOKENS_RESULT);
    });

    it('should fetch tokens on prod', async () => {
      const result = await fetchTokens(CHAIN_IDS.MAINNET);
      expect(result).toStrictEqual(EXPECTED_TOKENS_RESULT);
    });
  });

  describe('fetchAggregatorMetadata', () => {
    beforeEach(() => {
      nock('https://swap.metaswap.codefi.network')
        .persist()
        .get('/networks/1/aggregatorMetadata')
        .reply(200, AGGREGATOR_METADATA);
    });

    it('should fetch aggregator metadata', async () => {
      const result = await fetchAggregatorMetadata(CHAIN_IDS.MAINNET);
      expect(result).toStrictEqual(AGGREGATOR_METADATA);
    });

    it('should fetch aggregator metadata on prod', async () => {
      const result = await fetchAggregatorMetadata(CHAIN_IDS.MAINNET);
      expect(result).toStrictEqual(AGGREGATOR_METADATA);
    });
  });

  describe('fetchTopAssets', () => {
    beforeEach(() => {
      nock('https://swap.metaswap.codefi.network')
        .persist()
        .get('/networks/1/topAssets')
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
      const result = await fetchTopAssets(CHAIN_IDS.MAINNET);
      expect(result).toStrictEqual(expectedResult);
    });

    it('should fetch top assets on prod', async () => {
      const result = await fetchTopAssets(CHAIN_IDS.MAINNET);
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
        isContractAddressValid(usedTradeTxParams.to, CHAIN_IDS.MAINNET),
      ).toBe(true);
    });

    it('returns true if "to" is WETH contract address with some uppercase chars', () => {
      usedTradeTxParams.to = '0xc02AAA39B223fe8d0a0e5c4f27ead9083c756cc2';
      expect(
        isContractAddressValid(usedTradeTxParams.to, CHAIN_IDS.MAINNET),
      ).toBe(true);
    });

    it('returns true if "to" is ETH mainnet contract address on ETH mainnet', () => {
      usedTradeTxParams.to =
        SWAPS_CHAINID_CONTRACT_ADDRESS_MAP[CHAIN_IDS.MAINNET];
      expect(
        isContractAddressValid(usedTradeTxParams.to, CHAIN_IDS.MAINNET),
      ).toBe(true);
    });

    it('returns true if "to" is WBNB contract address on BSC mainnet', () => {
      usedTradeTxParams.to = WBNB_CONTRACT_ADDRESS;
      expect(isContractAddressValid(usedTradeTxParams.to, CHAIN_IDS.BSC)).toBe(
        true,
      );
    });

    it('returns true if "to" is WMATIC contract address on Polygon mainnet', () => {
      usedTradeTxParams.to = WMATIC_CONTRACT_ADDRESS;
      expect(
        isContractAddressValid(usedTradeTxParams.to, CHAIN_IDS.POLYGON),
      ).toBe(true);
    });

    it('returns false if "to" is BSC contract address on ETH mainnet', () => {
      usedTradeTxParams.to = SWAPS_CHAINID_CONTRACT_ADDRESS_MAP[CHAIN_IDS.BSC];
      expect(
        isContractAddressValid(usedTradeTxParams.to, CHAIN_IDS.MAINNET),
      ).toBe(false);
    });

    it('returns false if contractAddress is null', () => {
      expect(isContractAddressValid(null, CHAIN_IDS.LOCALHOST)).toBe(false);
    });

    it('returns false if chainId is incorrect', () => {
      expect(
        isContractAddressValid(usedTradeTxParams.to, 'incorrectChainId'),
      ).toBe(false);
    });

    it('returns true if "to" is BSC contract address on BSC network', () => {
      usedTradeTxParams.to = SWAPS_CHAINID_CONTRACT_ADDRESS_MAP[CHAIN_IDS.BSC];
      expect(isContractAddressValid(usedTradeTxParams.to, CHAIN_IDS.BSC)).toBe(
        true,
      );
    });

    it('returns true if "to" is Polygon contract address on Polygon network', () => {
      usedTradeTxParams.to =
        SWAPS_CHAINID_CONTRACT_ADDRESS_MAP[CHAIN_IDS.POLYGON];
      expect(
        isContractAddressValid(usedTradeTxParams.to, CHAIN_IDS.POLYGON),
      ).toBe(true);
    });

    it('returns true if "to" is Goerli contract address on Goerli network', () => {
      usedTradeTxParams.to =
        SWAPS_CHAINID_CONTRACT_ADDRESS_MAP[CHAIN_IDS.GOERLI];
      expect(
        isContractAddressValid(usedTradeTxParams.to, CHAIN_IDS.GOERLI),
      ).toBe(true);
    });

    it('returns true if "to" is testnet contract address', () => {
      usedTradeTxParams.to =
        SWAPS_CHAINID_CONTRACT_ADDRESS_MAP[CHAIN_IDS.LOCALHOST];
      expect(
        isContractAddressValid(usedTradeTxParams.to, CHAIN_IDS.LOCALHOST),
      ).toBe(true);
    });

    it('returns true if "to" is testnet contract address with some uppercase chars', () => {
      usedTradeTxParams.to = '0x881D40237659C251811CEC9c364ef91dC08D300C';
      expect(
        isContractAddressValid(usedTradeTxParams.to, CHAIN_IDS.LOCALHOST),
      ).toBe(true);
    });

    it('returns false if "to" has mismatch with current chainId', () => {
      usedTradeTxParams.to = SWAPS_CHAINID_CONTRACT_ADDRESS_MAP[CHAIN_IDS.BSC];
      expect(
        isContractAddressValid(usedTradeTxParams.to, CHAIN_IDS.LOCALHOST),
      ).toBe(false);
    });
  });

  describe('getNetworkNameByChainId', () => {
    it('returns "ethereum" for mainnet chain ID', () => {
      expect(getNetworkNameByChainId(CHAIN_IDS.MAINNET)).toBe(ETHEREUM);
    });

    it('returns "bsc" for mainnet chain ID', () => {
      expect(getNetworkNameByChainId(CHAIN_IDS.BSC)).toBe(BSC);
    });

    it('returns "polygon" for mainnet chain ID', () => {
      expect(getNetworkNameByChainId(CHAIN_IDS.POLYGON)).toBe(POLYGON);
    });

    it('returns "goerli" for Goerli chain ID', () => {
      expect(getNetworkNameByChainId(CHAIN_IDS.GOERLI)).toBe(GOERLI);
    });

    it('returns "avalanche" for Avalanche chain ID', () => {
      expect(getNetworkNameByChainId(CHAIN_IDS.AVALANCHE)).toBe(AVALANCHE);
    });
  });

  describe('getSwapsLivenessForNetwork', () => {
    it('returns info that Swaps are enabled and cannot use API v2 for localhost chain ID', () => {
      const expectedSwapsLiveness = {
        swapsFeatureIsLive: true,
      };
      expect(
        getSwapsLivenessForNetwork(
          MOCKS.createFeatureFlagsResponse(),
          CHAIN_IDS.LOCALHOST,
        ),
      ).toMatchObject(expectedSwapsLiveness);
    });

    it('returns info that Swaps are enabled and cannot use API v2 for Goerli chain ID', () => {
      const expectedSwapsLiveness = {
        swapsFeatureIsLive: true,
      };
      expect(
        getSwapsLivenessForNetwork(
          MOCKS.createFeatureFlagsResponse(),
          CHAIN_IDS.GOERLI,
        ),
      ).toMatchObject(expectedSwapsLiveness);
    });

    it('returns info that Swaps are disabled and cannot use API v2 if network name is not found', () => {
      const expectedSwapsLiveness = {
        swapsFeatureIsLive: false,
      };
      expect(
        getSwapsLivenessForNetwork(
          MOCKS.createFeatureFlagsResponse(),
          CHAIN_IDS.SEPOLIA,
        ),
      ).toMatchObject(expectedSwapsLiveness);
    });

    it('returns info that Swaps are enabled and can use API v2 for mainnet chain ID', () => {
      const expectedSwapsLiveness = {
        swapsFeatureIsLive: true,
      };
      expect(
        getSwapsLivenessForNetwork(
          MOCKS.createFeatureFlagsResponse(),
          CHAIN_IDS.MAINNET,
        ),
      ).toMatchObject(expectedSwapsLiveness);
    });

    it('returns info that Swaps are enabled but can only use API v1 for mainnet chain ID', () => {
      const expectedSwapsLiveness = {
        swapsFeatureIsLive: true,
      };
      const swapsFeatureFlags = MOCKS.createFeatureFlagsResponse();
      swapsFeatureFlags[ETHEREUM].extensionActive = false;
      expect(
        getSwapsLivenessForNetwork(swapsFeatureFlags, CHAIN_IDS.MAINNET),
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
          CHAIN_IDS.MAINNET,
          SWAPS_CHAINID_DEFAULT_TOKEN_MAP[CHAIN_IDS.MAINNET]?.address,
          WETH_CONTRACT_ADDRESS,
        ),
      ).toBe(true);
    });

    it('returns true if swapping from ETH with uppercase chars to WETH', () => {
      const ethAddressWithUpperCaseChars =
        '0X0000000000000000000000000000000000000000';
      expect(
        shouldEnableDirectWrapping(
          CHAIN_IDS.MAINNET,
          ethAddressWithUpperCaseChars,
          WETH_CONTRACT_ADDRESS,
        ),
      ).toBe(true);
    });

    it('returns true if swapping from WETH to ETH', () => {
      expect(
        shouldEnableDirectWrapping(
          CHAIN_IDS.MAINNET,
          WETH_CONTRACT_ADDRESS,
          SWAPS_CHAINID_DEFAULT_TOKEN_MAP[CHAIN_IDS.MAINNET]?.address,
        ),
      ).toBe(true);
    });

    it('returns true if swapping from WETH with uppercase chars to ETH', () => {
      const wethContractAddressWithUpperCaseChars =
        '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
      expect(
        shouldEnableDirectWrapping(
          CHAIN_IDS.MAINNET,
          wethContractAddressWithUpperCaseChars,
          SWAPS_CHAINID_DEFAULT_TOKEN_MAP[CHAIN_IDS.MAINNET]?.address,
        ),
      ).toBe(true);
    });

    it('returns false if swapping from ETH to a non-WETH token', () => {
      expect(
        shouldEnableDirectWrapping(
          CHAIN_IDS.MAINNET,
          SWAPS_CHAINID_DEFAULT_TOKEN_MAP[CHAIN_IDS.MAINNET]?.address,
          randomTokenAddress,
        ),
      ).toBe(false);
    });

    it('returns true if swapping from BNB to WBNB', () => {
      expect(
        shouldEnableDirectWrapping(
          CHAIN_IDS.BSC,
          SWAPS_CHAINID_DEFAULT_TOKEN_MAP[CHAIN_IDS.BSC]?.address,
          WBNB_CONTRACT_ADDRESS,
        ),
      ).toBe(true);
    });

    it('returns true if swapping from WBNB to BNB', () => {
      expect(
        shouldEnableDirectWrapping(
          CHAIN_IDS.BSC,
          WBNB_CONTRACT_ADDRESS,
          SWAPS_CHAINID_DEFAULT_TOKEN_MAP[CHAIN_IDS.BSC]?.address,
        ),
      ).toBe(true);
    });

    it('returns false if swapping from BNB to a non-WBNB token', () => {
      expect(
        shouldEnableDirectWrapping(
          CHAIN_IDS.BSC,
          SWAPS_CHAINID_DEFAULT_TOKEN_MAP[CHAIN_IDS.BSC]?.address,
          randomTokenAddress,
        ),
      ).toBe(false);
    });

    it('returns true if swapping from MATIC to WMATIC', () => {
      expect(
        shouldEnableDirectWrapping(
          CHAIN_IDS.POLYGON,
          SWAPS_CHAINID_DEFAULT_TOKEN_MAP[CHAIN_IDS.POLYGON]?.address,
          WMATIC_CONTRACT_ADDRESS,
        ),
      ).toBe(true);
    });

    it('returns true if swapping from WMATIC to MATIC', () => {
      expect(
        shouldEnableDirectWrapping(
          CHAIN_IDS.POLYGON,
          WMATIC_CONTRACT_ADDRESS,
          SWAPS_CHAINID_DEFAULT_TOKEN_MAP[CHAIN_IDS.POLYGON]?.address,
        ),
      ).toBe(true);
    });

    it('returns false if swapping from MATIC to a non-WMATIC token', () => {
      expect(
        shouldEnableDirectWrapping(
          CHAIN_IDS.POLYGON,
          SWAPS_CHAINID_DEFAULT_TOKEN_MAP[CHAIN_IDS.POLYGON]?.address,
          randomTokenAddress,
        ),
      ).toBe(false);
    });

    it('returns false if a source token is undefined', () => {
      expect(
        shouldEnableDirectWrapping(
          CHAIN_IDS.MAINNET,
          undefined,
          WETH_CONTRACT_ADDRESS,
        ),
      ).toBe(false);
    });

    it('returns false if a destination token is undefined', () => {
      expect(
        shouldEnableDirectWrapping(CHAIN_IDS.MAINNET, WETH_CONTRACT_ADDRESS),
      ).toBe(false);
    });

    it('returns false if source and destination tokens are undefined', () => {
      expect(shouldEnableDirectWrapping(CHAIN_IDS.MAINNET)).toBe(false);
    });
  });

  describe('showRemainingTimeInMinAndSec', () => {
    it('returns 0:00 if we do not pass an integer', () => {
      expect(showRemainingTimeInMinAndSec('5')).toBe('0:00');
    });

    it('returns 0:05 if 5 seconds are remaining', () => {
      expect(showRemainingTimeInMinAndSec(5)).toBe('0:05');
    });

    it('returns 2:59', () => {
      expect(showRemainingTimeInMinAndSec(179)).toBe('2:59');
    });
  });

  describe('getFeeForSmartTransaction', () => {
    it('returns estimated fee for STX', () => {
      const expected = {
        feeInUsd: '0.02',
        feeInFiat: '$0.02',
        feeInEth: '0.00323 ETH',
        rawEthFee: '0.00323',
      };
      const actual = getFeeForSmartTransaction({
        chainId: CHAIN_IDS.MAINNET,
        currentCurrency: 'usd',
        conversionRate: 5,
        USDConversionRate: 5,
        nativeCurrencySymbol: 'ETH',
        feeInWeiDec: 3225623412028924,
      });
      expect(actual).toMatchObject(expected);
    });

    it('returns estimated fee for STX for JPY currency', () => {
      const expected = {
        feeInUsd: '0.02',
        feeInFiat: '£0.02',
        feeInEth: '0.00323 ETH',
        rawEthFee: '0.00323',
      };
      const actual = getFeeForSmartTransaction({
        chainId: CHAIN_IDS.MAINNET,
        currentCurrency: 'gbp',
        conversionRate: 5,
        USDConversionRate: 5,
        nativeCurrencySymbol: 'ETH',
        feeInWeiDec: 3225623412028924,
      });
      expect(actual).toMatchObject(expected);
    });
  });

  describe('formatSwapsValueForDisplay', () => {
    it('gets swaps value for display', () => {
      expect(formatSwapsValueForDisplay('39.6493201125465000000')).toBe(
        '39.6493201125',
      );
    });
  });

  describe('getSwapsTokensReceivedFromTxMeta', () => {
    const createProps = () => {
      return {
        tokenSymbol: CURRENCY_SYMBOLS.ETH,
        txMeta: {
          swapMetaData: {
            token_to_amount: 5,
          },
          txReceipt: {
            status: '0x0',
          },
          preTxBalance: '8b11',
          postTxBalance: '8b11',
        },
        tokenAddress: '0x881d40237659c251811cec9c364ef91234567890',
        accountAddress: '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f',
        tokenDecimals: 6,
        approvalTxMeta: null,
        chainId: CHAIN_IDS.MAINNET,
      };
    };

    it('returns an estimated amount if preTxBalance and postTxBalance are the same for ETH', () => {
      const props = createProps();
      expect(
        getSwapsTokensReceivedFromTxMeta(
          props.tokenSymbol,
          props.txMeta,
          props.tokenAddress,
          props.accountAddress,
          props.tokenDecimals,
          props.approvalTxMeta,
          props.chainId,
        ),
      ).toBe(props.txMeta.swapMetaData.token_to_amount);
    });

    it('returns null if there is no txMeta', () => {
      const props = createProps();
      props.txMeta = undefined;
      expect(
        getSwapsTokensReceivedFromTxMeta(
          props.tokenSymbol,
          props.txMeta,
          props.tokenAddress,
          props.accountAddress,
          props.tokenDecimals,
          props.approvalTxMeta,
          props.chainId,
        ),
      ).toBeNull();
    });

    it('returns null if there is no txMeta.txReceipt', () => {
      const props = createProps();
      props.txMeta.txReceipt = undefined;
      expect(
        getSwapsTokensReceivedFromTxMeta(
          props.tokenSymbol,
          props.txMeta,
          props.tokenAddress,
          props.accountAddress,
          props.tokenDecimals,
          props.approvalTxMeta,
          props.chainId,
        ),
      ).toBeNull();
    });

    it('returns null if there is no txMeta.postTxBalance', () => {
      const props = createProps();
      props.txMeta.postTxBalance = undefined;
      expect(
        getSwapsTokensReceivedFromTxMeta(
          props.tokenSymbol,
          props.txMeta,
          props.tokenAddress,
          props.accountAddress,
          props.tokenDecimals,
          props.approvalTxMeta,
          props.chainId,
        ),
      ).toBeNull();
    });

    it('returns null if there is no txMeta.preTxBalance', () => {
      const props = createProps();
      props.txMeta.preTxBalance = undefined;
      expect(
        getSwapsTokensReceivedFromTxMeta(
          props.tokenSymbol,
          props.txMeta,
          props.tokenAddress,
          props.accountAddress,
          props.tokenDecimals,
          props.approvalTxMeta,
          props.chainId,
        ),
      ).toBeNull();
    });
  });
});
