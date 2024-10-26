import nock from 'nock';
import { flushPromises } from '../../../../test/lib/timer-helpers';
import { ChainId } from '../../../../ui/pages/bridge/types';
import BridgeStatusController from './bridge-status-controller';
import {
  ActionTypes,
  BridgeId,
  BridgeStatusControllerMessenger,
  StatusTypes,
} from './types';
import { DEFAULT_BRIDGE_STATUS_CONTROLLER_STATE } from './constants';
import * as bridgeStatusUtils from './utils';

const EMPTY_INIT_STATE = {
  bridgeStatusState: DEFAULT_BRIDGE_STATUS_CONTROLLER_STATE,
};

const MOCK_QUOTE = {
  requestId: '197c402f-cb96-4096-9f8c-54aed84ca776',
  srcChainId: 42161,
  srcTokenAmount: '991250000000000',
  srcAsset: {
    address: '0x0000000000000000000000000000000000000000',
    chainId: 42161,
    symbol: 'ETH',
    decimals: 18,
    name: 'ETH',
    coinKey: 'ETH',
    logoURI:
      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
    priceUSD: '2478.7',
    icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
  },
  destChainId: 10,
  destTokenAmount: '990654755978612',
  destAsset: {
    address: '0x0000000000000000000000000000000000000000',
    chainId: 10,
    symbol: 'ETH',
    decimals: 18,
    name: 'ETH',
    coinKey: 'ETH',
    logoURI:
      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
    priceUSD: '2478.63',
    icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
  },
  feeData: {
    metabridge: {
      amount: '8750000000000',
      asset: {
        address: '0x0000000000000000000000000000000000000000',
        chainId: 42161,
        symbol: 'ETH',
        decimals: 18,
        name: 'ETH',
        coinKey: 'ETH',
        logoURI:
          'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
        priceUSD: '2478.7',
        icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
      },
    },
  },
  bridgeId: 'lifi',
  bridges: ['across'],
  steps: [
    {
      action: 'bridge' as ActionTypes,
      srcChainId: 42161,
      destChainId: 10,
      protocol: {
        name: 'across',
        displayName: 'Across',
        icon: 'https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/bridges/acrossv2.png',
      },
      srcAsset: {
        address: '0x0000000000000000000000000000000000000000',
        chainId: 42161,
        symbol: 'ETH',
        decimals: 18,
        name: 'ETH',
        coinKey: 'ETH',
        logoURI:
          'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
        priceUSD: '2478.7',
        icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
      },
      destAsset: {
        address: '0x0000000000000000000000000000000000000000',
        chainId: 10,
        symbol: 'ETH',
        decimals: 18,
        name: 'ETH',
        coinKey: 'ETH',
        logoURI:
          'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
        priceUSD: '2478.63',
        icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
      },
      srcAmount: '991250000000000',
      destAmount: '990654755978612',
    },
  ],
};

const MOCK_FETCH_BRIDGE_TX_STATUS_ARGS = {
  statusRequest: {
    bridgeId: 'lifi',
    srcTxHash:
      '0x8e6f70c0cf42dcb39f51b10a2a69611c74fa6a98a7091f5ee8a82996497093e7',
    bridge: 'across',
    srcChainId: 42161,
    destChainId: 10,
    quote: MOCK_QUOTE,
    refuel: false,
  },
  quoteResponse: {
    quote: MOCK_QUOTE,
    trade: {
      chainId: 42161,
      to: '0x23981fC34e69eeDFE2BD9a0a9fCb0719Fe09DbFC',
      from: '0xc5fe6ef47965741f6f7a4734bf784bf3ae3f2452',
      value: '0x038d7ea4c68000',
      data: '0x3ce33bff0000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000038d7ea4c6800000000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000000d6c6966694164617074657256320000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001c0000000000000000000000000e397c4883ec89ed4fc9d258f00c689708b2799c9000000000000000000000000e397c4883ec89ed4fc9d258f00c689708b2799c9000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000038589602234000000000000000000000000000000000000000000000000000000000000000140000000000000000000000000000000000000000000000000000007f544a44c0000000000000000000000000056ca675c3633cc16bd6849e2b431d4e8de5e23bf000000000000000000000000000000000000000000000000000000000000006c5a39b10a4f4f0747826140d2c5fe6ef47965741f6f7a4734bf784bf3ae3f24520000000a000222266cc2dca0671d2a17ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffd00dfeeddeadbeef8932eb23bad9bddb5cf81426f78279a53c6c3b7100000000000000000000000000000000000000009ce3c510b3f58edc8d53ae708056e30926f62d0b42d5c9b61c391bb4e8a2c1917f8ed995169ffad0d79af2590303e83c57e15a9e0b248679849556c2e03a1c811b',
      gasLimit: 282915,
    },
    approval: null,
    estimatedProcessingTimeInSeconds: 15,
  },
  startTime: 1729964825189,
  slippagePercentage: 0,
  pricingData: undefined,
  initialDestAssetBalance: undefined,
  targetContractAddress: '0x23981fC34e69eeDFE2BD9a0a9fCb0719Fe09DbFC',
};

