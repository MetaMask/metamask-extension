import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderHook } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import { MemoryRouter, useHistory } from 'react-router-dom';
import { createBridgeMockStore } from '../../../../test/data/bridge/mock-bridge-store';
import * as bridgeStatusActions from '../../../ducks/bridge-status/actions';
import {
  DummyQuotesNoApproval,
  DummyQuotesWithApproval,
} from '../../../../test/data/bridge/dummy-quotes';
import useSubmitBridgeTransaction from './useSubmitBridgeTransaction';

jest.mock('react-router-dom', () => {
  const original = jest.requireActual('react-router-dom');
  return {
    ...original,
    useHistory: jest.fn().mockImplementation(original.useHistory),
  };
});

jest.mock('../../../ducks/bridge/utils', () => ({
  ...jest.requireActual('../../../ducks/bridge/utils'),
  getTxGasEstimates: jest.fn(() => ({
    baseAndPriorityFeePerGas: '0',
    maxFeePerGas: '0x1036640',
    maxPriorityFeePerGas: '0x0',
  })),
}));

jest.mock('../../../store/actions', () => {
  const original = jest.requireActual('../../../store/actions');
  return {
    ...original,
    addTransaction: jest.fn(),
    addTransactionAndWaitForPublish: jest.fn(),
    addToken: jest.fn().mockImplementation(original.addToken),
    addNetwork: jest.fn().mockImplementation(original.addNetwork),
  };
});

jest.mock('../../../../shared/modules/selectors/networks', () => {
  const original = jest.requireActual(
    '../../../../shared/modules/selectors/networks',
  );
  return {
    ...original,
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

jest.mock('../../../selectors', () => {
  const original = jest.requireActual('../../../selectors');
  return {
    ...original,
    getIsBridgeEnabled: () => true,
    getIsBridgeChain: () => true,
    checkNetworkAndAccountSupports1559: () => true,
  };
});

const middleware = [thunk];

const makeMockStore = () => {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const store = configureMockStore<any>(middleware)(
    createBridgeMockStore({
      metamaskStateOverrides: {
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
    }),
  );
  return store;
};

const makeWrapper =
  (store: ReturnType<typeof makeMockStore>) =>
  ({ children }: { children: React.ReactNode }) => {
    return (
      <Provider store={store}>
        <MemoryRouter>{children}</MemoryRouter>
      </Provider>
    );
  };

describe('ui/pages/bridge/hooks/useSubmitBridgeTransaction', () => {
  describe('submitBridgeTransaction', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('executes bridge transaction', async () => {
      const submitTx = jest.spyOn(bridgeStatusActions, 'submitBridgeTx');
      const store = makeMockStore();
      const { result } = renderHook(() => useSubmitBridgeTransaction(), {
        wrapper: makeWrapper(store),
      });

      // Execute
      await result.current.submitBridgeTransaction(
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        DummyQuotesWithApproval.ETH_11_USDC_TO_ARB[0] as any,
      );

      // Assert
      expect(submitTx.mock.calls).toMatchSnapshot();
    });

    it('executes bridge transaction with no approval', async () => {
      const submitTx = jest.spyOn(bridgeStatusActions, 'submitBridgeTx');
      const store = makeMockStore();
      const { result } = renderHook(() => useSubmitBridgeTransaction(), {
        wrapper: makeWrapper(store),
      });

      // Execute
      await result.current.submitBridgeTransaction(
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        DummyQuotesNoApproval.OP_0_005_ETH_TO_ARB[0] as any,
      );

      // Assert
      expect(submitTx.mock.calls).toMatchSnapshot();
    });

    it('routes to activity tab', async () => {
      const store = makeMockStore();

      const mockHistory = {
        push: jest.fn(),
      };
      (useHistory as jest.Mock).mockImplementationOnce(() => mockHistory);
      const { result } = renderHook(() => useSubmitBridgeTransaction(), {
        wrapper: makeWrapper(store),
      });

      // Execute
      await result.current.submitBridgeTransaction(
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        DummyQuotesWithApproval.ETH_11_USDC_TO_ARB[0] as any,
      );

      // Assert
      expect(mockHistory.push).toHaveBeenCalledWith({
        pathname: '/',
        state: { stayOnHomePage: true },
      });
    });
  });
});
