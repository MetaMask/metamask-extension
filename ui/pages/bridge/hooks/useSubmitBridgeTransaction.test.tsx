import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderHook } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { createBridgeMockStore } from '../../../../test/data/bridge/mock-bridge-store';
import * as bridgeStatusActions from '../../../ducks/bridge-status/actions';
import {
  DummyQuotesNoApproval,
  DummyQuotesWithApproval,
} from '../../../../test/data/bridge/dummy-quotes';
import {
  AWAITING_SIGNATURES_ROUTE,
  CROSS_CHAIN_SWAP_ROUTE,
  DEFAULT_ROUTE,
} from '../../../helpers/constants/routes';
import * as sharedSelectors from '../../../../shared/modules/selectors';
import { setBackgroundConnection } from '../../../store/background-connection';
import useSubmitBridgeTransaction from './useSubmitBridgeTransaction';

const mockUseNavigate = jest.fn();
jest.mock('react-router-dom', () => {
  return {
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockUseNavigate,
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
        name: 'Ethereum',
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
        name: 'Arbitrum',
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

jest.mock('../../../../shared/modules/selectors', () => {
  const original = jest.requireActual('../../../../shared/modules/selectors');
  return {
    ...original,
    isHardwareWallet: jest.fn(() => false),
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

const submitTxSpy = jest.spyOn(bridgeStatusActions, 'submitBridgeTx');
const submitIntentSpy = jest.spyOn(bridgeStatusActions, 'submitBridgeIntent');
const isHardwareWalletSpy = sharedSelectors.isHardwareWallet as jest.Mock;

setBackgroundConnection({
  submitTx: submitTxSpy,
  submitIntent: submitIntentSpy,
  getStatePatches: jest.fn(),
  setEnabledAllPopularNetworks: jest.fn(),
} as never);

describe('ui/pages/bridge/hooks/useSubmitBridgeTransaction', () => {
  describe('submitBridgeTransaction', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      isHardwareWalletSpy.mockImplementation(() => false);
    });

    it('executes bridge transaction', async () => {
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
      expect(submitTxSpy.mock.calls).toMatchSnapshot();
    });

    it('executes bridge transaction with no approval', async () => {
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
      expect(submitTxSpy.mock.calls).toMatchSnapshot();
    });

    it('routes to activity tab', async () => {
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
      expect(mockUseNavigate).toHaveBeenCalledWith(
        `${DEFAULT_ROUTE}?tab=activity`,
        {
          replace: true,
          state: { stayOnHomePage: true },
        },
      );
    });

    it('routes to awaiting signatures with requestId for hardware wallets', async () => {
      (sharedSelectors.isHardwareWallet as jest.Mock).mockReturnValue(true);
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

      const {
        quote: { requestId },
      } = DummyQuotesWithApproval.ETH_11_USDC_TO_ARB[0];
      expect(mockUseNavigate).toHaveBeenCalledWith(
        `${CROSS_CHAIN_SWAP_ROUTE}${AWAITING_SIGNATURES_ROUTE}?requestId=${encodeURIComponent(
          requestId,
        )}`,
      );
    });

    it('submits intent quotes via submitBridgeIntent', async () => {
      const store = makeMockStore();
      submitIntentSpy.mockReturnValueOnce((async () => undefined) as never);
      const { result } = renderHook(() => useSubmitBridgeTransaction(), {
        wrapper: makeWrapper(store),
      });

      const quoteWithIntent = {
        ...DummyQuotesWithApproval.ETH_11_USDC_TO_ARB[0],
        quote: {
          ...DummyQuotesWithApproval.ETH_11_USDC_TO_ARB[0].quote,
          intent: {
            order: {},
          },
        },
      };

      await result.current.submitBridgeTransaction(
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        quoteWithIntent as any,
      );

      expect(submitIntentSpy).toHaveBeenCalledWith({
        quoteResponse: quoteWithIntent,
        accountAddress: expect.any(String),
      });
      expect(submitTxSpy).not.toHaveBeenCalled();
      expect(mockUseNavigate).toHaveBeenCalledWith(
        `${DEFAULT_ROUTE}?tab=activity`,
        {
          replace: true,
          state: { stayOnHomePage: true },
        },
      );
    });

    it('navigates to awaiting signatures for hardware-wallet intent quotes', async () => {
      const store = makeMockStore();
      isHardwareWalletSpy.mockImplementation(() => true);
      submitIntentSpy.mockReturnValueOnce((async () => undefined) as never);
      const { result } = renderHook(() => useSubmitBridgeTransaction(), {
        wrapper: makeWrapper(store),
      });

      const quoteWithIntent = {
        ...DummyQuotesWithApproval.ETH_11_USDC_TO_ARB[0],
        quote: {
          ...DummyQuotesWithApproval.ETH_11_USDC_TO_ARB[0].quote,
          intent: {
            order: {},
          },
        },
      };

      await result.current.submitBridgeTransaction(
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        quoteWithIntent as any,
      );

      const {
        quote: { requestId },
      } = quoteWithIntent;

      expect(mockUseNavigate).toHaveBeenCalledWith(
        `${CROSS_CHAIN_SWAP_ROUTE}${AWAITING_SIGNATURES_ROUTE}?requestId=${encodeURIComponent(
          requestId,
        )}`,
      );
      expect(mockUseNavigate).not.toHaveBeenCalledWith(
        `${DEFAULT_ROUTE}?tab=activity`,
        expect.anything(),
      );
    });
  });
});