const MockStatusResponse = {
  Pending: {
    status: 'PENDING' as StatusTypes,
    srcChain: {
      chainId: 10,
      txHash:
        '0x8e6f70c0cf42dcb39f51b10a2a69611c74fa6a98a7091f5ee8a82996497093e7',
      amount: '991250000000000',
      token: {
        address: '0x0000000000000000000000000000000000000000',
        chainId: 10,
        symbol: 'ETH',
        decimals: 18,
        name: 'ETH',
        coinKey: 'ETH',
        logoURI:
          'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
        priceUSD: '2518.47',
        icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
      },
    },
    destChain: {
      chainId: 42161 as ChainId,
      token: {},
    },
  },
  Complete: {
    status: 'COMPLETE' as StatusTypes,
    isExpectedToken: true,
    bridge: 'across' as BridgeId,
    srcChain: {
      chainId: 42161 as ChainId,
      txHash:
        '0x8e6f70c0cf42dcb39f51b10a2a69611c74fa6a98a7091f5ee8a82996497093e7',
      amount: '991250000000000',
      token: {
        address: '0x0000000000000000000000000000000000000000',
        chainId: 42161 as ChainId,
        symbol: 'ETH',
        decimals: 18,
        name: 'ETH',
        coinKey: 'ETH',
        logoURI:
          'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
        priceUSD: '2478.7',
        icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
      },
    },
    destChain: {
      chainId: 10 as ChainId,
      txHash:
        '0xf30740c374e1e9331ef27c69c054d862244641665c97e82c58ef1e434d115590',
      amount: '990654755978611',
      token: {
        address: '0x0000000000000000000000000000000000000000',
        chainId: 10 as ChainId,
        symbol: 'ETH',
        decimals: 18,
        name: 'ETH',
        coinKey: 'ETH',
        logoURI:
          'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
        priceUSD: '2478.63',
        icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
      },
    },
  },
};

const MockTxHistory = {
  Init: {
    '0x8e6f70c0cf42dcb39f51b10a2a69611c74fa6a98a7091f5ee8a82996497093e7': {
      quote: MOCK_QUOTE,
      startTime: 1729964825189,
      estimatedProcessingTimeInSeconds: 15,
      slippagePercentage: 0,
      account: '0xc5fe6ef47965741f6f7a4734bf784bf3ae3f2452',
      targetContractAddress: '0x23981fC34e69eeDFE2BD9a0a9fCb0719Fe09DbFC',
    },
  },
  Pending: {
    '0x8e6f70c0cf42dcb39f51b10a2a69611c74fa6a98a7091f5ee8a82996497093e7': {
      quote: MOCK_QUOTE,
      startTime: 1729964825189,
      estimatedProcessingTimeInSeconds: 15,
      slippagePercentage: 0,
      account: '0xc5fe6ef47965741f6f7a4734bf784bf3ae3f2452',
      status: MockStatusResponse.Pending,
      targetContractAddress: '0x23981fC34e69eeDFE2BD9a0a9fCb0719Fe09DbFC',
    },
  },
  Complete: {
    '0x8e6f70c0cf42dcb39f51b10a2a69611c74fa6a98a7091f5ee8a82996497093e7': {
      quote: MOCK_QUOTE,
      startTime: 1729964825189,
      estimatedProcessingTimeInSeconds: 15,
      slippagePercentage: 0,
      account: '0xc5fe6ef47965741f6f7a4734bf784bf3ae3f2452',
      status: MockStatusResponse.Complete,
      targetContractAddress: '0x23981fC34e69eeDFE2BD9a0a9fCb0719Fe09DbFC',
    },
  },
};

