import nock from 'nock';
import { CHAIN_IDS } from '../constants/network';
import {
  SWAPS_CHAINID_DEFAULT_TOKEN_MAP,
  WETH_CONTRACT_ADDRESS,
  WBNB_CONTRACT_ADDRESS,
  WMATIC_CONTRACT_ADDRESS,
} from '../constants/swaps';
import {
  TOKENS,
  MOCK_TRADE_RESPONSE_2,
} from '../../ui/pages/swaps/swaps-util-test-constants';
import {
  fetchTradesInfo,
  shouldEnableDirectWrapping,
  calculateMaxGasLimit,
  calcTokenValue,
} from './swaps-utils';

jest.mock('./storage-helpers', () => ({
  getStorageItem: jest.fn(),
  setStorageItem: jest.fn(),
}));

describe('Swaps Utils', () => {
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
      nock('https://swap.api.cx.metamask.io')
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

  describe('calculateMaxGasLimit', () => {
    const gasEstimate = '0x37b15';
    const maxGas = 273740;
    let expectedMaxGas = '42d4c';
    let gasMultiplier = 1.2;
    let customMaxGas = '';

    it('should return the max gas limit', () => {
      const result = calculateMaxGasLimit(
        gasEstimate,
        gasMultiplier,
        maxGas,
        customMaxGas,
      );
      expect(result).toStrictEqual(expectedMaxGas);
    });

    it('should return the custom max gas limit', () => {
      customMaxGas = '46d4c';
      const result = calculateMaxGasLimit(
        gasEstimate,
        gasMultiplier,
        maxGas,
        customMaxGas,
      );
      expect(result).toStrictEqual(customMaxGas);
    });

    it('should return the max gas limit with a gas multiplier of 4.5', () => {
      gasMultiplier = 4.5;
      expectedMaxGas = 'fa9df';
      customMaxGas = '';
      const result = calculateMaxGasLimit(
        gasEstimate,
        gasMultiplier,
        maxGas,
        customMaxGas,
      );
      expect(result).toStrictEqual(expectedMaxGas);
    });
  });

  describe('calcTokenValue', () => {
    it('should be possible to calculate very big values', () => {
      let result = calcTokenValue(1, 20);
      expect(result.toString()).toStrictEqual('100000000000000000000');
      result = calcTokenValue(1, 30);
      expect(result.toString()).toStrictEqual('1e+30');
    });
  });
});
