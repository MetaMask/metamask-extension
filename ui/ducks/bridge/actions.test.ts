/* eslint-disable @typescript-eslint/no-explicit-any */
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { createBridgeMockStore } from '../../../test/jest/mock-store';
import * as actions from '../../store/actions';
import { submitBridgeTransaction } from './actions';

jest.mock('../../store/actions', () => {
  const original = jest.requireActual('../../store/actions');
  return {
    ...original,
    addTransactionAndWaitForPublish: jest.fn(),
  };
});

jest.mock('./dummy-quotes', () => {
  const original = jest.requireActual('./dummy-quotes');
  return {
    DUMMY_QUOTES_APPROVAL: original.eth11UsdcToArb,
  };
});
jest.mock('../../selectors', () => {
  const original = jest.requireActual('../../selectors');
  return {
    ...original,
    getIsBridgeEnabled: () => true,
    getIsBridgeChain: () => true,
    checkNetworkAndAccountSupports1559: () => true,
    getSelectedNetworkClientId: () => 'mainnet',
    getNetworkConfigurationsByChainId: () => ({
      '0x1': {
        blockExplorerUrls: ['https://etherscan.io'],
        chainId: '0x1',
        defaultBlockExplorerUrlIndex: 0,
        defaultRpcEndpointIndex: 0,
        name: 'Ethereum Mainnet',
        nativeCurrency: 'ETH',
        rpcEndpoints: [
          {
            networkClientId: 'mainnet',
            type: 'infura',
            url: 'https://mainnet.infura.io/v3/{infuraProjectId}',
          },
        ],
      },
      '0xa4b1': {
        blockExplorerUrls: ['https://explorer.arbitrum.io'],
        chainId: '0xa4b1',
        defaultBlockExplorerUrlIndex: 0,
        defaultRpcEndpointIndex: 0,
        name: 'Arbitrum One',
        nativeCurrency: 'ETH',
        rpcEndpoints: [
          {
            networkClientId: '3725601d-f497-43aa-9afa-97c26e9033a3',
            type: 'custom',
            url: 'https://arbitrum-mainnet.infura.io/v3/05412cce7f71411d93cc724545806fd3',
          },
        ],
      },
    }),
  };
});

const middleware = [thunk];

const makeMockHistory = () => {
  return {
    push: jest.fn(),
  };
};

describe('bridge/actions', () => {
  describe('submitBridgeTransaction', () => {
    it('executes bridge transaction', async () => {
      // Setup
      const mockAddTransactionAndWaitForPublish = jest.fn(() => {
        console.log('mockAddTransactionAndWaitForPublish');
        return {
          id: 'txMetaId-01',
        };
      });

      // For some reason, setBackgroundConnection does not work, gets hung up on the promise, so mock this way instead
      (actions.addTransactionAndWaitForPublish as jest.Mock).mockImplementation(
        mockAddTransactionAndWaitForPublish,
      );
      const store = configureMockStore<any>(middleware)(
        createBridgeMockStore(
          {
            approvalGasMultiplier: {
              '0x1': 1,
            },
            bridgeGasMultiplier: {
              '0x1': 1,
            },
          },
          {},
          {},
          {
            gasFeeEstimates: {
              high: {
                maxWaitTimeEstimate: 30000,
                minWaitTimeEstimate: 15000,
                suggestedMaxFeePerGas: '14.226414113',
                suggestedMaxPriorityFeePerGas: '2',
              },
            },
            useExternalServices: true,
          },
        ),
      );
      const history = makeMockHistory();

      // Execute
      await store.dispatch(submitBridgeTransaction(history as any) as any);

      // Assert
      expect(mockAddTransactionAndWaitForPublish).toHaveBeenCalled();
    });
    it.todo('executes approval transaction if it exists');
    it.todo('adds source token if it does not exist');
    it.todo('adds dest token if it does not exist');
    it.todo('adds network if it does not exist');
    it.todo('routes to activity tab');
  });
});
