import nock from 'nock';
import { BRIDGE_API_BASE_URL } from '../../../../shared/constants/bridge';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { SWAPS_API_V2_BASE_URL } from '../../../../shared/constants/swaps';
import { flushPromises } from '../../../../test/lib/timer-helpers';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import * as bridgeUtil from '../../../../ui/pages/bridge/bridge.util';
import BridgeController from './bridge-controller';
import { BridgeControllerMessenger } from './types';
import { DEFAULT_BRIDGE_CONTROLLER_STATE } from './constants';

const EMPTY_INIT_STATE = {
  bridgeState: DEFAULT_BRIDGE_CONTROLLER_STATE,
};

const messengerMock = {
  call: jest.fn(),
  registerActionHandler: jest.fn(),
  registerInitialEventPayload: jest.fn(),
  publish: jest.fn(),
} as unknown as jest.Mocked<BridgeControllerMessenger>;

describe('BridgeController', function () {
  let bridgeController: BridgeController;

  beforeAll(function () {
    bridgeController = new BridgeController({ messenger: messengerMock });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();

    nock(BRIDGE_API_BASE_URL)
      .get('/getAllFeatureFlags')
      .reply(200, {
        'extension-config': {
          refreshRate: 3,
          maxRefreshCount: 1,
        },
        'extension-support': true,
        'src-network-allowlist': [10, 534352],
        'dest-network-allowlist': [137, 42161],
      });
    nock(BRIDGE_API_BASE_URL)
      .get('/getTokens?chainId=10')
      .reply(200, [
        {
          address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
          symbol: 'ABC',
          decimals: 16,
        },
        {
          address: '0x1291478912',
          symbol: 'DEF',
          decimals: 16,
        },
      ]);
    nock(SWAPS_API_V2_BASE_URL)
      .get('/networks/10/topAssets')
      .reply(200, [
        {
          address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
          symbol: 'ABC',
        },
      ]);
    bridgeController.resetState();
  });

  it('constructor should setup correctly', function () {
    expect(bridgeController.state).toStrictEqual(EMPTY_INIT_STATE);
  });

  it('setBridgeFeatureFlags should fetch and set the bridge feature flags', async function () {
    const expectedFeatureFlagsResponse = {
      extensionSupport: true,
      destNetworkAllowlist: [CHAIN_IDS.POLYGON, CHAIN_IDS.ARBITRUM],
      srcNetworkAllowlist: [CHAIN_IDS.OPTIMISM, CHAIN_IDS.SCROLL],
      extensionConfig: {
        maxRefreshCount: 1,
        refreshRate: 3,
      },
    };
    expect(bridgeController.state).toStrictEqual(EMPTY_INIT_STATE);

    const setIntervalLengthSpy = jest.spyOn(
      bridgeController,
      'setIntervalLength',
    );

    await bridgeController.setBridgeFeatureFlags();
    expect(bridgeController.state.bridgeState.bridgeFeatureFlags).toStrictEqual(
      expectedFeatureFlagsResponse,
    );
    expect(setIntervalLengthSpy).toHaveBeenCalledTimes(1);
    expect(setIntervalLengthSpy).toHaveBeenCalledWith(3);

    bridgeController.resetState();
    expect(bridgeController.state.bridgeState).toStrictEqual(
      expect.objectContaining({
        bridgeFeatureFlags: expectedFeatureFlagsResponse,
        quotes: DEFAULT_BRIDGE_CONTROLLER_STATE.quotes,
        quotesLastFetched: DEFAULT_BRIDGE_CONTROLLER_STATE.quotesLastFetched,
        quotesLoadingStatus:
          DEFAULT_BRIDGE_CONTROLLER_STATE.quotesLoadingStatus,
      }),
    );
  });

  it('selectDestNetwork should set the bridge dest tokens and top assets', async function () {
    await bridgeController.selectDestNetwork('0xa');
    expect(bridgeController.state.bridgeState.destTokens).toStrictEqual({
      '0x0000000000000000000000000000000000000000': {
        address: '0x0000000000000000000000000000000000000000',
        decimals: 18,
        iconUrl: './images/eth_logo.svg',
        name: 'Ether',
        symbol: 'ETH',
      },
      '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984': {
        address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
        symbol: 'ABC',
        decimals: 16,
      },
    });
    expect(bridgeController.state.bridgeState.destTopAssets).toStrictEqual([
      { address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', symbol: 'ABC' },
    ]);
    expect(bridgeController.state.bridgeState.quoteRequest).toStrictEqual({
      slippage: 0.5,
      srcTokenAddress: '0x0000000000000000000000000000000000000000',
      walletAddress: undefined,
    });
  });

  it('selectSrcNetwork should set the bridge src tokens and top assets', async function () {
    await bridgeController.selectSrcNetwork('0xa');
    expect(bridgeController.state.bridgeState.srcTokens).toStrictEqual({
      '0x0000000000000000000000000000000000000000': {
        address: '0x0000000000000000000000000000000000000000',
        decimals: 18,
        iconUrl: './images/eth_logo.svg',
        name: 'Ether',
        symbol: 'ETH',
      },
      '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984': {
        address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
        symbol: 'ABC',
        decimals: 16,
      },
    });
    expect(bridgeController.state.bridgeState.srcTopAssets).toStrictEqual([
      {
        address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
        symbol: 'ABC',
      },
    ]);
    expect(bridgeController.state.bridgeState.quoteRequest).toStrictEqual({
      slippage: 0.5,
      srcTokenAddress: '0x0000000000000000000000000000000000000000',
      walletAddress: undefined,
    });
  });

  it('updateBridgeQuoteRequestParams should update the quoteRequest state', function () {
    bridgeController.updateBridgeQuoteRequestParams({ srcChainId: 1 });
    expect(bridgeController.state.bridgeState.quoteRequest).toStrictEqual({
      srcChainId: 1,
      slippage: 0.5,
      srcTokenAddress: '0x0000000000000000000000000000000000000000',
      walletAddress: undefined,
    });

    bridgeController.updateBridgeQuoteRequestParams({ destChainId: 10 });
    expect(bridgeController.state.bridgeState.quoteRequest).toStrictEqual({
      destChainId: 10,
      slippage: 0.5,
      srcTokenAddress: '0x0000000000000000000000000000000000000000',
      walletAddress: undefined,
    });

    bridgeController.updateBridgeQuoteRequestParams({ destChainId: undefined });
    expect(bridgeController.state.bridgeState.quoteRequest).toStrictEqual({
      destChainId: undefined,
      slippage: 0.5,
      srcTokenAddress: '0x0000000000000000000000000000000000000000',
      walletAddress: undefined,
    });

    bridgeController.updateBridgeQuoteRequestParams({
      srcTokenAddress: undefined,
    });
    expect(bridgeController.state.bridgeState.quoteRequest).toStrictEqual({
      slippage: 0.5,
      srcTokenAddress: undefined,
      walletAddress: undefined,
    });

    bridgeController.updateBridgeQuoteRequestParams({
      srcTokenAmount: '100000',
      destTokenAddress: '0x123',
      slippage: 0.5,
      srcTokenAddress: '0x0000000000000000000000000000000000000000',
      walletAddress: undefined,
    });
    expect(bridgeController.state.bridgeState.quoteRequest).toStrictEqual({
      srcTokenAmount: '100000',
      destTokenAddress: '0x123',
      slippage: 0.5,
      srcTokenAddress: '0x0000000000000000000000000000000000000000',
      walletAddress: undefined,
    });

    bridgeController.updateBridgeQuoteRequestParams({
      srcTokenAddress: '0x2ABC',
    });
    expect(bridgeController.state.bridgeState.quoteRequest).toStrictEqual({
      slippage: 0.5,
      srcTokenAddress: '0x2ABC',
      walletAddress: undefined,
    });

    bridgeController.resetState();
    expect(bridgeController.state.bridgeState.quoteRequest).toStrictEqual({
      slippage: 0.5,
      srcTokenAddress: '0x0000000000000000000000000000000000000000',
      walletAddress: undefined,
    });
  });

  it('updateBridgeQuoteRequestParams should trigger quote polling if request is valid', async function () {
    jest.useFakeTimers();
    const stopAllPollingSpy = jest.spyOn(bridgeController, 'stopAllPolling');
    const startPollingByNetworkClientIdSpy = jest.spyOn(
      bridgeController,
      'startPollingByNetworkClientId',
    );
    messengerMock.call.mockReturnValue({ address: '0x123' } as never);

    const fetchBridgeQuotesSpy = jest
      .spyOn(bridgeUtil, 'fetchBridgeQuotes')
      .mockImplementationOnce(async () => {
        return await new Promise((resolve) => {
          return setTimeout(() => {
            resolve([1, 2, 3] as never);
          }, 5000);
        });
      });

    fetchBridgeQuotesSpy.mockImplementationOnce(async () => {
      return await new Promise((resolve) => {
        return setTimeout(() => {
          resolve([5, 6, 7] as never);
        }, 10000);
      });
    });

    fetchBridgeQuotesSpy.mockImplementationOnce(async () => {
      return await new Promise((_, reject) => {
        return setTimeout(() => {
          reject(new Error('Network error'));
        }, 10000);
      });
    });

    const quoteParams = {
      srcChainId: 1,
      destChainId: 10,
      srcTokenAddress: '0x0000000000000000000000000000000000000000',
      destTokenAddress: '0x123',
      srcTokenAmount: '1000000000000000000',
    };
    const quoteRequest = {
      ...quoteParams,
      slippage: 0.5,
      walletAddress: '0x123',
    };
    bridgeController.updateBridgeQuoteRequestParams(quoteParams);

    expect(stopAllPollingSpy).toHaveBeenCalledTimes(1);
    expect(startPollingByNetworkClientIdSpy).toHaveBeenCalledTimes(1);
    expect(startPollingByNetworkClientIdSpy).toHaveBeenCalledWith(
      '1',
      quoteRequest,
    );

    expect(bridgeController.state.bridgeState).toStrictEqual(
      expect.objectContaining({
        quoteRequest: { ...quoteRequest, walletAddress: undefined },
        quotes: DEFAULT_BRIDGE_CONTROLLER_STATE.quotes,
        quotesLastFetched: DEFAULT_BRIDGE_CONTROLLER_STATE.quotesLastFetched,
        quotesLoadingStatus:
          DEFAULT_BRIDGE_CONTROLLER_STATE.quotesLoadingStatus,
      }),
    );

    // Loading state
    jest.advanceTimersByTime(1000);
    await flushPromises();
    expect(fetchBridgeQuotesSpy).toHaveBeenCalledTimes(1);
    expect(fetchBridgeQuotesSpy).toHaveBeenCalledWith(quoteRequest);

    const firstFetchTime =
      bridgeController.state.bridgeState.quotesLastFetched ?? 0;
    expect(firstFetchTime).toBeGreaterThan(0);
    expect(bridgeController.state.bridgeState).toEqual(
      expect.objectContaining({
        quoteRequest: { ...quoteRequest, walletAddress: undefined },
        quotes: [],
        quotesLoadingStatus: 0,
      }),
    );

    // After first fetch
    jest.advanceTimersByTime(10000);
    await flushPromises();
    expect(bridgeController.state.bridgeState).toEqual(
      expect.objectContaining({
        quoteRequest: { ...quoteRequest, walletAddress: undefined },
        quotes: [1, 2, 3],
        quotesLoadingStatus: 1,
      }),
    );
    expect(bridgeController.state.bridgeState.quotesLastFetched).toStrictEqual(
      firstFetchTime,
    );

    // After 2nd fetch
    jest.advanceTimersByTime(50000);
    await flushPromises();
    expect(fetchBridgeQuotesSpy).toHaveBeenCalledTimes(2);
    expect(bridgeController.state.bridgeState).toEqual(
      expect.objectContaining({
        quoteRequest: { ...quoteRequest, walletAddress: undefined },
        quotes: [5, 6, 7],
        quotesLoadingStatus: 1,
      }),
    );
    const secondFetchTime =
      bridgeController.state.bridgeState.quotesLastFetched;
    expect(secondFetchTime).toBeGreaterThan(firstFetchTime);

    // After 3nd fetch throws an error
    jest.advanceTimersByTime(50000);
    await flushPromises();
    expect(fetchBridgeQuotesSpy).toHaveBeenCalledTimes(3);
    expect(bridgeController.state.bridgeState).toEqual(
      expect.objectContaining({
        quoteRequest: { ...quoteRequest, walletAddress: undefined },
        quotes: [5, 6, 7],
        quotesLoadingStatus: 2,
      }),
    );
    expect(bridgeController.state.bridgeState.quotesLastFetched).toStrictEqual(
      secondFetchTime,
    );
  });

  it('updateBridgeQuoteRequestParams should not trigger quote polling if request is invalid', function () {
    const stopAllPollingSpy = jest.spyOn(bridgeController, 'stopAllPolling');
    const startPollingByNetworkClientIdSpy = jest.spyOn(
      bridgeController,
      'startPollingByNetworkClientId',
    );
    messengerMock.call.mockReturnValueOnce({ address: '0x123' } as never);

    bridgeController.updateBridgeQuoteRequestParams({
      srcChainId: 1,
      destChainId: 10,
      srcTokenAddress: '0x0000000000000000000000000000000000000000',
      destTokenAddress: '0x123',
    });

    expect(stopAllPollingSpy).toHaveBeenCalledTimes(1);
    expect(startPollingByNetworkClientIdSpy).not.toHaveBeenCalled();

    expect(bridgeController.state.bridgeState).toStrictEqual(
      expect.objectContaining({
        quoteRequest: {
          srcChainId: 1,
          slippage: 0.5,
          srcTokenAddress: '0x0000000000000000000000000000000000000000',
          walletAddress: undefined,
          destChainId: 10,
          destTokenAddress: '0x123',
        },
        quotes: DEFAULT_BRIDGE_CONTROLLER_STATE.quotes,
        quotesLastFetched: DEFAULT_BRIDGE_CONTROLLER_STATE.quotesLastFetched,
        quotesLoadingStatus:
          DEFAULT_BRIDGE_CONTROLLER_STATE.quotesLoadingStatus,
      }),
    );
  });
});
