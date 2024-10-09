/* eslint-disable @typescript-eslint/no-explicit-any */
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { createBridgeMockStore } from '../../../test/jest/mock-store';
import * as actions from '../../store/actions';
import * as selectors from '../../selectors';
import { submitBridgeTransaction } from './actions';
import { DummyQuotesNoApproval, DummyQuotesWithApproval } from './dummy-quotes';
import * as bridgeSelectors from './selectors';

jest.mock('../../store/actions', () => {
  const original = jest.requireActual('../../store/actions');
  return {
    ...original,
    addTransactionAndWaitForPublish: jest.fn(),
    addToken: jest.fn().mockImplementation(original.addToken),
    addNetwork: jest.fn().mockImplementation(original.addNetwork),
  };
});

jest.mock('./selectors', () => {
  const original = jest.requireActual('./selectors');
  return {
    ...original,
    getQuotes: jest.fn(),
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
    getNetworkConfigurationsByChainId: jest.fn(() => ({
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
            url: 'https://mainnet.infura.io/v3/infuraProjectId',
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
            url: 'https://arbitrum-mainnet.infura.io/v3/infuraProjectId',
          },
        ],
      },
    })),
  };
});

const middleware = [thunk];

const makeMockHistory = () => {
  return {
    push: jest.fn(),
  };
};

const makeMockStore = () => {
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
  return store;
};

