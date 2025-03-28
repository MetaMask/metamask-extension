import { ChainId } from '@metamask/bridge-controller';
import { flushPromises } from '../../../../test/lib/timer-helpers';
import { Numeric } from '../../../../shared/modules/Numeric';
import BridgeStatusController from './bridge-status-controller';
import { BridgeStatusControllerMessenger } from './types';
import { DEFAULT_BRIDGE_STATUS_STATE } from './constants';
import * as bridgeStatusUtils from './utils';
import {
  MockStatusResponse,
  MockTxHistory,
  getMockStartPollingForBridgeTxStatusArgs,
} from './mocks';

const EMPTY_INIT_STATE = {
  bridgeStatusState: { ...DEFAULT_BRIDGE_STATUS_STATE },
};

const getMessengerMock = ({
  account = '0xaccount1',
  srcChainId = 42161,
} = {}) =>
  ({
    call: jest.fn((method: string) => {
      if (method === 'AccountsController:getSelectedMultichainAccount') {
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
  const startPollingSpy = jest.spyOn(bridgeStatusController, 'startPolling');
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
    startPollingSpy,
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
        startPollingSpy,
        fetchBridgeTxStatusSpy,
      } = await executePollingWithPendingStatus();

      // Assertions
      expect(startPollingSpy).toHaveBeenCalledTimes(1);
      expect(fetchBridgeTxStatusSpy).toHaveBeenCalled();
      expect(bridgeStatusController.state.bridgeStatusState.txHistory).toEqual(
        MockTxHistory.getPending(),
      );
    });
    it('stops polling when the status response is complete', async () => {
      // Setup
      jest.useFakeTimers();
      jest
        .spyOn(Date, 'now')
        .mockImplementation(
          () =>
            MockTxHistory.getComplete().bridgeTxMetaId1.completionTime ?? 10,
        );
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

      jest.restoreAllMocks();
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
          if (method === 'AccountsController:getSelectedMultichainAccount') {
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
          txMetaId: 'bridgeTxMetaId2',
          srcTxHash: '0xsrcTxHash2',
          account: '0xaccount2',
        }),
      );
      jest.advanceTimersByTime(10_000);
      expect(fetchBridgeTxStatusSpy).toHaveBeenCalledTimes(2);

      // Check that both accounts have a tx history entry
      expect(
        bridgeStatusController.state.bridgeStatusState.txHistory,
      ).toHaveProperty('bridgeTxMetaId1');
      expect(
        bridgeStatusController.state.bridgeStatusState.txHistory,
      ).toHaveProperty('bridgeTxMetaId2');

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
          txMetaId: 'bridgeTxMetaId1',
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
          txMetaId: 'bridgeTxMetaId2',
          srcChainId: 10,
          destChainId: ChainId.SOLANA,
        }),
      );
      jest.advanceTimersByTime(10_000);
      expect(fetchBridgeTxStatusSpy).toHaveBeenCalledTimes(2);

      // Check we have a tx history entry for each chainId
      expect(
        bridgeStatusController.state.bridgeStatusState.txHistory.bridgeTxMetaId1
          .quote.srcChainId,
      ).toEqual(42161);
      expect(
        bridgeStatusController.state.bridgeStatusState.txHistory.bridgeTxMetaId1
          .quote.destChainId,
      ).toEqual(1);

      expect(
        bridgeStatusController.state.bridgeStatusState.txHistory.bridgeTxMetaId2
          .quote.srcChainId,
      ).toEqual(10);
      expect(
        bridgeStatusController.state.bridgeStatusState.txHistory.bridgeTxMetaId2
          .quote.destChainId,
      ).toEqual(1151111081099710);

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
          if (method === 'AccountsController:getSelectedMultichainAccount') {
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
          txMetaId: 'bridgeTxMetaId1',
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
          txMetaId: 'bridgeTxMetaId2',
          srcChainId: 10,
          destChainId: 137,
        }),
      );
      jest.advanceTimersByTime(10_000);
      expect(fetchBridgeTxStatusSpy).toHaveBeenCalledTimes(2);

      // Check we have a tx history entry for each chainId
      expect(
        bridgeStatusController.state.bridgeStatusState.txHistory.bridgeTxMetaId1
          .quote.srcChainId,
      ).toEqual(42161);
      expect(
        bridgeStatusController.state.bridgeStatusState.txHistory.bridgeTxMetaId1
          .quote.destChainId,
      ).toEqual(1);

      expect(
        bridgeStatusController.state.bridgeStatusState.txHistory.bridgeTxMetaId2
          .quote.srcChainId,
      ).toEqual(10);
      expect(
        bridgeStatusController.state.bridgeStatusState.txHistory.bridgeTxMetaId2
          .quote.destChainId,
      ).toEqual(137);

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
      expect(txHistoryItems[0].quote.destChainId).toEqual(137);
    });
  });
});
