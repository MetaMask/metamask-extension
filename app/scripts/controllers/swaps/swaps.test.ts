import { BigNumber } from '@ethersproject/bignumber';
import { ExternalProvider, JsonRpcFetchFunc } from '@ethersproject/providers';
import { ChainId } from '@metamask/controller-utils';
import BigNumberjs from 'bignumber.js';
import { mapValues } from 'lodash';
import { GasEstimateTypes } from '../../../../shared/constants/gas';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { ETH_SWAPS_TOKEN_OBJECT } from '../../../../shared/constants/swaps';
import { createTestProviderTools } from '../../../../test/stub/provider';
import { getDefaultSwapsControllerState } from './swaps.constants';
import {
  FetchTradesInfoParams,
  FetchTradesInfoParamsMetadata,
  Quote,
  SwapsControllerMessenger,
} from './swaps.types';
import { getMedianEthValueQuote } from './swaps.utils';
import SwapsController from '.';

const MOCK_FETCH_PARAMS: FetchTradesInfoParams = {
  slippage: 3,
  sourceToken: '0x6b175474e89094c44da98b954eedeac495271d0f',
  sourceDecimals: 18,
  destinationToken: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  value: '1000000000000000000',
  fromAddress: '0x7F18BB4Dd92CF2404C54CBa1A9BE4A1153bdb078',
  exchangeList: 'zeroExV1',
  balanceError: false,
};

const TEST_AGG_ID_1 = 'TEST_AGG_1';
const TEST_AGG_ID_2 = 'TEST_AGG_2';
const TEST_AGG_ID_3 = 'TEST_AGG_3';
const TEST_AGG_ID_4 = 'TEST_AGG_4';
const TEST_AGG_ID_5 = 'TEST_AGG_5';
const TEST_AGG_ID_6 = 'TEST_AGG_6';
const TEST_AGG_ID_BEST = 'TEST_AGG_BEST';
const TEST_AGG_ID_APPROVAL = 'TEST_AGG_APPROVAL';

// const POLLING_TIMEOUT = SECOND * 1000;

const MOCK_APPROVAL_NEEDED = {
  data: '0x095ea7b300000000000000000000000095e6f48254609a6ee006f7d493c8e5fb97094cef0000000000000000000000000000000000000000004a817c7ffffffdabf41c00',
  to: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  amount: '0',
  from: '0x2369267687A84ac7B494daE2f1542C40E37f4455',
  gas: '12',
  gasPrice: '34',
};

const MOCK_QUOTES_APPROVAL_REQUIRED = {
  [TEST_AGG_ID_APPROVAL]: {
    trade: {
      data: '0x00',
      from: '0x7F18BB4Dd92CF2404C54CBa1A9BE4A1153bdb078',
      value: '0x17647444f166000',
      gas: '0xe09c0',
      gasPrice: undefined,
      to: '0x881d40237659c251811cec9c364ef91dc08d300c',
    },
    sourceAmount: '1000000000000000000000000000000000000',
    destinationAmount: '396493201125465',
    error: null,
    sourceToken: '0x6b175474e89094c44da98b954eedeac495271d0f',
    destinationToken: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    maxGas: 920000,
    averageGas: 312510,
    estimatedRefund: 343090,
    fetchTime: 559,
    aggregator: TEST_AGG_ID_APPROVAL,
    aggType: 'AGG',
    slippage: 3,
    approvalNeeded: MOCK_APPROVAL_NEEDED,
    fee: 1,
  },
};

const MOCK_FETCH_METADATA: FetchTradesInfoParamsMetadata = {
  destinationTokenInfo: {
    symbol: 'FOO',
    decimals: 18,
    address: '0xSomeAddress',
  },
  sourceTokenInfo: {
    symbol: 'BAR',
    decimals: 18,
    address: '0xSomeOtherAddress',
  },
  chainId: CHAIN_IDS.MAINNET,
};

const MOCK_GET_BUFFERED_GAS_LIMIT = async () => ({
  gasLimit: '2000000',
  simulationFails: false,
});

const fetchTradesInfoStub = jest.fn();
const getLayer1GasFeeStub = jest.fn().mockReturnValue('0x1');
const getEIP1559GasFeeEstimatesStub = jest.fn().mockReturnValue({
  gasFeeEstimates: {
    high: '150',
  },
  gasEstimateType: GasEstimateTypes.legacy,
});
const trackMetaMetricsEventStub = jest.fn();

// Create a single mock object
const messengerMock = {
  call: jest.fn(),
  registerActionHandler: jest.fn(),
  registerInitialEventPayload: jest.fn(),
  publish: jest.fn(),
} as unknown as jest.Mocked<SwapsControllerMessenger>;

const networkControllerGetStateCallbackMock = jest
  .fn()
  .mockReturnValue({ selectedNetworkClientId: 'metamask' });

const networkControllerGetNetworkClientByIdCallbackMock = jest
  .fn()
  .mockReturnValue({ configuration: { chainId: CHAIN_IDS.MAINNET } });

const tokenRatesControllerGetStateCallbackMock = jest.fn().mockReturnValue({
  marketData: {
    '0x1': {
      '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': { price: 2 },
      '0x1111111111111111111111111111111111111111': { price: 0.1 },
    },
  },
});

messengerMock.call.mockImplementation((actionName, ..._rest) => {
  if (actionName === 'NetworkController:getState') {
    return networkControllerGetStateCallbackMock();
  }
  if (actionName === 'NetworkController:getNetworkClientById') {
    return networkControllerGetNetworkClientByIdCallbackMock();
  }
  if (actionName === 'TokenRatesController:getState') {
    return tokenRatesControllerGetStateCallbackMock();
  }
  return undefined;
});

