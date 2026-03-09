import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderHook } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { act } from '@testing-library/react';
import {
  createBridgeMockStore,
  MOCK_LEDGER_ACCOUNT,
} from '../../../../test/data/bridge/mock-bridge-store';
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
import * as bridgeStatusActions from '../../../ducks/bridge-status/actions';
import { setBackgroundConnection } from '../../../store/background-connection';
import { HardwareWalletProvider } from '../../../contexts/hardware-wallets';
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

const mockEnsureDeviceReady = jest.fn().mockResolvedValue(true);
jest.mock('../../../contexts/hardware-wallets/HardwareWalletContext', () => {
  return {
    ...jest.requireActual(
      '../../../contexts/hardware-wallets/HardwareWalletContext',
    ),
    useHardwareWalletActions: () => ({
      ensureDeviceReady: () => mockEnsureDeviceReady(),
    }),
  };
});

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
  return {
    getIsSmartTransaction: jest.fn(() => false),
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

const makeMockStore = (
  stateOverrides?: Partial<Parameters<typeof createBridgeMockStore>[0]>,
) => {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return configureMockStore<any>(middleware)(
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
        ...(stateOverrides?.metamaskStateOverrides ?? {}),
      },
      ...(stateOverrides ?? {}),
    }),
  );
};

const makeWrapper =
  (store: ReturnType<typeof makeMockStore>) =>
  ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>
      <MemoryRouter>
        <HardwareWalletProvider>{children}</HardwareWalletProvider>
      </MemoryRouter>
    </Provider>
  );

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
      mockEnsureDeviceReady.mockResolvedValue(true);
    });

    it('executes EVM bridge transaction', async () => {
      const store = makeMockStore();
      const { result } = renderHook(() => useSubmitBridgeTransaction(), {
        wrapper: makeWrapper(store),
      });

      await act(async () => {
        await result.current.submitBridgeTransaction(
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          DummyQuotesWithApproval.ETH_11_USDC_TO_ARB[0] as any,
        );
      });

      expect(submitTxSpy.mock.calls).toMatchSnapshot();
      expect(result.current.isSubmitting).toBe(false);
    });

    it('executes EVM bridge transaction with no approval', async () => {
      const store = makeMockStore();
      const { result } = renderHook(() => useSubmitBridgeTransaction(), {
        wrapper: makeWrapper(store),
      });

      await act(async () => {
        await result.current.submitBridgeTransaction(
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          DummyQuotesNoApproval.OP_0_005_ETH_TO_ARB[0] as any,
        );
      });

      expect(submitTxSpy.mock.calls).toMatchSnapshot();
      expect(result.current.isSubmitting).toBe(false);
    });

    it('routes to activity tab after EVM bridge transaction', async () => {
      const store = makeMockStore();
      const { result } = renderHook(() => useSubmitBridgeTransaction(), {
        wrapper: makeWrapper(store),
      });

      await act(async () => {
        await result.current.submitBridgeTransaction(
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          DummyQuotesWithApproval.ETH_11_USDC_TO_ARB[0] as any,
        );
      });

      expect(mockUseNavigate).toHaveBeenCalledWith(
        `${DEFAULT_ROUTE}?tab=activity`,
        {
          state: { stayOnHomePage: true },
        },
      );
      expect(result.current.isSubmitting).toBe(false);
      expect(submitTxSpy).toHaveBeenCalled();
    });

    it('routes to awaiting signatures for hardware wallets', async () => {
      const store = makeMockStore({
        metamaskStateOverrides: {
          internalAccounts: {
            selectedAccount: MOCK_LEDGER_ACCOUNT.id,
          },
          accountTree: {
            selectedAccountGroup:
              'keyring:Ledger Hardware/0xb3864b298f4fddbbbd2fa5cf1a2a2748932b3b82',
          },
        },
      });
      isHardwareWalletSpy.mockImplementation(() => true);
      const { result } = renderHook(() => useSubmitBridgeTransaction(), {
        wrapper: makeWrapper(store),
      });

      await act(async () => {
        await result.current.submitBridgeTransaction(
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          DummyQuotesWithApproval.ETH_11_USDC_TO_ARB[0] as any,
        );
      });

      const {
        quote: { requestId },
      } = DummyQuotesWithApproval.ETH_11_USDC_TO_ARB[0];
      expect(mockUseNavigate).toHaveBeenCalledWith(
        `${CROSS_CHAIN_SWAP_ROUTE}${AWAITING_SIGNATURES_ROUTE}?requestId=${encodeURIComponent(
          requestId,
        )}`,
      );
      expect(result.current.isSubmitting).toBe(false);
      expect(submitTxSpy).toHaveBeenCalledTimes(1);
    });

    it('returns early if hardware device is not ready', async () => {
      const store = makeMockStore({
        metamaskStateOverrides: {
          internalAccounts: {
            selectedAccount: MOCK_LEDGER_ACCOUNT.id,
          },
          accountTree: {
            selectedAccountGroup:
              'keyring:Ledger Hardware/0xb3864b298f4fddbbbd2fa5cf1a2a2748932b3b82',
          },
        },
      });
      mockEnsureDeviceReady.mockResolvedValue(false);
      const { result } = renderHook(() => useSubmitBridgeTransaction(), {
        wrapper: makeWrapper(store),
      });

      await act(async () => {
        await result.current.submitBridgeTransaction(
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          DummyQuotesWithApproval.ETH_11_USDC_TO_ARB[0] as any,
        );
      });

      expect(result.current.isSubmitting).toBe(false);
      expect(submitTxSpy).not.toHaveBeenCalled();
      expect(mockUseNavigate).not.toHaveBeenCalled();
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

      await act(async () => {
        await result.current.submitBridgeTransaction(
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          quoteWithIntent as any,
        );
      });

      expect(submitIntentSpy).toHaveBeenCalledWith({
        quoteResponse: quoteWithIntent,
        accountAddress: expect.any(String),
      });
      expect(submitTxSpy).not.toHaveBeenCalled();
      expect(mockUseNavigate).toHaveBeenCalledWith(
        `${DEFAULT_ROUTE}?tab=activity`,
        {
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

      await act(async () => {
        await result.current.submitBridgeTransaction(
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          quoteWithIntent as any,
        );
      });

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