describe('bridge/actions', () => {
  describe('submitBridgeTransaction', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('executes bridge transaction', async () => {
      // Setup
      const mockAddTransactionAndWaitForPublish = jest.fn(() => {
        return {
          id: 'txMetaId-01',
        };
      });

      (bridgeSelectors.getQuotes as jest.Mock).mockImplementation(
        () => DummyQuotesWithApproval.ETH_11_USDC_TO_ARB,
      );

      // For some reason, setBackgroundConnection does not work, gets hung up on the promise, so mock this way instead
      (actions.addTransactionAndWaitForPublish as jest.Mock).mockImplementation(
        mockAddTransactionAndWaitForPublish,
      );
      const store = makeMockStore();
      const history = makeMockHistory();

      // Execute
      await store.dispatch(submitBridgeTransaction(history as any) as any);

      // Assert
      expect(mockAddTransactionAndWaitForPublish).toHaveBeenLastCalledWith(
        {
          chainId: '0x1',
          data: '0x3ce33bff0000000000000000000000000000000000000000000000000000000000000080000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb480000000000000000000000000000000000000000000000000000000000a7d8c000000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000000d6c6966694164617074657256320000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001e0000000000000000000000000e397c4883ec89ed4fc9d258f00c689708b2799c9000000000000000000000000e397c4883ec89ed4fc9d258f00c689708b2799c9000000000000000000000000000000000000000000000000000000000000a4b1000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48000000000000000000000000af88d065e77c8cc2239327c5edb3a432268e58310000000000000000000000000000000000000000000000000000000000a660c6000000000000000000000000000000000000000000000000000000000000014000000000000000000000000000000000000000000000000000000000000177fa000000000000000000000000e6b738da243e8fa2a0ed5915645789add5de515200000000000000000000000000000000000000000000000000000000000000902340ab8fc3119af1d016a0eec5fe6ef47965741f6f7a4734bf784bf3ae3f2452a0b86991c6218b36c1d19d4a2e9eb0ce3606eb4800000000000000000000000000a660c60000a4b10008df3abdeb853d66fefedfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffd00dfeeddeadbeef8932eb23bad9bddb5cf81426f78279a53c6c3b7100000000000000000000000000000000740cfc1bc02079862368cb4eea1332bd9f2dfa925fc757fd51e40919859b87ca031a2a12d67e4ca4ba67d52b59114b3e18c1e8c839ae015112af82e92251db701b',
          from: '0xc5fe6ef47965741f6f7a4734bf784bf3ae3f2452',
          gas: '0x33403',
          gasLimit: '0x33403',
          maxFeePerGas: '34ff5da21',
          maxPriorityFeePerGas: '77359400',
          to: '0x0439e60F02a8900a951603950d8D4527f400C3f1',
          value: '0x00',
        },
        {
          requireApproval: false,
          swaps: {
            hasApproveTx: true,
            meta: {
              approvalTxId: 'txMetaId-01',
              destinationTokenAddress:
                '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
              destinationTokenDecimals: 6,
              destinationTokenSymbol: 'USDC',
              sourceTokenSymbol: 'USDC',
              swapTokenValue: '10.90375',
              type: 'bridge',
            },
          },
          type: 'bridge',
        },
      );
    });
    it('executes approval transaction if it exists', async () => {
      // Setup
      const mockAddTransactionAndWaitForPublish = jest.fn(() => {
        return {
          id: 'txMetaId-01',
        };
      });

      (bridgeSelectors.getQuotes as jest.Mock).mockImplementation(
        () => DummyQuotesWithApproval.ETH_11_USDC_TO_ARB,
      );

      // For some reason, setBackgroundConnection does not work, gets hung up on the promise, so mock this way instead
      (actions.addTransactionAndWaitForPublish as jest.Mock).mockImplementation(
        mockAddTransactionAndWaitForPublish,
      );
      const store = makeMockStore();
      const history = makeMockHistory();

      // Execute
      await store.dispatch(submitBridgeTransaction(history as any) as any);

      // Assert
      expect(mockAddTransactionAndWaitForPublish).toHaveBeenNthCalledWith(
        1,
        {
          chainId: '0x1',
          data: '0x095ea7b30000000000000000000000000439e60f02a8900a951603950d8d4527f400c3f10000000000000000000000000000000000000000000000000000000000a7d8c0',
          from: '0xc5fe6ef47965741f6f7a4734bf784bf3ae3f2452',
          gas: '0xdc1d',
          gasLimit: '0xdc1d',
          maxFeePerGas: '34ff5da21',
          maxPriorityFeePerGas: '77359400',
          to: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          value: '0x00',
        },
        {
          requireApproval: false,
          swaps: {
            hasApproveTx: true,
            meta: { sourceTokenSymbol: 'USDC', type: 'bridgeApproval' },
          },
          type: 'bridgeApproval',
        },
      );
      expect(mockAddTransactionAndWaitForPublish).toHaveBeenNthCalledWith(
        2,
        {
          chainId: '0x1',
          data: '0x3ce33bff0000000000000000000000000000000000000000000000000000000000000080000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb480000000000000000000000000000000000000000000000000000000000a7d8c000000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000000d6c6966694164617074657256320000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001e0000000000000000000000000e397c4883ec89ed4fc9d258f00c689708b2799c9000000000000000000000000e397c4883ec89ed4fc9d258f00c689708b2799c9000000000000000000000000000000000000000000000000000000000000a4b1000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48000000000000000000000000af88d065e77c8cc2239327c5edb3a432268e58310000000000000000000000000000000000000000000000000000000000a660c6000000000000000000000000000000000000000000000000000000000000014000000000000000000000000000000000000000000000000000000000000177fa000000000000000000000000e6b738da243e8fa2a0ed5915645789add5de515200000000000000000000000000000000000000000000000000000000000000902340ab8fc3119af1d016a0eec5fe6ef47965741f6f7a4734bf784bf3ae3f2452a0b86991c6218b36c1d19d4a2e9eb0ce3606eb4800000000000000000000000000a660c60000a4b10008df3abdeb853d66fefedfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffd00dfeeddeadbeef8932eb23bad9bddb5cf81426f78279a53c6c3b7100000000000000000000000000000000740cfc1bc02079862368cb4eea1332bd9f2dfa925fc757fd51e40919859b87ca031a2a12d67e4ca4ba67d52b59114b3e18c1e8c839ae015112af82e92251db701b',
          from: '0xc5fe6ef47965741f6f7a4734bf784bf3ae3f2452',
          gas: '0x33403',
          gasLimit: '0x33403',
          maxFeePerGas: '34ff5da21',
          maxPriorityFeePerGas: '77359400',
          to: '0x0439e60F02a8900a951603950d8D4527f400C3f1',
          value: '0x00',
        },
        {
          requireApproval: false,
          swaps: {
            hasApproveTx: true,
            meta: {
              approvalTxId: 'txMetaId-01',
              destinationTokenAddress:
                '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
              destinationTokenDecimals: 6,
              destinationTokenSymbol: 'USDC',
              sourceTokenSymbol: 'USDC',
              swapTokenValue: '10.90375',
              type: 'bridge',
            },
          },
          type: 'bridge',
        },
      );
    });
    it('adds source token if it not the native gas token', async () => {
      // Setup
      const store = makeMockStore();
      const history = makeMockHistory();

      (bridgeSelectors.getQuotes as jest.Mock).mockImplementation(
        () => DummyQuotesWithApproval.ETH_11_USDC_TO_ARB,
      );
      (actions.addToken as jest.Mock).mockImplementation(
        () => async () => ({}),
      );

      // Execute
      await store.dispatch(submitBridgeTransaction(history as any) as any);

      // Assert
      expect(actions.addToken).toHaveBeenCalledWith({
        address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        decimals: 6,
        image:
          'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png',
        networkClientId: 'mainnet',
        symbol: 'USDC',
      });

      // Reset
      const originalAddToken = jest.requireActual(
        '../../store/actions',
      ).addToken;
      (actions.addToken as jest.Mock).mockImplementation(originalAddToken);
    });
    it('does not add source token if source token is native gas token', async () => {
      // Setup
      const store = makeMockStore();
      const history = makeMockHistory();

      const mockAddTransactionAndWaitForPublish = jest.fn(() => {
        return {
          id: 'txMetaId-01',
        };
      });
      // For some reason, setBackgroundConnection does not work, gets hung up on the promise, so mock this way instead
      (actions.addTransactionAndWaitForPublish as jest.Mock).mockImplementation(
        mockAddTransactionAndWaitForPublish,
      );
      (bridgeSelectors.getQuotes as jest.Mock).mockImplementation(
        () => DummyQuotesNoApproval.OP_0_005_ETH_TO_ARB,
      );
      (actions.addToken as jest.Mock).mockImplementation(
        () => async () => ({}),
      );

      // Execute
      await store.dispatch(submitBridgeTransaction(history as any) as any);

      // Assert
      expect(actions.addToken).not.toHaveBeenCalled();

      // Reset
      const originalAddToken = jest.requireActual(
        '../../store/actions',
      ).addToken;
      (actions.addToken as jest.Mock).mockImplementation(originalAddToken);
    });
    it('adds dest token if it not the native gas token', async () => {
      // Setup
      const store = makeMockStore();
      const history = makeMockHistory();

      (bridgeSelectors.getQuotes as jest.Mock).mockImplementation(
        () => DummyQuotesWithApproval.ETH_11_USDC_TO_ARB,
      );
      (actions.addToken as jest.Mock).mockImplementation(
        () => async () => ({}),
      );

      // Execute
      await store.dispatch(submitBridgeTransaction(history as any) as any);

      // Assert
      expect(actions.addToken).toHaveBeenCalledWith({
        address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
        decimals: 6,
        image:
          'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png',
        networkClientId: '3725601d-f497-43aa-9afa-97c26e9033a3',
        symbol: 'USDC',
      });

      // Reset
      const originalAddToken = jest.requireActual(
        '../../store/actions',
      ).addToken;
      (actions.addToken as jest.Mock).mockImplementation(originalAddToken);
    });
    it('does not add dest token if dest token is native gas token', async () => {
      // Setup
      const store = makeMockStore();
      const history = makeMockHistory();

      const mockAddTransactionAndWaitForPublish = jest.fn(() => {
        return {
          id: 'txMetaId-01',
        };
      });
      // For some reason, setBackgroundConnection does not work, gets hung up on the promise, so mock this way instead
      (actions.addTransactionAndWaitForPublish as jest.Mock).mockImplementation(
        mockAddTransactionAndWaitForPublish,
      );
      (bridgeSelectors.getQuotes as jest.Mock).mockImplementation(
        () => DummyQuotesNoApproval.OP_0_005_ETH_TO_ARB,
      );
      (actions.addToken as jest.Mock).mockImplementation(
        () => async () => ({}),
      );

      // Execute
      await store.dispatch(submitBridgeTransaction(history as any) as any);

      // Assert
      expect(actions.addToken).not.toHaveBeenCalled();

      // Reset
      const originalAddToken = jest.requireActual(
        '../../store/actions',
      ).addToken;
      (actions.addToken as jest.Mock).mockImplementation(originalAddToken);
    });
    it('adds dest network if it does not exist', async () => {
      // Setup
      const store = makeMockStore();
      const history = makeMockHistory();

      const mockAddTransactionAndWaitForPublish = jest.fn(() => {
        return {
          id: 'txMetaId-01',
        };
      });
      // For some reason, setBackgroundConnection does not work, gets hung up on the promise, so mock this way instead
      (actions.addTransactionAndWaitForPublish as jest.Mock).mockImplementation(
        mockAddTransactionAndWaitForPublish,
      );

      (bridgeSelectors.getQuotes as jest.Mock).mockImplementation(
        () => DummyQuotesWithApproval.ETH_11_USDC_TO_ARB,
      );
      (
        selectors.getNetworkConfigurationsByChainId as jest.Mock
      ).mockImplementation(() => ({
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
              url: 'https://mainnet.infura.io/v3/infuraProjectId',
            },
          ],
        },
      }));
      (actions.addNetwork as jest.Mock).mockImplementation(() => async () => ({
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
            url: 'https://arbitrum-mainnet.infura.io/v3/infuraProjectId',
          },
        ],
      }));

      // Execute
      await store.dispatch(submitBridgeTransaction(history as any) as any);

      // Assert
      expect(actions.addNetwork).toHaveBeenCalledWith({
        blockExplorerUrls: ['https://explorer.arbitrum.io'],
        chainId: '0xa4b1',
        defaultBlockExplorerUrlIndex: 0,
        defaultRpcEndpointIndex: 0,
        name: 'Arbitrum One',
        nativeCurrency: 'ETH',
        rpcEndpoints: [
          {
            type: 'custom',
            url: 'https://arbitrum-mainnet.infura.io/v3/undefined',
          },
        ],
      });
    });
    it('routes to activity tab', async () => {
      const store = makeMockStore();
      const history = makeMockHistory();

      // Execute
      await store.dispatch(submitBridgeTransaction(history as any) as any);

      // Assert
      expect(history.push).toHaveBeenCalledWith('/');
    });
  });
});