describe('SwapsController', function () {
  let provider: ExternalProvider | JsonRpcFetchFunc;
  const getSwapsController = (
    _provider: ExternalProvider | JsonRpcFetchFunc = provider,
  ) => {
    return new SwapsController(
      {
        getBufferedGasLimit: MOCK_GET_BUFFERED_GAS_LIMIT,
        provider: _provider,
        fetchTradesInfo: fetchTradesInfoStub,
        getEIP1559GasFeeEstimates: getEIP1559GasFeeEstimatesStub,
        getLayer1GasFee: getLayer1GasFeeStub,
        trackMetaMetricsEvent: trackMetaMetricsEventStub,
        messenger: messengerMock,
      },
      getDefaultSwapsControllerState(),
    );
  };

  beforeEach(function () {
    const providerResultStub = {
      // 1 gwei
      eth_gasPrice: '0x0de0b6b3a7640000',
      // by default, all accounts are external accounts (not contracts)
      eth_getCode: '0x',
    };
    provider = createTestProviderTools({
      scaffold: providerResultStub,
      networkId: 1,
      chainId: CHAIN_IDS.MAINNET as ChainId,
    }).provider;
    jest.useFakeTimers();
  });

  afterEach(function () {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('constructor', function () {
    it('should setup correctly', function () {
      const swapsController = getSwapsController();
      expect(swapsController.state).toStrictEqual(
        getDefaultSwapsControllerState(),
      );
      expect(swapsController.getBufferedGasLimit).toStrictEqual(
        MOCK_GET_BUFFERED_GAS_LIMIT,
      );
    });
  });

  describe('API', function () {
    let swapsController: SwapsController;
    beforeEach(function () {
      swapsController = getSwapsController();
    });

    describe('setters', function () {
      it('should set selected quote agg id', function () {
        const selectedAggId = 'test';
        swapsController.setSelectedQuoteAggId(selectedAggId);
        expect(swapsController.state.swapsState.selectedAggId).toStrictEqual(
          selectedAggId,
        );
      });

      it('should set swaps tokens', function () {
        const tokens: string[] = [];
        swapsController.setSwapsTokens(tokens);
        expect(swapsController.state.swapsState.tokens).toStrictEqual(tokens);
      });

      it('should set trade tx id', function () {
        const tradeTxId = 'test';
        swapsController.setTradeTxId(tradeTxId);
        expect(swapsController.state.swapsState.tradeTxId).toStrictEqual(
          tradeTxId,
        );
      });

      it('should set swaps tx gas price', function () {
        const gasPrice = '1';
        swapsController.setSwapsTxGasPrice(gasPrice);
        expect(swapsController.state.swapsState.customGasPrice).toStrictEqual(
          gasPrice,
        );
      });

      it('should set swaps tx gas limit', function () {
        const gasLimit = '1';
        swapsController.setSwapsTxGasLimit(gasLimit);
        expect(swapsController.state.swapsState.customMaxGas).toStrictEqual(
          gasLimit,
        );
      });

      it('should set background swap route state', function () {
        const routeState = 'test';
        swapsController.setBackgroundSwapRouteState(routeState);
        expect(swapsController.state.swapsState.routeState).toStrictEqual(
          routeState,
        );
      });

      it('should set swaps error key', function () {
        const errorKey = 'test';
        swapsController.setSwapsErrorKey(errorKey);
        expect(swapsController.state.swapsState.errorKey).toStrictEqual(
          errorKey,
        );
      });

      it('should set initial gas estimate', async function () {
        const initialAggId = TEST_AGG_ID_1;
        const { maxGas, estimatedRefund, trade } =
          getMockQuotes()[TEST_AGG_ID_1];

        // eslint-disable-next-line jest/no-if
        if (!trade) {
          throw new Error('Trade data is required');
        }

        // Override state with mock quotes in order to have data for the test agg
        swapsController.__test__updateState({
          swapsState: {
            ...swapsController.state.swapsState,
            quotes: getMockQuotes(),
          },
        });

        await swapsController.setInitialGasEstimate(initialAggId);

        const { gasLimit: bufferedGasLimit } =
          await swapsController.getBufferedGasLimit(
            {
              txParams: {
                value: trade.value,
                data: trade.data,
                from: trade.from,
                to: trade.to,
              },
            },
            1,
          );
        const { gasEstimate, gasEstimateWithRefund } =
          swapsController.state.swapsState.quotes[initialAggId];

        expect(gasEstimate).toStrictEqual(bufferedGasLimit);
        expect(gasEstimateWithRefund).toStrictEqual(
          `0x${new BigNumberjs(maxGas, 10)
            .minus(estimatedRefund, 10)
            .toString(16)}`,
        );
      });

      it('should set custom approve tx data', function () {
        const data = 'test';
        swapsController.setCustomApproveTxData(data);
        expect(
          swapsController.state.swapsState.customApproveTxData,
        ).toStrictEqual(data);
      });
    });

    describe('getTopQuoteWithCalculatedSavings', function () {
      beforeEach(function () {
        swapsController.__test__updateState({
          swapsState: {
            ...swapsController.state.swapsState,
            customGasPrice: '0x174876e800',
          },
        });
      });

      it('returns empty object if passed undefined or empty object', async function () {
        expect(
          await swapsController.getTopQuoteWithCalculatedSavings(),
        ).toStrictEqual({});

        expect(
          await swapsController.getTopQuoteWithCalculatedSavings({}),
        ).toStrictEqual({});
      });

      it('returns the top aggId and quotes with savings and fee values if passed necessary data and an even number of quotes', async function () {
        const topQuoteAndSavings =
          await swapsController.getTopQuoteWithCalculatedSavings(
            getTopQuoteAndSavingsMockQuotes(),
          );

        const topAggId = topQuoteAndSavings[0];
        const resultQuotes = topQuoteAndSavings[1];
        expect(topAggId).toStrictEqual(TEST_AGG_ID_1);
        expect(resultQuotes).toStrictEqual(
          getTopQuoteAndSavingsBaseExpectedResults(),
        );
      });

      it('returns the top aggId and quotes with savings and fee values if passed necessary data and an odd number of quotes', async function () {
        const completeTestInput = getTopQuoteAndSavingsMockQuotes();
        const partialTestInput = {
          [TEST_AGG_ID_1]: completeTestInput[TEST_AGG_ID_1],
          [TEST_AGG_ID_2]: completeTestInput[TEST_AGG_ID_2],
          [TEST_AGG_ID_3]: completeTestInput[TEST_AGG_ID_3],
          [TEST_AGG_ID_4]: completeTestInput[TEST_AGG_ID_4],
          [TEST_AGG_ID_5]: completeTestInput[TEST_AGG_ID_5],
        };

        const completeExpectedResultQuotes =
          getTopQuoteAndSavingsBaseExpectedResults();
        const partialExpectedResultQuotes = {
          [TEST_AGG_ID_1]: completeExpectedResultQuotes[TEST_AGG_ID_1],
          [TEST_AGG_ID_2]: completeExpectedResultQuotes[TEST_AGG_ID_2],
          [TEST_AGG_ID_3]: completeExpectedResultQuotes[TEST_AGG_ID_3],
          [TEST_AGG_ID_4]: completeExpectedResultQuotes[TEST_AGG_ID_4],
          [TEST_AGG_ID_5]: completeExpectedResultQuotes[TEST_AGG_ID_5],
        };

        completeExpectedResultQuotes[TEST_AGG_ID_1].savings = {
          total: '0.0092',
          performance: '0.0297',
          fee: '0',
          metaMaskFee: '0.0205',
          medianMetaMaskFee: '0.0202',
        };

        const topQuoteAndSavings =
          await swapsController.getTopQuoteWithCalculatedSavings(
            partialTestInput,
          );
        const topAggId = topQuoteAndSavings[0];
        const resultQuotes = topQuoteAndSavings[1];

        expect(topAggId).toStrictEqual(TEST_AGG_ID_1);
        expect(resultQuotes).toStrictEqual(partialExpectedResultQuotes);
      });

      it('returns the top aggId, without best quote flagged, and quotes with fee values if passed necessary data but no custom convert rate exists', async function () {
        const testInput = mapValues(
          getTopQuoteAndSavingsMockQuotes(),
          (quote) => ({
            ...quote,
            destinationToken: '0xnoConversionRateExists',
          }),
        );
        const expectedResultQuotes = {
          [TEST_AGG_ID_1]: {
            ...testInput[TEST_AGG_ID_1],
            ethFee: '0.25',
          },
          [TEST_AGG_ID_2]: {
            ...testInput[TEST_AGG_ID_2],
            ethFee: '0.25',
          },
          [TEST_AGG_ID_3]: {
            ...testInput[TEST_AGG_ID_3],
            ethFee: '0.25',
          },
          [TEST_AGG_ID_4]: {
            ...testInput[TEST_AGG_ID_4],
            ethFee: '0.25',
          },
          [TEST_AGG_ID_5]: {
            ...testInput[TEST_AGG_ID_5],
            ethFee: '0.25',
          },
          [TEST_AGG_ID_6]: {
            ...testInput[TEST_AGG_ID_6],
            ethFee: '0.25',
          },
        };

        const topQuoteAndSavings =
          await swapsController.getTopQuoteWithCalculatedSavings(testInput);
        const topAggId = topQuoteAndSavings[0];
        const resultQuotes = topQuoteAndSavings[1];
        expect(topAggId).toStrictEqual(TEST_AGG_ID_1);
        expect(resultQuotes).toStrictEqual(expectedResultQuotes);
      });

      it('returns the top aggId and quotes with savings and fee values if passed necessary data and the source token is ETH', async function () {
        const testInput = mapValues(
          getTopQuoteAndSavingsMockQuotes(),
          (quote) => ({
            ...quote,
            sourceToken: ETH_SWAPS_TOKEN_OBJECT.address,
            destinationToken: '0x1111111111111111111111111111111111111111',
            trade: {
              value: '0x8ac7230489e80000',
            },
          }),
        );
        const baseExpectedResultQuotes =
          getTopQuoteAndSavingsBaseExpectedResults();
        const expectedResultQuotes = {
          [TEST_AGG_ID_1]: {
            ...baseExpectedResultQuotes[TEST_AGG_ID_1],
            sourceToken: ETH_SWAPS_TOKEN_OBJECT.address,
            destinationToken: '0x1111111111111111111111111111111111111111',
            trade: { value: '0x8ac7230489e80000' },
            overallValueOfQuote: '1.7795',
          },
          [TEST_AGG_ID_2]: {
            ...baseExpectedResultQuotes[TEST_AGG_ID_2],
            sourceToken: ETH_SWAPS_TOKEN_OBJECT.address,
            destinationToken: '0x1111111111111111111111111111111111111111',
            trade: { value: '0x8ac7230489e80000' },
            overallValueOfQuote: '1.7696',
          },
          [TEST_AGG_ID_3]: {
            ...baseExpectedResultQuotes[TEST_AGG_ID_3],
            sourceToken: ETH_SWAPS_TOKEN_OBJECT.address,
            destinationToken: '0x1111111111111111111111111111111111111111',
            trade: { value: '0x8ac7230489e80000' },
            overallValueOfQuote: '1.7498',
          },
          [TEST_AGG_ID_4]: {
            ...baseExpectedResultQuotes[TEST_AGG_ID_4],
            sourceToken: ETH_SWAPS_TOKEN_OBJECT.address,
            destinationToken: '0x1111111111111111111111111111111111111111',
            trade: { value: '0x8ac7230489e80000' },
            overallValueOfQuote: '1.73',
          },
          [TEST_AGG_ID_5]: {
            ...baseExpectedResultQuotes[TEST_AGG_ID_5],
            sourceToken: ETH_SWAPS_TOKEN_OBJECT.address,
            destinationToken: '0x1111111111111111111111111111111111111111',
            trade: { value: '0x8ac7230489e80000' },
            overallValueOfQuote: '1.7102',
          },
          [TEST_AGG_ID_6]: {
            ...baseExpectedResultQuotes[TEST_AGG_ID_6],
            sourceToken: ETH_SWAPS_TOKEN_OBJECT.address,
            destinationToken: '0x1111111111111111111111111111111111111111',
            trade: { value: '0x8ac7230489e80000' },
            overallValueOfQuote: '1.6805',
          },
        };

        const topQuoteAndSavings =
          await swapsController.getTopQuoteWithCalculatedSavings(
            testInput as Record<string, Quote>,
          );
        const topAggId = topQuoteAndSavings[0];
        const resultQuotes = topQuoteAndSavings[1];
        expect(topAggId).toStrictEqual(TEST_AGG_ID_1);
        expect(resultQuotes).toStrictEqual(expectedResultQuotes);
      });

      it('returns the top aggId and quotes with savings and fee values if passed necessary data and the source token is ETH and an ETH fee is included in the trade value of what would be the best quote', async function () {
        const testInput = mapValues(
          getTopQuoteAndSavingsMockQuotes(),
          (quote) => ({
            ...quote,
            sourceToken: ETH_SWAPS_TOKEN_OBJECT.address,
            destinationToken: '0x1111111111111111111111111111111111111111',
            trade: {
              value: '0x8ac7230489e80000',
            },
          }),
        );
        // 0.04 ETH fee included in trade value
        testInput[TEST_AGG_ID_1].trade.value = '0x8b553ece48ec0000';
        const baseExpectedResultQuotes =
          getTopQuoteAndSavingsBaseExpectedResults();
        const expectedResultQuotes = {
          [TEST_AGG_ID_1]: {
            ...baseExpectedResultQuotes[TEST_AGG_ID_1],
            sourceToken: ETH_SWAPS_TOKEN_OBJECT.address,
            destinationToken: '0x1111111111111111111111111111111111111111',
            trade: { value: '0x8b553ece48ec0000' },
            overallValueOfQuote: '1.7395',
            ethFee: '0.29',
          },
          [TEST_AGG_ID_2]: {
            ...baseExpectedResultQuotes[TEST_AGG_ID_2],
            sourceToken: ETH_SWAPS_TOKEN_OBJECT.address,
            destinationToken: '0x1111111111111111111111111111111111111111',
            trade: { value: '0x8ac7230489e80000' },
            overallValueOfQuote: '1.7696',
            isBestQuote: true,
            savings: {
              total: '0.01445',
              performance: '0.01485',
              fee: '0.02',
              metaMaskFee: '0.0204',
              medianMetaMaskFee: '0.02025',
            },
          },
          [TEST_AGG_ID_3]: {
            ...baseExpectedResultQuotes[TEST_AGG_ID_3],
            sourceToken: ETH_SWAPS_TOKEN_OBJECT.address,
            destinationToken: '0x1111111111111111111111111111111111111111',
            trade: { value: '0x8ac7230489e80000' },
            overallValueOfQuote: '1.7498',
          },
          [TEST_AGG_ID_4]: {
            ...baseExpectedResultQuotes[TEST_AGG_ID_4],
            sourceToken: ETH_SWAPS_TOKEN_OBJECT.address,
            destinationToken: '0x1111111111111111111111111111111111111111',
            trade: { value: '0x8ac7230489e80000' },
            overallValueOfQuote: '1.73',
          },
          [TEST_AGG_ID_5]: {
            ...baseExpectedResultQuotes[TEST_AGG_ID_5],
            sourceToken: ETH_SWAPS_TOKEN_OBJECT.address,
            destinationToken: '0x1111111111111111111111111111111111111111',
            trade: { value: '0x8ac7230489e80000' },
            overallValueOfQuote: '1.7102',
          },
          [TEST_AGG_ID_6]: {
            ...baseExpectedResultQuotes[TEST_AGG_ID_6],
            sourceToken: ETH_SWAPS_TOKEN_OBJECT.address,
            destinationToken: '0x1111111111111111111111111111111111111111',
            trade: { value: '0x8ac7230489e80000' },
            overallValueOfQuote: '1.6805',
          },
        };
        // @ts-expect-error - we are removing a property that we know exists even if its optional in the type definition
        delete expectedResultQuotes[TEST_AGG_ID_1].isBestQuote;
        // @ts-expect-error - we are removing a property that we know exists even if its optional in the type definition
        delete expectedResultQuotes[TEST_AGG_ID_1].savings;

        const topQuoteAndSavings =
          await swapsController.getTopQuoteWithCalculatedSavings(
            testInput as Record<string, Quote>,
          );
        const topAggId = topQuoteAndSavings[0];
        const resultQuotes = topQuoteAndSavings[1];

        expect(topAggId).toStrictEqual(TEST_AGG_ID_2);
        expect(resultQuotes).toStrictEqual(expectedResultQuotes);
      });

      it('returns the top aggId and quotes with savings and fee values if passed necessary data and the source token is not ETH and an ETH fee is included in the trade value of what would be the best quote', async function () {
        const testInput = getTopQuoteAndSavingsMockQuotes();
        // 0.04 ETH fee included in trade value
        // @ts-expect-error - trade can be undefined but in this case since its mocked it will always be defined
        testInput[TEST_AGG_ID_1].trade.value = '0x8e1bc9bf040000';
        const baseExpectedResultQuotes =
          getTopQuoteAndSavingsBaseExpectedResults();
        const expectedResultQuotes = {
          ...baseExpectedResultQuotes,
          [TEST_AGG_ID_1]: {
            ...baseExpectedResultQuotes[TEST_AGG_ID_1],
            trade: { value: '0x8e1bc9bf040000' },
            overallValueOfQuote: '1.7395',
            ethFee: '0.29',
          },
          [TEST_AGG_ID_2]: {
            ...baseExpectedResultQuotes[TEST_AGG_ID_2],
            isBestQuote: true,
            savings: {
              total: '0.01445',
              performance: '0.01485',
              fee: '0.02',
              metaMaskFee: '0.0204',
              medianMetaMaskFee: '0.02025',
            },
          },
        };
        // @ts-expect-error - we are removing a property that we know exists even if its optional in the type definition
        delete expectedResultQuotes[TEST_AGG_ID_1].isBestQuote;
        // @ts-expect-error - we are removing a property that we know exists even if its optional in the type definition
        delete expectedResultQuotes[TEST_AGG_ID_1].savings;

        const topQuoteAndSavings =
          await swapsController.getTopQuoteWithCalculatedSavings(testInput);
        const topAggId = topQuoteAndSavings[0];
        const resultQuotes = topQuoteAndSavings[1];

        expect(topAggId).toStrictEqual(TEST_AGG_ID_2);
        expect(resultQuotes).toStrictEqual(expectedResultQuotes);
      });
    });

    describe('fetchAndSetQuotes', function () {
      it('returns null if fetchParams is not provided', async function () {
        // @ts-expect-error - we are testing the case where fetchParams is not provided
        const quotes = await swapsController.fetchAndSetQuotes(undefined);
        expect(quotes).toStrictEqual(null);
      });

      it('calls fetchTradesInfo with the given fetchParams and returns the correct quotes', async function () {
        fetchTradesInfoStub.mockReset();
        const providerResultStub = {
          // 1 gwei
          eth_gasPrice: '0x0de0b6b3a7640000',
          // by default, all accounts are external accounts (not contracts)
          eth_getCode: '0x',
        };
        const mainnetProvider = createTestProviderTools({
          scaffold: providerResultStub,
          networkId: 1,
          chainId: CHAIN_IDS.MAINNET as ChainId,
        }).provider;

        swapsController = getSwapsController(mainnetProvider);

        const fetchTradesInfoSpy = jest
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .spyOn(swapsController as any, '_fetchTradesInfo')
          .mockReturnValue(getMockQuotes());

        // Make it so approval is not required
        jest
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .spyOn(swapsController as any, '_getERC20Allowance')
          .mockReturnValue(BigNumber.from(1));

        // Make the network fetch error message disappear
        jest
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .spyOn(swapsController as any, '_setSwapsNetworkConfig')
          .mockReturnValue(undefined);

        const fetchResponse = await swapsController.fetchAndSetQuotes(
          MOCK_FETCH_PARAMS,
          MOCK_FETCH_METADATA,
        );

        if (!fetchResponse?.[0]) {
          throw new Error('Quotes should be defined');
        }

        const [newQuotes] = fetchResponse;

        expect(newQuotes[TEST_AGG_ID_BEST]).toStrictEqual({
          ...getMockQuotes()[TEST_AGG_ID_BEST],
          destinationTokenInfo: {
            address: '0xSomeAddress',
            symbol: 'FOO',
            decimals: 18,
          },
          isBestQuote: true,
          // TODO: find a way to calculate these values dynamically
          gasEstimate: '2000000',
          gasEstimateWithRefund: '0xb8cae',
          savings: {
            fee: '-0.061067',
            metaMaskFee: '0.50505050505050505050505050505050505',
            performance: '6',
            total: '5.43388249494949494949494949494949495',
            medianMetaMaskFee: '0.444444444444444444444444444444444444',
          },
          ethFee: '0.113536',
          overallValueOfQuote: '49.886464',
          metaMaskFeeInEth: '0.50505050505050505050505050505050505',
          ethValueOfTokens: '50',
          sourceTokenInfo: {
            address: '0xSomeOtherAddress',
            decimals: 18,
            symbol: 'BAR',
          },
        });

        expect(fetchTradesInfoSpy).toHaveBeenCalledTimes(1);
        expect(fetchTradesInfoSpy).toHaveBeenCalledWith(MOCK_FETCH_PARAMS, {
          ...MOCK_FETCH_METADATA,
        });
      });

      it('calls returns the correct quotes on the optimism chain', async function () {
        fetchTradesInfoStub.mockReset();
        const OPTIMISM_MOCK_FETCH_METADATA = {
          ...MOCK_FETCH_METADATA,
          chainId: CHAIN_IDS.OPTIMISM as ChainId,
        };
        const optimismProviderResultStub = {
          // 1 gwei
          eth_gasPrice: '0x0de0b6b3a7640000',
          // by default, all accounts are external accounts (not contracts)
          eth_getCode: '0x',
          eth_call:
            '0x000000000000000000000000000000000000000000000000000103c18816d4e8',
        };
        const optimismProvider = createTestProviderTools({
          scaffold: optimismProviderResultStub,
          networkId: 10,
          chainId: CHAIN_IDS.OPTIMISM as ChainId,
        }).provider;

        swapsController = getSwapsController(optimismProvider);

        const fetchTradesInfoSpy = jest
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .spyOn(swapsController as any, '_fetchTradesInfo')
          .mockReturnValue(getMockQuotes());

        // Make it so approval is not required
        jest
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .spyOn(swapsController as any, '_getERC20Allowance')
          .mockReturnValue(BigNumber.from(1));

        // Make the network fetch error message disappear
        jest
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .spyOn(swapsController as any, '_setSwapsNetworkConfig')
          .mockReturnValue(undefined);

        const fetchResponse = await swapsController.fetchAndSetQuotes(
          MOCK_FETCH_PARAMS,
          OPTIMISM_MOCK_FETCH_METADATA,
        );

        if (!fetchResponse?.[0]) {
          throw new Error('Quotes should be defined');
        }

        const [newQuotes] = fetchResponse;

        expect(newQuotes[TEST_AGG_ID_BEST]).toStrictEqual({
          ...getMockQuotes()[TEST_AGG_ID_BEST],
          destinationTokenInfo: {
            address: '0xSomeAddress',
            symbol: 'FOO',
            decimals: 18,
          },
          isBestQuote: true,
          // TODO: find a way to calculate these values dynamically
          gasEstimate: '2000000',
          gasEstimateWithRefund: '0xb8cae',
          savings: {
            fee: '-0.061067',
            metaMaskFee: '0.50505050505050505050505050505050505',
            performance: '6',
            total: '5.43388249494949494949494949494949495',
            medianMetaMaskFee: '0.444444444444444444444444444444444444',
          },
          ethFee: '0.113536',
          multiLayerL1TradeFeeTotal: '0x1',
          overallValueOfQuote: '49.886464',
          metaMaskFeeInEth: '0.50505050505050505050505050505050505',
          ethValueOfTokens: '50',
          sourceTokenInfo: {
            address: '0xSomeOtherAddress',
            decimals: 18,
            symbol: 'BAR',
          },
        });

        expect(fetchTradesInfoSpy).toHaveBeenCalledTimes(1);
        expect(fetchTradesInfoSpy).toHaveBeenCalledWith(MOCK_FETCH_PARAMS, {
          ...OPTIMISM_MOCK_FETCH_METADATA,
        });
      });

      it('performs the allowance check', async function () {
        // Make it so approval is not required
        const getERC20AllowanceSpy = jest
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .spyOn(swapsController as any, '_getERC20Allowance')
          .mockReturnValue(BigNumber.from(1));

        // Make the network fetch error message disappear
        jest
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .spyOn(swapsController as any, '_setSwapsNetworkConfig')
          .mockReturnValue(undefined);

        await swapsController.fetchAndSetQuotes(
          MOCK_FETCH_PARAMS,
          MOCK_FETCH_METADATA,
        );

        expect(getERC20AllowanceSpy).toHaveBeenCalledTimes(1);
        expect(getERC20AllowanceSpy).toHaveBeenCalledWith(
          MOCK_FETCH_PARAMS.sourceToken,
          MOCK_FETCH_PARAMS.fromAddress,
          CHAIN_IDS.MAINNET,
        );
      });

      it('gets the gas limit if approval is required', async function () {
        jest
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .spyOn(swapsController as any, '_fetchTradesInfo')
          .mockReturnValue(MOCK_QUOTES_APPROVAL_REQUIRED);

        // Ensure approval is required
        jest
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .spyOn(swapsController as any, '_getERC20Allowance')
          .mockReturnValue(BigNumber.from(0));

        // Make the network fetch error message disappear
        jest
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .spyOn(swapsController as any, '_setSwapsNetworkConfig')
          .mockReturnValue(undefined);

        const timedoutGasReturnResult = { gasLimit: 1000000 };
        const timedoutGasReturnSpy = jest
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .spyOn(swapsController as any, '_timedoutGasReturn')
          .mockReturnValue(timedoutGasReturnResult);

        await swapsController.fetchAndSetQuotes(
          MOCK_FETCH_PARAMS,
          MOCK_FETCH_METADATA,
        );

        // Mocked quotes approvalNeeded is null, so it will only be called with the gas
        expect(timedoutGasReturnSpy).toHaveBeenCalledTimes(1);
        expect(timedoutGasReturnSpy).toHaveBeenCalledWith(
          MOCK_APPROVAL_NEEDED,
          TEST_AGG_ID_APPROVAL,
        );
      });

      it('marks the best quote', async function () {
        jest
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .spyOn(swapsController as any, '_fetchTradesInfo')
          .mockReturnValue(getMockQuotes());

        // Make it so approval is not required
        jest
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .spyOn(swapsController as any, '_getERC20Allowance')
          .mockReturnValue(BigNumber.from(1));

        // Make the network fetch error message disappear
        jest
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .spyOn(swapsController as any, '_setSwapsNetworkConfig')
          .mockReturnValue(undefined);

        const fetchResponse = await swapsController.fetchAndSetQuotes(
          MOCK_FETCH_PARAMS,
          MOCK_FETCH_METADATA,
        );

        if (!fetchResponse?.[0] || !fetchResponse[1]) {
          throw new Error('newQuotes and topAggId should be defined');
        }

        const [newQuotes, topAggId] = fetchResponse;

        expect(topAggId).toStrictEqual(TEST_AGG_ID_BEST);
        expect(newQuotes[topAggId].isBestQuote).toStrictEqual(true);
      });

      it('selects the best quote', async function () {
        const bestAggId = 'bestAggId';

        // Clone the existing mock quote and increase destination amount
        const bestQuote = {
          ...getMockQuotes()[TEST_AGG_ID_1],
          aggregator: bestAggId,
          destinationAmount: BigNumber.from(
            getMockQuotes()[TEST_AGG_ID_1].destinationAmount,
          )
            .add((100e18).toString())
            .toString(),
        };

        const quotes = { ...getMockQuotes(), [bestAggId]: bestQuote };

        jest
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .spyOn(swapsController as any, '_fetchTradesInfo')
          .mockReturnValue(quotes);

        // Make it so approval is not required
        jest
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .spyOn(swapsController as any, '_getERC20Allowance')
          .mockReturnValue(BigNumber.from(1));

        // Make the network fetch error message disappear
        jest
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .spyOn(swapsController as any, '_setSwapsNetworkConfig')
          .mockReturnValue(undefined);

        const fetchResponse = await swapsController.fetchAndSetQuotes(
          MOCK_FETCH_PARAMS,
          MOCK_FETCH_METADATA,
        );

        if (!fetchResponse?.[0] || !fetchResponse[1]) {
          throw new Error('newQuotes and topAggId should be defined');
        }

        const [newQuotes, topAggId] = fetchResponse;

        expect(topAggId).toStrictEqual(bestAggId);
        expect(newQuotes[topAggId].isBestQuote).toStrictEqual(true);
      });

      it('does not mark as best quote if no conversion rate exists for destination token', async function () {
        jest
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .spyOn(swapsController as any, '_fetchTradesInfo')
          .mockReturnValue(getMockQuotes());

        // Make it so approval is not required
        jest
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .spyOn(swapsController as any, '_getERC20Allowance')
          .mockReturnValue(BigNumber.from(1));

        // Make the network fetch error message disappear
        jest
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .spyOn(swapsController as any, '_setSwapsNetworkConfig')
          .mockReturnValue(undefined);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (swapsController as any)._getTokenRatesState = () => ({
          marketData: {
            '0x1': {},
          },
        });

        const fetchResponse = await swapsController.fetchAndSetQuotes(
          MOCK_FETCH_PARAMS,
          MOCK_FETCH_METADATA,
        );

        if (!fetchResponse?.[0] || !fetchResponse[1]) {
          throw new Error('newQuotes and topAggId should be defined');
        }

        const [newQuotes, topAggId] = fetchResponse;

        expect(newQuotes[topAggId].isBestQuote).toStrictEqual(undefined);
      });

      // TODO: Re think how to test this without exposing internal state

      // it('should replace ethers instance when called with a different chainId than was current when the controller was instantiated', async function () {
      //   fetchTradesInfoStub.mockReset();

      //   const _swapsController = getSwapsController();

      //   const currentEthersInstance = _swapsController._ethersProvider;

      //   // Make the network fetch error message disappear
      //   jest
      //     .spyOn(_swapsController, '_setSwapsNetworkConfig')
      //     .mockReturnValue();

      //   await _swapsController.fetchAndSetQuotes(MOCK_FETCH_PARAMS, {
      //     ...MOCK_FETCH_METADATA,
      //     chainId: CHAIN_IDS.GOERLI,
      //   });

      //   const newEthersInstance = _swapsController._ethersProvider;
      //   expect(currentEthersInstance).not.toStrictEqual(newEthersInstance);
      // });

      // it('should not replace ethers instance when called with the same chainId that was current when the controller was instantiated', async function () {
      //   const _swapsController = new SwapsController({
      //     getBufferedGasLimit: MOCK_GET_BUFFERED_GAS_LIMIT,
      //     provider,
      //     fetchTradesInfo: fetchTradesInfoStub,
      //   });
      //   const currentEthersInstance = _swapsController._ethersProvider;

      //   // Make the network fetch error message disappear
      //   jest.spyOn(swapsController, '_setSwapsNetworkConfig').mockReturnValue();

      //   await swapsController.fetchAndSetQuotes(MOCK_FETCH_PARAMS, {
      //     ...MOCK_FETCH_METADATA,
      //     chainId: CHAIN_IDS.MAINNET,
      //   });

      //   const newEthersInstance = _swapsController._ethersProvider;
      //   expect(currentEthersInstance).toStrictEqual(newEthersInstance);
      // });

      // it('should replace ethers instance, and _ethersProviderChainId, twice when called twice with two different chainIds, and successfully set the _ethersProviderChainId when returning to the original chain', async function () {
      //   const _swapsController = new SwapsController({
      //     getBufferedGasLimit: MOCK_GET_BUFFERED_GAS_LIMIT,
      //     provider,
      //     fetchTradesInfo: fetchTradesInfoStub,
      //     getLayer1GasFee: getLayer1GasFeeStub,
      //   });
      //   const firstEthersInstance = _swapsController._ethersProvider;
      //   const firstEthersProviderChainId =
      //     _swapsController._ethersProviderChainId;

      //   // Make the network fetch error message disappear
      //   jest
      //     .spyOn(_swapsController, '_setSwapsNetworkConfig')
      //     .mockReturnValue();

      //   await _swapsController.fetchAndSetQuotes(MOCK_FETCH_PARAMS, {
      //     ...MOCK_FETCH_METADATA,
      //     chainId: CHAIN_IDS.GOERLI,
      //   });

      //   const secondEthersInstance = _swapsController._ethersProvider;
      //   const secondEthersProviderChainId =
      //     _swapsController._ethersProviderChainId;

      //   expect(firstEthersInstance).not.toStrictEqual(secondEthersInstance);
      //   expect(firstEthersInstance).not.toStrictEqual(
      //     secondEthersProviderChainId,
      //   );

      //   await _swapsController.fetchAndSetQuotes(MOCK_FETCH_PARAMS, {
      //     ...MOCK_FETCH_METADATA,
      //     chainId: CHAIN_IDS.LOCALHOST,
      //   });

      //   const thirdEthersInstance = _swapsController._ethersProvider;
      //   const thirdEthersProviderChainId =
      //     _swapsController._ethersProviderChainId;

      //   expect(firstEthersProviderChainId).not.toStrictEqual(
      //     thirdEthersInstance,
      //   );
      //   expect(secondEthersInstance).not.toStrictEqual(thirdEthersInstance);
      //   expect(firstEthersInstance).not.toStrictEqual(
      //     thirdEthersProviderChainId,
      //   );
      //   expect(secondEthersProviderChainId).not.toStrictEqual(
      //     thirdEthersProviderChainId,
      //   );

      //   await _swapsController.fetchAndSetQuotes(MOCK_FETCH_PARAMS, {
      //     ...MOCK_FETCH_METADATA,
      //     chainId: CHAIN_IDS.MAINNET,
      //   });

      //   const lastEthersProviderChainId =
      //     _swapsController._ethersProviderChainId;

      //   expect(firstEthersProviderChainId).toStrictEqual(
      //     lastEthersProviderChainId,
      //   );
      // });
    });

    describe('resetSwapsState', function () {
      it('resets the swaps state correctly', function () {
        const oldState = swapsController.state;
        swapsController.resetSwapsState();
        const newState = swapsController.state;

        expect(newState.swapsState).toStrictEqual({
          ...getDefaultSwapsControllerState().swapsState,
          tokens: oldState.swapsState.tokens,
          swapsQuoteRefreshTime: oldState.swapsState.swapsQuoteRefreshTime,
          swapsQuotePrefetchingRefreshTime:
            oldState.swapsState.swapsQuotePrefetchingRefreshTime,
          swapsStxGetTransactionsRefreshTime:
            oldState.swapsState.swapsStxGetTransactionsRefreshTime,
          swapsStxBatchStatusRefreshTime:
            oldState.swapsState.swapsStxBatchStatusRefreshTime,
          swapsStxStatusDeadline: oldState.swapsState.swapsStxStatusDeadline,
        });
      });

      // it('clears polling timeout', function () {
      //   swapsController._pollingTimeout = setTimeout(() => {
      //     throw new Error('Polling timeout not cleared');
      //   }, POLLING_TIMEOUT);

      //   // Reseting swaps state should clear the polling timeout
      //   swapsController.resetSwapsState();

      //   // Verify by ensuring the error is not thrown, indicating that the timer was cleared
      //   expect(jest.runOnlyPendingTimers).not.toThrow();
      // });
    });

    describe('stopPollingForQuotes', function () {
      // TODO: Re think how to test this without exposing internal state

      // it('clears polling timeout', function () {
      //   swapsController._pollingTimeout = setTimeout(() => {
      //     throw new Error('Polling timeout not cleared');
      //   }, POLLING_TIMEOUT);

      //   // Stop polling for quotes should clear the polling timeout
      //   swapsController.stopPollingForQuotes();

      //   // Verify by ensuring the error is not thrown, indicating that the timer was cleared
      //   expect(jest.runOnlyPendingTimers).not.toThrow();
      // });

      it('resets quotes state correctly', function () {
        swapsController.stopPollingForQuotes();
        const swapsState = swapsController.state;
        expect(swapsState.swapsState.quotes).toStrictEqual({});
        expect(swapsState.swapsState.quotesLastFetched).toStrictEqual(null);
      });
    });

    describe('resetPostFetchState', function () {
      // TODO: Re think how to test this without exposing internal state

      // it('clears polling timeout', function () {
      //   swapsController._pollingTimeout = setTimeout(() => {
      //     throw new Error('Polling timeout not cleared');
      //   }, POLLING_TIMEOUT);

      //   // Reset post fetch state should clear the polling timeout
      //   swapsController.resetPostFetchState();

      //   // Verify by ensuring the error is not thrown, indicating that the timer was cleared
      //   expect(jest.runOnlyPendingTimers).not.toThrow();
      // });

      it('updates state correctly', function () {
        const tokens = [''];
        const fetchParams: FetchTradesInfoParams & {
          metaData: FetchTradesInfoParamsMetadata;
        } = {
          sourceToken: '',
          destinationToken: '',
          sourceDecimals: 18,
          slippage: 2,
          value: '0x0',
          fromAddress: '',
          exchangeList: 'zeroExV1',
          balanceError: false,
          metaData: {} as FetchTradesInfoParamsMetadata,
        };
        const swapsFeatureIsLive = false;
        const swapsFeatureFlags = {};
        const swapsQuoteRefreshTime = 0;
        const swapsQuotePrefetchingRefreshTime = 0;
        const swapsStxBatchStatusRefreshTime = 0;
        const swapsStxGetTransactionsRefreshTime = 0;
        const swapsStxStatusDeadline = 0;
        swapsController.__test__updateState({
          swapsState: {
            ...swapsController.state.swapsState,
            tokens,
            fetchParams,
            swapsFeatureIsLive,
            swapsFeatureFlags,
            swapsQuoteRefreshTime,
            swapsQuotePrefetchingRefreshTime,
            swapsStxBatchStatusRefreshTime,
            swapsStxGetTransactionsRefreshTime,
            swapsStxStatusDeadline,
          },
        });

        swapsController.resetPostFetchState();

        const { swapsState } = swapsController.state;
        expect(swapsState).toStrictEqual({
          ...getDefaultSwapsControllerState().swapsState,
          tokens,
          fetchParams,
          swapsFeatureIsLive,
          swapsQuoteRefreshTime,
          swapsQuotePrefetchingRefreshTime,
        });
      });
    });
  });

  describe('utils', function () {
    describe('getMedianEthValueQuote', function () {
      it('calculates median correctly with uneven sample', function () {
        const expectedResult = {
          ethFee: '10',
          metaMaskFeeInEth: '5',
          ethValueOfTokens: '0.3',
        };

        const values = [
          {
            overallValueOfQuote: '3',
            ethFee: '10',
            metaMaskFeeInEth: '5',
            ethValueOfTokens: '0.3',
          },
          {
            overallValueOfQuote: '2',
            ethFee: '20',
            metaMaskFeeInEth: '3',
            ethValueOfTokens: '0.2',
          },
          {
            overallValueOfQuote: '6',
            ethFee: '40',
            metaMaskFeeInEth: '6',
            ethValueOfTokens: '0.6',
          },
        ] as Quote[];

        const median = getMedianEthValueQuote(values);
        expect(median).toStrictEqual(expectedResult);
      });

      it('calculates median correctly with even sample', function () {
        const expectedResult = {
          ethFee: '20',
          metaMaskFeeInEth: '6.5',
          ethValueOfTokens: '0.25',
        };

        const values = [
          {
            overallValueOfQuote: '3',
            ethFee: '10',
            metaMaskFeeInEth: '5',
            ethValueOfTokens: '0.3',
          },
          {
            overallValueOfQuote: '1',
            ethFee: '20',
            metaMaskFeeInEth: '3',
            ethValueOfTokens: '0.2',
          },
          {
            overallValueOfQuote: '2',
            ethFee: '30',
            metaMaskFeeInEth: '8',
            ethValueOfTokens: '0.2',
          },
          {
            overallValueOfQuote: '6',
            ethFee: '40',
            metaMaskFeeInEth: '6',
            ethValueOfTokens: '0.6',
          },
        ] as Quote[];

        const median = getMedianEthValueQuote(values);
        expect(median).toStrictEqual(expectedResult);
      });

      it('calculates median correctly with an uneven sample where multiple quotes have the median overall value', function () {
        const expectedResult = {
          ethFee: '2',
          metaMaskFeeInEth: '0.5',
          ethValueOfTokens: '5',
        };

        const values = [
          {
            overallValueOfQuote: '1',
            ethValueOfTokens: '2',
            ethFee: '1',
            metaMaskFeeInEth: '0.2',
          },
          {
            overallValueOfQuote: '3',
            ethValueOfTokens: '4',
            ethFee: '1',
            metaMaskFeeInEth: '0.4',
          },
          {
            overallValueOfQuote: '3',
            ethValueOfTokens: '5',
            ethFee: '2',
            metaMaskFeeInEth: '0.5',
          },
          {
            overallValueOfQuote: '3',
            ethValueOfTokens: '6',
            ethFee: '3',
            metaMaskFeeInEth: '0.6',
          },
          {
            overallValueOfQuote: '4',
            ethValueOfTokens: '6',
            ethFee: '2',
            metaMaskFeeInEth: '0.6',
          },
          {
            overallValueOfQuote: '4',
            ethValueOfTokens: '7',
            ethFee: '3',
            metaMaskFeeInEth: '0.7',
          },
          {
            overallValueOfQuote: '6',
            ethValueOfTokens: '8',
            ethFee: '2',
            metaMaskFeeInEth: '0.8',
          },
        ] as Quote[];

        const median = getMedianEthValueQuote(values);
        expect(median).toStrictEqual(expectedResult);
      });

      it('calculates median correctly with an even sample where multiple quotes have the same overall value as either of the two middle values', function () {
        const expectedResult = {
          ethFee: '2',
          metaMaskFeeInEth: '0.55',
          ethValueOfTokens: '5.5',
        };

        const values = [
          {
            overallValueOfQuote: '1',
            ethValueOfTokens: '2',
            ethFee: '1',
            metaMaskFeeInEth: '0.2',
          },
          {
            overallValueOfQuote: '3',
            ethValueOfTokens: '4',
            ethFee: '1',
            metaMaskFeeInEth: '0.4',
          },
          {
            overallValueOfQuote: '3',
            ethValueOfTokens: '5',
            ethFee: '2',
            metaMaskFeeInEth: '0.5',
          },
          {
            overallValueOfQuote: '4',
            ethValueOfTokens: '6',
            ethFee: '2',
            metaMaskFeeInEth: '0.6',
          },
          {
            overallValueOfQuote: '4',
            ethValueOfTokens: '7',
            ethFee: '3',
            metaMaskFeeInEth: '0.7',
          },
          {
            overallValueOfQuote: '6',
            ethValueOfTokens: '8',
            ethFee: '2',
            metaMaskFeeInEth: '0.8',
          },
        ] as Quote[];

        const median = getMedianEthValueQuote(values);
        expect(median).toStrictEqual(expectedResult);
      });

      it('throws on empty array', function () {
        expect(() => getMedianEthValueQuote([])).toThrow(
          'Expected non-empty array param.',
        );
      });
    });
  });
});

function getMockQuotes(): Record<string, Quote> {
  return {
    [TEST_AGG_ID_1]: {
      aggregator: TEST_AGG_ID_1,
      aggType: 'AGG',
      approvalNeeded: null,
      averageGas: 120000,
      destinationAmount: '20000000000000000000',
      destinationToken: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      destinationTokenInfo: {
        address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        symbol: 'USDC',
        decimals: 18,
      },
      destinationTokenRate: 2,
      error: null,
      estimatedRefund: '80000',
      ethFee: '0.006',
      ethValueOfTokens: '0.1',
      fee: 1,
      fetchTime: 607,
      gasEstimate: '120000',
      gasEstimateWithRefund: '100000',
      gasMultiplier: 1.1,
      hasRoute: true,
      maxGas: 600000,
      metaMaskFeeInEth: '0.001',
      overallValueOfQuote: '19.994',
      priceSlippage: {
        bucket: 'low',
        calculationError: '',
        destinationAmountInETH: 0.1,
        destinationAmountInNativeCurrency: 20,
        ratio: 0.995,
        sourceAmountInETH: 0.05,
        sourceAmountInNativeCurrency: 10,
        sourceAmountInUSD: 10,
        destinationAmountInUSD: 20,
      },
      quoteRefreshSeconds: 60,
      sourceAmount: '10000000000000000000',
      sourceToken: '0x6b175474e89094c44da98b954eedeac495271d0f',
      sourceTokenRate: 1,
      trade: {
        data: '0x',
        from: '0xe18035bf8712672935fdb4e5e431b1a0183d2dfc',
        to: '0x881D40237659C251811CEC9c364ef91dC08D300C',
        value: '0x0',
        gas: '0x61a80',
      },
    },
    [TEST_AGG_ID_BEST]: {
      aggregator: TEST_AGG_ID_BEST,
      aggType: 'AGG',
      approvalNeeded: null,
      averageGas: 411000,
      destinationAmount: '25000000000000000000',
      destinationToken: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      destinationTokenInfo: {
        address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        symbol: 'USDC',
        decimals: 18,
      },
      destinationTokenRate: 2.5,
      error: null,
      estimatedRefund: '343090',
      ethFee: '0.008',
      ethValueOfTokens: '0.125',
      fee: 1,
      fetchTime: 1003,
      gasEstimate: '411000',
      gasEstimateWithRefund: '380000',
      gasMultiplier: 1.2,
      hasRoute: true,
      maxGas: 1100000,
      metaMaskFeeInEth: '0.0015',
      overallValueOfQuote: '24.9905',
      priceSlippage: {
        bucket: 'medium',
        calculationError: '',
        destinationAmountInETH: 0.125,
        destinationAmountInNativeCurrency: 25,
        ratio: 0.98,
        sourceAmountInETH: 0.05,
        sourceAmountInNativeCurrency: 10,
        sourceAmountInUSD: 10,
        destinationAmountInUSD: 25,
      },
      quoteRefreshSeconds: 60,
      sourceAmount: '10000000000000000000',
      sourceToken: '0x6b175474e89094c44da98b954eedeac495271d0f',
      sourceTokenRate: 1,
      trade: {
        data: '0x',
        from: '0xe18035bf8712672935fdb4e5e431b1a0183d2dfc',
        to: '0x881D40237659C251811CEC9c364ef91dC08D300C',
        value: '0x0',
        gas: '0x61a80',
      },
      savings: {
        total: '0.005',
        performance: '0.003',
        fee: '0.002',
        metaMaskFee: '0.001',
        medianMetaMaskFee: '0.0012',
      },
    },
    [TEST_AGG_ID_2]: {
      aggregator: TEST_AGG_ID_2,
      aggType: 'AGG',
      approvalNeeded: null,
      averageGas: 197000,
      destinationAmount: '22000000000000000000',
      destinationToken: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      destinationTokenInfo: {
        address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        symbol: 'USDC',
        decimals: 18,
      },
      destinationTokenRate: 2.2,
      error: null,
      estimatedRefund: '18205',
      ethFee: '0.007',
      ethValueOfTokens: '0.11',
      fee: 1,
      fetchTime: 1354,
      gasEstimate: '197000',
      gasEstimateWithRefund: '190000',
      gasMultiplier: 1.15,
      hasRoute: true,
      maxGas: 368000,
      metaMaskFeeInEth: '0.00125',
      overallValueOfQuote: '21.99175',
      priceSlippage: {
        bucket: 'high',
        calculationError: '',
        destinationAmountInETH: 0.11,
        destinationAmountInNativeCurrency: 22,
        ratio: 0.99,
        sourceAmountInETH: 0.05,
        sourceAmountInNativeCurrency: 10,
        sourceAmountInUSD: 10,
        destinationAmountInUSD: 22,
      },
      quoteRefreshSeconds: 60,
      sourceAmount: '10000000000000000000',
      sourceToken: '0x6b175474e89094c44da98b954eedeac495271d0f',
      sourceTokenRate: 1,
      trade: {
        data: '0x',
        from: '0xe18035bf8712672935fdb4e5e431b1a0183d2dfc',
        to: '0x881D40237659C251811CEC9c364ef91dC08D300C',
        value: '0x0',
        gas: '0x61a80',
      },
    },
  };
}

function getTopQuoteAndSavingsMockQuotes(): Record<string, Quote> {
  // These destination amounts are calculated using the following "pre-fee" amounts
  // TEST_AGG_ID_1: 20.5
  // TEST_AGG_ID_2: 20.4
  // TEST_AGG_ID_3: 20.2
  // TEST_AGG_ID_4: 20
  // TEST_AGG_ID_5: 19.8
  // TEST_AGG_ID_6: 19.5

  return {
    [TEST_AGG_ID_1]: {
      aggregator: TEST_AGG_ID_1,
      approvalNeeded: null,
      gasEstimate: '0x186a0',
      destinationAmount: '20295000000000000000',
      destinationToken: '0x1111111111111111111111111111111111111111',
      destinationTokenInfo: {
        decimals: 18,
        address: '0xsomeERC20TokenAddress',
        symbol: 'FOO',
      },
      sourceAmount: '10000000000000000000',
      sourceToken: '0xsomeERC20TokenAddress',
      trade: {
        value: '0x0',
      },
      fee: 1,
    } as Quote,
    [TEST_AGG_ID_2]: {
      aggregator: TEST_AGG_ID_2,
      approvalNeeded: null,
      gasEstimate: '0x30d40',
      destinationAmount: '20196000000000000000',
      destinationToken: '0x1111111111111111111111111111111111111111',
      destinationTokenInfo: {
        decimals: 18,
        address: '0xsomeERC20TokenAddress',
        symbol: 'FOO',
      },
      sourceAmount: '10000000000000000000',
      sourceToken: '0xsomeERC20TokenAddress',
      trade: {
        value: '0x0',
      },
      fee: 1,
    } as Quote,
    [TEST_AGG_ID_3]: {
      aggregator: TEST_AGG_ID_3,
      approvalNeeded: null,
      gasEstimate: '0x493e0',
      destinationAmount: '19998000000000000000',
      destinationToken: '0x1111111111111111111111111111111111111111',
      destinationTokenInfo: {
        decimals: 18,
        address: '0xsomeERC20TokenAddress',
        symbol: 'FOO',
      },
      sourceAmount: '10000000000000000000',
      sourceToken: '0xsomeERC20TokenAddress',
      trade: {
        value: '0x0',
      },
      fee: 1,
    } as Quote,
    [TEST_AGG_ID_4]: {
      aggregator: TEST_AGG_ID_4,
      approvalNeeded: null,
      gasEstimate: '0x61a80',
      destinationAmount: '19800000000000000000',
      destinationToken: '0x1111111111111111111111111111111111111111',
      destinationTokenInfo: {
        decimals: 18,
        address: '0xsomeERC20TokenAddress',
        symbol: 'FOO',
      },
      sourceAmount: '10000000000000000000',
      sourceToken: '0xsomeERC20TokenAddress',
      trade: {
        value: '0x0',
      },
      fee: 1,
    } as Quote,
    [TEST_AGG_ID_5]: {
      aggregator: TEST_AGG_ID_5,
      approvalNeeded: null,
      gasEstimate: '0x7a120',
      destinationAmount: '19602000000000000000',
      destinationToken: '0x1111111111111111111111111111111111111111',
      destinationTokenInfo: {
        decimals: 18,
        address: '0xsomeERC20TokenAddress',
        symbol: 'FOO',
      },
      sourceAmount: '10000000000000000000',
      sourceToken: '0xsomeERC20TokenAddress',
      trade: {
        value: '0x0',
      },
      fee: 1,
    } as Quote,
    [TEST_AGG_ID_6]: {
      aggregator: TEST_AGG_ID_6,
      approvalNeeded: null,
      gasEstimate: '0x927c0',
      destinationAmount: '19305000000000000000',
      destinationToken: '0x1111111111111111111111111111111111111111',
      destinationTokenInfo: {
        decimals: 18,
        address: '0xsomeERC20TokenAddress',
        symbol: 'FOO',
      },
      sourceAmount: '10000000000000000000',
      sourceToken: '0xsomeERC20TokenAddress',
      trade: {
        value: '0x0',
      },
      fee: 1,
    } as Quote,
  };
}

function getTopQuoteAndSavingsBaseExpectedResults() {
  const baseTestInput = getTopQuoteAndSavingsMockQuotes();
  return {
    [TEST_AGG_ID_1]: {
      ...baseTestInput[TEST_AGG_ID_1],
      isBestQuote: true,
      ethFee: '0.25',
      overallValueOfQuote: '1.7795',
      metaMaskFeeInEth: '0.0205',
      ethValueOfTokens: '2.0295',
      savings: {
        total: '0.0191',
        performance: '0.0396',
        fee: '0',
        metaMaskFee: '0.0205',
        medianMetaMaskFee: '0.0201',
      },
    },
    [TEST_AGG_ID_2]: {
      ...baseTestInput[TEST_AGG_ID_2],
      ethFee: '0.25',
      overallValueOfQuote: '1.7696',
      metaMaskFeeInEth: '0.0204',
      ethValueOfTokens: '2.0196',
    },
    [TEST_AGG_ID_3]: {
      ...baseTestInput[TEST_AGG_ID_3],
      ethFee: '0.25',
      overallValueOfQuote: '1.7498',
      metaMaskFeeInEth: '0.0202',
      ethValueOfTokens: '1.9998',
    },
    [TEST_AGG_ID_4]: {
      ...baseTestInput[TEST_AGG_ID_4],
      ethFee: '0.25',
      overallValueOfQuote: '1.73',
      metaMaskFeeInEth: '0.02',
      ethValueOfTokens: '1.98',
    },
    [TEST_AGG_ID_5]: {
      ...baseTestInput[TEST_AGG_ID_5],
      ethFee: '0.25',
      overallValueOfQuote: '1.7102',
      metaMaskFeeInEth: '0.0198',
      ethValueOfTokens: '1.9602',
    },
    [TEST_AGG_ID_6]: {
      ...baseTestInput[TEST_AGG_ID_6],
      ethFee: '0.25',
      overallValueOfQuote: '1.6805',
      metaMaskFeeInEth: '0.0195',
      ethValueOfTokens: '1.9305',
    },
  };
}
