import { flushPromises } from '../../../../test/lib/timer-helpers';
import { Numeric } from '../../../../shared/modules/Numeric';
import {
  StatusTypes,
  ActionTypes,
  BridgeId,
} from '../../../../shared/types/bridge-status';
import BridgeStatusController from './bridge-status-controller';
import { BridgeStatusControllerMessenger } from './types';
import { DEFAULT_BRIDGE_STATUS_CONTROLLER_STATE } from './constants';
import * as bridgeStatusUtils from './utils';

const EMPTY_INIT_STATE = {
  bridgeStatusState: DEFAULT_BRIDGE_STATUS_CONTROLLER_STATE,
};

const getMockQuote = ({ srcChainId = 42161, destChainId = 10 } = {}) => ({
  requestId: '197c402f-cb96-4096-9f8c-54aed84ca776',
  srcChainId,
  srcTokenAmount: '991250000000000',
  srcAsset: {
    address: '0x0000000000000000000000000000000000000000',
    chainId: srcChainId,
    symbol: 'ETH',
    decimals: 18,
    name: 'ETH',
    coinKey: 'ETH',
    logoURI:
      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
    priceUSD: '2478.7',
    icon: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
  },
  destChainId,
  destTokenAmount: '990654755978612',
  destAsset: {
    address: '0x0000000000000000000000000000000000000000',
    chainId: destChainId,
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
        chainId: srcChainId,
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
      srcChainId,
      destChainId,
      protocol: {
        name: 'across',
        displayName: 'Across',
        icon: 'https://raw.githubusercontent.com/lifinance/types/main/src/assets/icons/bridges/acrossv2.png',
      },
      srcAsset: {
        address: '0x0000000000000000000000000000000000000000',
        chainId: srcChainId,
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
        chainId: destChainId,
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
});

const getMockStartPollingForBridgeTxStatusArgs = ({
  srcTxHash = '0xsrcTxHash1',
  account = '0xaccount1',
  srcChainId = 42161,
  destChainId = 10,
} = {}) => ({
  statusRequest: {
    bridgeId: 'lifi',
    srcTxHash,
    bridge: 'across',
    srcChainId,
    destChainId,
    quote: getMockQuote({ srcChainId, destChainId }),
    refuel: false,
  },
  quoteResponse: {
    quote: getMockQuote({ srcChainId, destChainId }),
    trade: {
      chainId: srcChainId,
      to: '0x23981fC34e69eeDFE2BD9a0a9fCb0719Fe09DbFC',
      from: account,
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
});

const MockStatusResponse = {
  getPending: ({
    srcTxHash = '0xsrcTxHash1',
    srcChainId = 42161,
    destChainId = 10,
  } = {}) => ({
    status: 'PENDING' as StatusTypes,
    srcChain: {
      chainId: srcChainId,
      txHash: srcTxHash,
      amount: '991250000000000',
      token: {
        address: '0x0000000000000000000000000000000000000000',
        chainId: srcChainId,
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
      chainId: destChainId,
      token: {},
    },
  }),
  getComplete: ({
    srcTxHash = '0xsrcTxHash1',
    destTxHash = '0xdestTxHash1',
    srcChainId = 42161,
    destChainId = 10,
  } = {}) => ({
    status: 'COMPLETE' as StatusTypes,
    isExpectedToken: true,
    bridge: 'across' as BridgeId,
    srcChain: {
      chainId: srcChainId,
      txHash: srcTxHash,
      amount: '991250000000000',
      token: {
        address: '0x0000000000000000000000000000000000000000',
        chainId: srcChainId,
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
      chainId: destChainId,
      txHash: destTxHash,
      amount: '990654755978611',
      token: {
        address: '0x0000000000000000000000000000000000000000',
        chainId: destChainId,
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
  }),
};

const MockTxHistory = {
  getInit: ({
    srcTxHash = '0xsrcTxHash1',
    account = '0xaccount1',
    srcChainId = 42161,
    destChainId = 10,
  } = {}) => ({
    [srcTxHash]: {
      quote: getMockQuote({ srcChainId, destChainId }),
      startTime: 1729964825189,
      estimatedProcessingTimeInSeconds: 15,
      slippagePercentage: 0,
      account,
      targetContractAddress: '0x23981fC34e69eeDFE2BD9a0a9fCb0719Fe09DbFC',
    },
  }),
  getPending: ({
    srcTxHash = '0xsrcTxHash1',
    account = '0xaccount1',
    srcChainId = 42161,
    destChainId = 10,
  } = {}) => ({
    [srcTxHash]: {
      quote: getMockQuote({ srcChainId, destChainId }),
      startTime: 1729964825189,
      estimatedProcessingTimeInSeconds: 15,
      slippagePercentage: 0,
      account,
      status: MockStatusResponse.getPending({
        srcTxHash,
        srcChainId,
      }),
      targetContractAddress: '0x23981fC34e69eeDFE2BD9a0a9fCb0719Fe09DbFC',
    },
  }),
  getComplete: ({
    srcTxHash = '0xsrcTxHash1',
    account = '0xaccount1',
    srcChainId = 42161,
    destChainId = 10,
  } = {}) => ({
    [srcTxHash]: {
      quote: getMockQuote({ srcChainId, destChainId }),
      startTime: 1729964825189,
      estimatedProcessingTimeInSeconds: 15,
      slippagePercentage: 0,
      account,
      status: MockStatusResponse.getComplete({ srcTxHash }),
      targetContractAddress: '0x23981fC34e69eeDFE2BD9a0a9fCb0719Fe09DbFC',
    },
  }),
};

const getMessengerMock = ({
  account = '0xaccount1',
  srcChainId = 42161,
} = {}) =>
  ({
    call: jest.fn((method: string) => {
      if (method === 'AccountsController:getSelectedAccount') {
        return { address: account };
      } else if (method === 'NetworkController:findNetworkClientIdByChainId') {
        return 'networkClientId';
      } else if (method === 'NetworkController:getState') {
        return { selectedNetworkClientId: 'networkClientId' };
      } else if (method === 'NetworkController:getNetworkClientById') {
        return {
          configuration: {
            chainId: new Numeric(srcChainId, 10).toPrefixedHexString(),
          },
        };
      }
      return null;
    }),
    publish: jest.fn(),
    registerActionHandler: jest.fn(),
    registerInitialEventPayload: jest.fn(),
  } as unknown as jest.Mocked<BridgeStatusControllerMessenger>);

const executePollingWithPendingStatus = async () => {
  // Setup
  jest.useFakeTimers();
  const bridgeStatusController = new BridgeStatusController({
    messenger: getMessengerMock(),
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
    getMockStartPollingForBridgeTxStatusArgs(),
  );
  fetchBridgeTxStatusSpy.mockImplementationOnce(async () => {
    return MockStatusResponse.getPending();
  });
  jest.advanceTimersByTime(10000);
  await flushPromises();

  return {
    bridgeStatusController,
    startPollingByNetworkClientIdSpy,
    fetchBridgeTxStatusSpy,
  };
};

describe('BridgeStatusController', () => {
  describe('constructor', () => {
    it('should setup correctly', () => {
      const bridgeStatusController = new BridgeStatusController({
        messenger: getMessengerMock(),
      });
      expect(bridgeStatusController.state).toEqual(EMPTY_INIT_STATE);
    });
    it('rehydrates the tx history state', async () => {
      // Setup
      const bridgeStatusController = new BridgeStatusController({
        messenger: getMessengerMock(),
        state: {
          bridgeStatusState: {
            txHistory: MockTxHistory.getPending(),
          },
        },
      });

      // Execution
      await bridgeStatusController.startPollingForBridgeTxStatus(
        getMockStartPollingForBridgeTxStatusArgs(),
      );

      // Assertion
      expect(
        bridgeStatusController.state.bridgeStatusState.txHistory,
      ).toMatchSnapshot();
    });
    it('restarts polling for history items that are not complete', async () => {
      // Setup
      jest.useFakeTimers();
      const fetchBridgeTxStatusSpy = jest.spyOn(
        bridgeStatusUtils,
        'fetchBridgeTxStatus',
      );

      // Execution
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const bridgeStatusController = new BridgeStatusController({
        messenger: getMessengerMock(),
        state: {
          bridgeStatusState: {
            txHistory: MockTxHistory.getPending(),
          },
        },
      });
      jest.advanceTimersByTime(10000);
      await flushPromises();

      // Assertions
      expect(fetchBridgeTxStatusSpy).toHaveBeenCalledTimes(1);
    });
  });
  describe('startPollingForBridgeTxStatus', () => {
    it('sets the inital tx history state', async () => {
      // Setup
      const bridgeStatusController = new BridgeStatusController({
        messenger: getMessengerMock(),
      });

      // Execution
      await bridgeStatusController.startPollingForBridgeTxStatus(
        getMockStartPollingForBridgeTxStatusArgs(),
      );

      // Assertion
      expect(
        bridgeStatusController.state.bridgeStatusState.txHistory,
      ).toMatchSnapshot();
    });
    it('starts polling and updates the tx history when the status response is received', async () => {
      const {
        bridgeStatusController,
        startPollingByNetworkClientIdSpy,
        fetchBridgeTxStatusSpy,
      } = await executePollingWithPendingStatus();

      // Assertions
      expect(startPollingByNetworkClientIdSpy).toHaveBeenCalledTimes(1);
      expect(fetchBridgeTxStatusSpy).toHaveBeenCalled();
      expect(bridgeStatusController.state.bridgeStatusState.txHistory).toEqual(
        MockTxHistory.getPending(),
      );
    });
    it('stops polling when the status response is complete', async () => {
      // Setup
      jest.useFakeTimers();
      const bridgeStatusController = new BridgeStatusController({
        messenger: getMessengerMock(),
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
        getMockStartPollingForBridgeTxStatusArgs(),
      );
      fetchBridgeTxStatusSpy.mockImplementationOnce(async () => {
        return MockStatusResponse.getComplete();
      });
      jest.advanceTimersByTime(10000);
      await flushPromises();

      // Assertions
      expect(stopPollingByNetworkClientIdSpy).toHaveBeenCalledTimes(1);
      expect(bridgeStatusController.state.bridgeStatusState.txHistory).toEqual(
        MockTxHistory.getComplete(),
      );
    });
  });
  describe('resetState', () => {
    it('resets the state', async () => {
      const { bridgeStatusController } =
        await executePollingWithPendingStatus();

      expect(bridgeStatusController.state.bridgeStatusState.txHistory).toEqual(
        MockTxHistory.getPending(),
      );
      bridgeStatusController.resetState();
      expect(bridgeStatusController.state.bridgeStatusState.txHistory).toEqual(
        EMPTY_INIT_STATE.bridgeStatusState.txHistory,
      );
    });
  });
  describe('wipeBridgeStatus', () => {
    it('wipes the bridge status for the given address', async () => {
      // Setup
      jest.useFakeTimers();

      let getSelectedAccountCalledTimes = 0;
      const messengerMock = {
        call: jest.fn((method: string) => {
          if (method === 'AccountsController:getSelectedAccount') {
            let account;
            if (getSelectedAccountCalledTimes === 0) {
              account = '0xaccount1';
            } else {
              account = '0xaccount2';
            }
            getSelectedAccountCalledTimes += 1;
            return { address: account };
          } else if (
            method === 'NetworkController:findNetworkClientIdByChainId'
          ) {
            return 'networkClientId';
          } else if (method === 'NetworkController:getState') {
            return { selectedNetworkClientId: 'networkClientId' };
          } else if (method === 'NetworkController:getNetworkClientById') {
            return {
              configuration: {
                chainId: new Numeric(42161, 10).toPrefixedHexString(),
              },
            };
          }
          return null;
        }),
        publish: jest.fn(),
        registerActionHandler: jest.fn(),
        registerInitialEventPayload: jest.fn(),
      } as unknown as jest.Mocked<BridgeStatusControllerMessenger>;
      const bridgeStatusController = new BridgeStatusController({
        messenger: messengerMock,
      });
      const fetchBridgeTxStatusSpy = jest
        .spyOn(bridgeStatusUtils, 'fetchBridgeTxStatus')
        .mockImplementationOnce(async () => {
          return MockStatusResponse.getComplete();
        })
        .mockImplementationOnce(async () => {
          return MockStatusResponse.getComplete({
            srcTxHash: '0xsrcTxHash2',
            destTxHash: '0xdestTxHash2',
          });
        });

      // Start polling for 0xaccount1
      bridgeStatusController.startPollingForBridgeTxStatus(
        getMockStartPollingForBridgeTxStatusArgs(),
      );
      jest.advanceTimersByTime(10_000);
      expect(fetchBridgeTxStatusSpy).toHaveBeenCalledTimes(1);

      // Start polling for 0xaccount2
      bridgeStatusController.startPollingForBridgeTxStatus(
        getMockStartPollingForBridgeTxStatusArgs({
          srcTxHash: '0xsrcTxHash2',
          account: '0xaccount2',
        }),
      );
      jest.advanceTimersByTime(10_000);
      expect(fetchBridgeTxStatusSpy).toHaveBeenCalledTimes(2);

      // Check that both accounts have a tx history entry
      expect(
        bridgeStatusController.state.bridgeStatusState.txHistory,
      ).toHaveProperty('0xsrcTxHash1');
      expect(
        bridgeStatusController.state.bridgeStatusState.txHistory,
      ).toHaveProperty('0xsrcTxHash2');

      // Wipe the status for 1 account only
      bridgeStatusController.wipeBridgeStatus({
        address: '0xaccount1',
        ignoreNetwork: false,
      });

      // Assertions
      const txHistoryItems = Object.values(
        bridgeStatusController.state.bridgeStatusState.txHistory,
      );
      expect(txHistoryItems).toHaveLength(1);
      expect(txHistoryItems[0].account).toEqual('0xaccount2');
    });
    it('wipes the bridge status for all networks if ignoreNetwork is true', () => {
      // Setup
      jest.useFakeTimers();
      const messengerMock = {
        call: jest.fn((method: string) => {
          if (method === 'AccountsController:getSelectedAccount') {
            return { address: '0xaccount1' };
          } else if (
            method === 'NetworkController:findNetworkClientIdByChainId'
          ) {
            return 'networkClientId';
          } else if (method === 'NetworkController:getState') {
            return { selectedNetworkClientId: 'networkClientId' };
          } else if (method === 'NetworkController:getNetworkClientById') {
            return {
              configuration: {
                chainId: new Numeric(42161, 10).toPrefixedHexString(),
              },
            };
          }
          return null;
        }),
        publish: jest.fn(),
        registerActionHandler: jest.fn(),
        registerInitialEventPayload: jest.fn(),
      } as unknown as jest.Mocked<BridgeStatusControllerMessenger>;
      const bridgeStatusController = new BridgeStatusController({
        messenger: messengerMock,
      });
      const fetchBridgeTxStatusSpy = jest
        .spyOn(bridgeStatusUtils, 'fetchBridgeTxStatus')
        .mockImplementationOnce(async () => {
          return MockStatusResponse.getComplete();
        })
        .mockImplementationOnce(async () => {
          return MockStatusResponse.getComplete({
            srcTxHash: '0xsrcTxHash2',
          });
        });

      // Start polling for chainId 42161 to chainId 1
      bridgeStatusController.startPollingForBridgeTxStatus(
        getMockStartPollingForBridgeTxStatusArgs({
          account: '0xaccount1',
          srcTxHash: '0xsrcTxHash1',
          srcChainId: 42161,
          destChainId: 1,
        }),
      );
      jest.advanceTimersByTime(10_000);
      expect(fetchBridgeTxStatusSpy).toHaveBeenCalledTimes(1);

      // Start polling for chainId 10 to chainId 123
      bridgeStatusController.startPollingForBridgeTxStatus(
        getMockStartPollingForBridgeTxStatusArgs({
          account: '0xaccount1',
          srcTxHash: '0xsrcTxHash2',
          srcChainId: 10,
          destChainId: 123,
        }),
      );
      jest.advanceTimersByTime(10_000);
      expect(fetchBridgeTxStatusSpy).toHaveBeenCalledTimes(2);

      // Check we have a tx history entry for each chainId
      expect(
        bridgeStatusController.state.bridgeStatusState.txHistory['0xsrcTxHash1']
          .quote.srcChainId,
      ).toEqual(42161);
      expect(
        bridgeStatusController.state.bridgeStatusState.txHistory['0xsrcTxHash1']
          .quote.destChainId,
      ).toEqual(1);

      expect(
        bridgeStatusController.state.bridgeStatusState.txHistory['0xsrcTxHash2']
          .quote.srcChainId,
      ).toEqual(10);
      expect(
        bridgeStatusController.state.bridgeStatusState.txHistory['0xsrcTxHash2']
          .quote.destChainId,
      ).toEqual(123);

      bridgeStatusController.wipeBridgeStatus({
        address: '0xaccount1',
        ignoreNetwork: true,
      });

      // Assertions
      const txHistoryItems = Object.values(
        bridgeStatusController.state.bridgeStatusState.txHistory,
      );
      expect(txHistoryItems).toHaveLength(0);
    });
    it('wipes the bridge status only for the current network if ignoreNetwork is false', () => {
      // Setup
      jest.useFakeTimers();
      const messengerMock = {
        call: jest.fn((method: string) => {
          if (method === 'AccountsController:getSelectedAccount') {
            return { address: '0xaccount1' };
          } else if (
            method === 'NetworkController:findNetworkClientIdByChainId'
          ) {
            return 'networkClientId';
          } else if (method === 'NetworkController:getState') {
            return { selectedNetworkClientId: 'networkClientId' };
          } else if (method === 'NetworkController:getNetworkClientById') {
            return {
              configuration: {
                // This is what controls the selectedNetwork and what gets wiped in this test
                chainId: new Numeric(42161, 10).toPrefixedHexString(),
              },
            };
          }
          return null;
        }),
        publish: jest.fn(),
        registerActionHandler: jest.fn(),
        registerInitialEventPayload: jest.fn(),
      } as unknown as jest.Mocked<BridgeStatusControllerMessenger>;
      const bridgeStatusController = new BridgeStatusController({
        messenger: messengerMock,
      });
      const fetchBridgeTxStatusSpy = jest
        .spyOn(bridgeStatusUtils, 'fetchBridgeTxStatus')
        .mockImplementationOnce(async () => {
          return MockStatusResponse.getComplete();
        })
        .mockImplementationOnce(async () => {
          return MockStatusResponse.getComplete({
            srcTxHash: '0xsrcTxHash2',
          });
        });

      // Start polling for chainId 42161 to chainId 1
      bridgeStatusController.startPollingForBridgeTxStatus(
        getMockStartPollingForBridgeTxStatusArgs({
          account: '0xaccount1',
          srcTxHash: '0xsrcTxHash1',
          srcChainId: 42161,
          destChainId: 1,
        }),
      );
      jest.advanceTimersByTime(10_000);
      expect(fetchBridgeTxStatusSpy).toHaveBeenCalledTimes(1);

      // Start polling for chainId 10 to chainId 123
      bridgeStatusController.startPollingForBridgeTxStatus(
        getMockStartPollingForBridgeTxStatusArgs({
          account: '0xaccount1',
          srcTxHash: '0xsrcTxHash2',
          srcChainId: 10,
          destChainId: 123,
        }),
      );
      jest.advanceTimersByTime(10_000);
      expect(fetchBridgeTxStatusSpy).toHaveBeenCalledTimes(2);

      // Check we have a tx history entry for each chainId
      expect(
        bridgeStatusController.state.bridgeStatusState.txHistory['0xsrcTxHash1']
          .quote.srcChainId,
      ).toEqual(42161);
      expect(
        bridgeStatusController.state.bridgeStatusState.txHistory['0xsrcTxHash1']
          .quote.destChainId,
      ).toEqual(1);

      expect(
        bridgeStatusController.state.bridgeStatusState.txHistory['0xsrcTxHash2']
          .quote.srcChainId,
      ).toEqual(10);
      expect(
        bridgeStatusController.state.bridgeStatusState.txHistory['0xsrcTxHash2']
          .quote.destChainId,
      ).toEqual(123);

      bridgeStatusController.wipeBridgeStatus({
        address: '0xaccount1',
        ignoreNetwork: false,
      });

      // Assertions
      const txHistoryItems = Object.values(
        bridgeStatusController.state.bridgeStatusState.txHistory,
      );
      expect(txHistoryItems).toHaveLength(1);
      expect(txHistoryItems[0].quote.srcChainId).toEqual(10);
      expect(txHistoryItems[0].quote.destChainId).toEqual(123);
    });
  });
});