const messengerMock = {
  call: jest.fn((method: string) => {
    if (method === 'AccountsController:getSelectedAccount') {
      return { address: '0xc5fe6ef47965741f6f7a4734bf784bf3ae3f2452' };
    } else if (method === 'NetworkController:findNetworkClientIdByChainId') {
      return 'networkClientId';
    }
    return null;
  }),
  publish: jest.fn(),
  registerActionHandler: jest.fn(),
  registerInitialEventPayload: jest.fn(),
} as unknown as jest.Mocked<BridgeStatusControllerMessenger>;

describe('BridgeStatusController', () => {
  describe('constructor', () => {
    it('should setup correctly', () => {
      const bridgeStatusController = new BridgeStatusController({
        messenger: messengerMock,
      });
      expect(bridgeStatusController.state).toEqual(EMPTY_INIT_STATE);
    });
  });
  describe('startPollingForBridgeTxStatus', () => {
    it('sets the inital tx history state', async () => {
      // Setup
      const bridgeStatusController = new BridgeStatusController({
        messenger: messengerMock,
      });

      // Execution
      await bridgeStatusController.startPollingForBridgeTxStatus(
        MOCK_FETCH_BRIDGE_TX_STATUS_ARGS,
      );

      // Assertion
      expect(bridgeStatusController.state.bridgeStatusState.txHistory).toEqual(
        MockTxHistory.Init,
      );
    });
    it('starts polling and updates the tx history when the status response is received', async () => {
      // Setup
      jest.useFakeTimers();
      const bridgeStatusController = new BridgeStatusController({
        messenger: messengerMock,
      });
      const startPollingByNetworkClientIdSpy = jest.spyOn(
        bridgeStatusController,
        'startPollingByNetworkClientId',
      );
      const fetchBridgeTxStatusSpy = jest.spyOn(
        bridgeStatusUtils,
        'fetchBridgeTxStatus',
      );

      // Execution
      await bridgeStatusController.startPollingForBridgeTxStatus(
        MOCK_FETCH_BRIDGE_TX_STATUS_ARGS,
      );
      fetchBridgeTxStatusSpy.mockImplementationOnce(async () => {
        return MockStatusResponse.Pending;
      });
      jest.advanceTimersByTime(10000);
      await flushPromises();

      // Assertions
      expect(startPollingByNetworkClientIdSpy).toHaveBeenCalledTimes(1);
      expect(fetchBridgeTxStatusSpy).toHaveBeenCalledTimes(1);
      expect(bridgeStatusController.state.bridgeStatusState.txHistory).toEqual(
        MockTxHistory.Pending,
      );
    });
    it('stops polling when the status response is complete', async () => {
      // Setup
      jest.useFakeTimers();
      const bridgeStatusController = new BridgeStatusController({
        messenger: messengerMock,
      });
      const fetchBridgeTxStatusSpy = jest.spyOn(
        bridgeStatusUtils,
        'fetchBridgeTxStatus',
      );
      const stopPollingByNetworkClientIdSpy = jest.spyOn(
        bridgeStatusController,
        'stopPollingByPollingToken',
      );

      // Execution
      await bridgeStatusController.startPollingForBridgeTxStatus(
        MOCK_FETCH_BRIDGE_TX_STATUS_ARGS,
      );
      fetchBridgeTxStatusSpy.mockImplementationOnce(async () => {
        return MockStatusResponse.Complete;
      });
      jest.advanceTimersByTime(10000);
      await flushPromises();

      // Assertions
      expect(stopPollingByNetworkClientIdSpy).toHaveBeenCalledTimes(1);
      expect(bridgeStatusController.state.bridgeStatusState.txHistory).toEqual(
        MockTxHistory.Complete,
      );
    });
  });
  describe('resetState', () => {
    it.todo('resets the state');
  });
  describe('wipeBridgeStatus', () => {
    it.todo('wipes the bridge status');
  });
});
