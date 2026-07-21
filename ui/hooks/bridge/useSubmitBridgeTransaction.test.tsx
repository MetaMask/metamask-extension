import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderHook } from '@testing-library/react-hooks';
import { act } from '@testing-library/react';
import { createMemoryRouterWrapper } from '../../../test/lib/render-helpers-navigate';
import {
  createBridgeMockStore,
  MOCK_LEDGER_ACCOUNT,
} from '../../../test/data/bridge/mock-bridge-store';
import {
  DummyQuotesNoApproval,
  DummyQuotesWithApproval,
} from '../../../test/data/bridge/dummy-quotes';
import {
  CROSS_CHAIN_SWAP_ROUTE,
  DEFAULT_ROUTE,
  HARDWARE_WALLET_SIGNATURES_ROUTE,
} from '../../helpers/constants/routes';
import * as keyringSelectors from '../../../shared/lib/selectors/keyring';
import * as sentry from '../../../shared/lib/sentry';
import * as bridgeStatusActions from '../../ducks/bridge-status/actions';
import * as bridgeActions from '../../ducks/bridge/actions';
import { setBackgroundConnection } from '../../store/background-connection';
import { HardwareWalletProvider } from '../../contexts/hardware-wallets';
import useSubmitBridgeTransaction from './useSubmitBridgeTransaction';

jest.mock('../../../shared/lib/sentry', () => ({
  ...jest.requireActual('../../../shared/lib/sentry'),
  captureException: jest.fn(),
}));

const mockUseNavigate = jest.fn();
jest.mock('react-router-dom', () => {
  return {
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockUseNavigate,
  };
});

jest.mock('../../ducks/bridge/utils', () => ({
  ...jest.requireActual('../../ducks/bridge/utils'),
  getTxGasEstimates: jest.fn(() => ({
    baseAndPriorityFeePerGas: '0',
    maxFeePerGas: '0x1036640',
    maxPriorityFeePerGas: '0x0',
  })),
}));

const mockEnsureDeviceReady = jest.fn().mockResolvedValue(true);
jest.mock('../../contexts/hardware-wallets/HardwareWalletContext', () => {
  return {
    ...jest.requireActual(
      '../../contexts/hardware-wallets/HardwareWalletContext',
    ),
    useHardwareWalletActions: () => ({
      ensureDeviceReady: () => mockEnsureDeviceReady(),
    }),
  };
});

jest.mock('../../store/actions', () => {
  const original = jest.requireActual('../../store/actions');
  return {
    ...original,
    addTransaction: jest.fn(),
    addTransactionAndWaitForPublish: jest.fn(),
    addToken: jest.fn().mockImplementation(original.addToken),
    addNetwork: jest.fn().mockImplementation(original.addNetwork),
  };
});

const MOCK_NETWORK_CONFIGURATIONS_BY_CHAIN_ID = {
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
};

jest.mock('../../../shared/lib/selectors/networks', () => {
  const original = jest.requireActual('../../../shared/lib/selectors/networks');
  return {
    ...original,
    getSelectedNetworkClientId: () => 'mainnet',
    getNetworkConfigurationsByChainId: jest.fn(
      () => MOCK_NETWORK_CONFIGURATIONS_BY_CHAIN_ID,
    ),
    // Override these too since they live in the same module — their
    // closure-captured reference to `getNetworkConfigurationsByChainId`
    // bypasses the mock above.
    selectNetworkConfigurationByChainId: jest.fn(
      (
        _state: unknown,
        chainId: keyof typeof MOCK_NETWORK_CONFIGURATIONS_BY_CHAIN_ID,
      ) => MOCK_NETWORK_CONFIGURATIONS_BY_CHAIN_ID[chainId],
    ),
    selectDefaultRpcEndpointByChainId: jest.fn(
      (
        _state: unknown,
        chainId: keyof typeof MOCK_NETWORK_CONFIGURATIONS_BY_CHAIN_ID,
      ) => {
        const config = MOCK_NETWORK_CONFIGURATIONS_BY_CHAIN_ID[chainId];
        if (!config) {
          return undefined;
        }
        return config.rpcEndpoints[config.defaultRpcEndpointIndex];
      },
    ),
  };
});

jest.mock('../../selectors', () => {
  const original = jest.requireActual('../../selectors');
  return {
    ...original,
    getIsBridgeEnabled: () => true,
    getIsBridgeChain: () => true,
    checkNetworkAndAccountSupports1559: () => true,
  };
});
jest.mock('../../../shared/lib/selectors/keyring', () => ({
  ...jest.requireActual('../../../shared/lib/selectors/keyring'),
  getHardwareWalletType: jest.fn(() => undefined),
  isHardwareWallet: jest.fn(() => false),
}));

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

const makeWrapper = (
  store: ReturnType<typeof makeMockStore>,
  initialEntries?: string[],
) => {
  const MemoryRouter = createMemoryRouterWrapper({
    store,
    initialEntries,
  });

  return ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter>
      <HardwareWalletProvider>{children}</HardwareWalletProvider>
    </MemoryRouter>
  );
};

const submitTxSpy = jest.spyOn(bridgeStatusActions, 'submitBridgeTx');
const submitIntentSpy = jest.spyOn(bridgeStatusActions, 'submitBridgeIntent');
const isHardwareWalletSpy = keyringSelectors.isHardwareWallet as jest.Mock;
const captureExceptionSpy = jest.spyOn(sentry, 'captureException');
const mockResetState = jest.fn();
const resetBridgeStoreSpy = jest.spyOn(bridgeActions, 'resetInputFields');

describe('ui/hooks/bridge/useSubmitBridgeTransaction', () => {
  describe('submitBridgeTransaction', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      isHardwareWalletSpy.mockImplementation(() => false);
      mockEnsureDeviceReady.mockResolvedValue(true);
      captureExceptionSpy.mockReturnValue(undefined);
      setBackgroundConnection({
        submitTx: submitTxSpy,
        submitIntent: submitIntentSpy,
        getLocation: jest.fn().mockResolvedValue('Main View'),
        getStatePatches: jest.fn(),
        setEnabledAllPopularNetworks: jest.fn(),
        resetState: () => mockResetState(),
      } as never);
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
      expect(mockUseNavigate.mock.calls).toMatchInlineSnapshot(`
        [
          [
            "/",
            {
              "replace": true,
              "state": {
                "stayOnHomePage": true,
              },
            },
          ],
        ]
      `);
      expect(result.current.isSubmitting).toBe(false);
      expect(resetBridgeStoreSpy).not.toHaveBeenCalled();
      expect(mockResetState).not.toHaveBeenCalled();
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
      expect(resetBridgeStoreSpy).not.toHaveBeenCalled();
      expect(mockResetState).not.toHaveBeenCalled();
    });

    it('routes to default route after EVM bridge transaction', async () => {
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

      // Assert
      expect(mockUseNavigate.mock.calls).toMatchInlineSnapshot(`
        [
          [
            "/",
            {
              "replace": true,
              "state": {
                "stayOnHomePage": true,
              },
            },
          ],
        ]
      `);

      expect(result.current.isSubmitting).toBe(false);
      expect(submitTxSpy).toHaveBeenCalled();
      expect(resetBridgeStoreSpy).not.toHaveBeenCalled();
      expect(mockResetState).not.toHaveBeenCalled();
    });

    it('routes to hardware wallet signatures for hardware wallets without submitting immediately', async () => {
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

      expect(mockUseNavigate.mock.calls).toMatchInlineSnapshot(`
        [
          [
            "/cross-chain/swaps/hardware-wallet-signatures",
            {
              "state": {},
            },
          ],
        ]
      `);
      expect(result.current.isSubmitting).toBe(false);
      expect(submitTxSpy).not.toHaveBeenCalled();
      expect(resetBridgeStoreSpy).not.toHaveBeenCalled();
      expect(mockResetState).not.toHaveBeenCalled();
    });

    it('submits hardware-wallet transactions from the hardware wallet signatures page', async () => {
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
        wrapper: makeWrapper(store, [
          `${CROSS_CHAIN_SWAP_ROUTE}${HARDWARE_WALLET_SIGNATURES_ROUTE}/`,
        ]),
      });

      await act(async () => {
        await result.current.submitBridgeTransaction(
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          DummyQuotesWithApproval.ETH_11_USDC_TO_ARB[0] as any,
        );
      });

      expect(mockUseNavigate).not.toHaveBeenCalled();
      expect(submitTxSpy).toHaveBeenCalledTimes(1);
      expect(result.current.isSubmitting).toBe(false);
    });

    it('throws when hardware-wallet submission fails from the signing page', async () => {
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
      const submitError = new Error('transport disconnected');
      submitTxSpy.mockImplementationOnce((async () => {
        throw submitError;
      }) as never);
      isHardwareWalletSpy.mockImplementation(() => true);
      const { result, unmount } = renderHook(
        () => useSubmitBridgeTransaction(),
        {
          wrapper: makeWrapper(store, [
            `${CROSS_CHAIN_SWAP_ROUTE}${HARDWARE_WALLET_SIGNATURES_ROUTE}`,
          ]),
        },
      );

      let didThrow = false;
      await act(async () => {
        try {
          await result.current.submitBridgeTransaction(
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            DummyQuotesWithApproval.ETH_11_USDC_TO_ARB[0] as any,
          );
        } catch (error) {
          didThrow = true;
          expect(error).toBe(submitError);
        }
      });
      unmount();

      expect(didThrow).toBe(true);
      expect(captureExceptionSpy).toHaveBeenCalledWith(submitError);
      expect(mockUseNavigate).not.toHaveBeenCalled();
      expect(result.current.isSubmitting).toBe(false);
    });

    it('does not dispatch a second submitBridgeTx when retrying after rpcTimeoutMs', async () => {
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
      // Never-resolving promise simulates a hung hardware-wallet RPC.
      submitTxSpy.mockImplementation(
        (() => new Promise(() => undefined)) as never,
      );
      isHardwareWalletSpy.mockImplementation(() => true);
      const { result, unmount } = renderHook(
        () => useSubmitBridgeTransaction(),
        {
          wrapper: makeWrapper(store, [
            `${CROSS_CHAIN_SWAP_ROUTE}${HARDWARE_WALLET_SIGNATURES_ROUTE}`,
          ]),
        },
      );

      const quote = DummyQuotesWithApproval.ETH_11_USDC_TO_ARB[0];

      await act(async () => {
        await expect(
          result.current.submitBridgeTransaction(
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            quote as any,
            { rpcTimeoutMs: 20 },
          ),
        ).rejects.toThrow('Bridge transaction RPC timed out');
      });

      expect(submitTxSpy).toHaveBeenCalledTimes(1);

      await act(async () => {
        await expect(
          result.current.submitBridgeTransaction(
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            quote as any,
            { rpcTimeoutMs: 20 },
          ),
        ).rejects.toThrow('Bridge transaction RPC timed out');
      });

      // Retry must reuse the in-flight dispatch instead of starting another.
      expect(submitTxSpy).toHaveBeenCalledTimes(1);
      unmount();
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
      expect(resetBridgeStoreSpy).not.toHaveBeenCalled();
      expect(mockResetState).not.toHaveBeenCalled();
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
        location: 'Main View',
        tokenSecurityTypeDestination: null,
      });
      expect(submitTxSpy).not.toHaveBeenCalled();
      expect(mockUseNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE, {
        replace: true,
        state: {
          stayOnHomePage: true,
        },
      });
      expect(resetBridgeStoreSpy).not.toHaveBeenCalled();
      expect(mockResetState).not.toHaveBeenCalled();
    });

    it('routes to default route with replace when non-HW intent submission fails', async () => {
      const store = makeMockStore();
      const submitError = new Error('submit failed');
      submitIntentSpy.mockImplementationOnce((async () => {
        throw submitError;
      }) as never);
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

      expect(mockUseNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE, {
        replace: true,
        state: {
          stayOnHomePage: true,
        },
      });
      expect(resetBridgeStoreSpy).not.toHaveBeenCalled();
      expect(mockResetState).not.toHaveBeenCalled();
      expect(captureExceptionSpy).toHaveBeenCalledWith(submitError);
    });

    it('blocks hardware-wallet intent quotes without routing to hardware wallet signatures', async () => {
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

      await expect(
        act(async () => {
          await result.current.submitBridgeTransaction(
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            quoteWithIntent as any,
          );
        }),
      ).rejects.toThrow('Hardware wallets cannot submit bridge intent quotes');

      expect(mockUseNavigate).not.toHaveBeenCalledWith(
        `${CROSS_CHAIN_SWAP_ROUTE}${HARDWARE_WALLET_SIGNATURES_ROUTE}`,
        expect.anything(),
      );
      expect(captureExceptionSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Hardware wallets cannot submit bridge intent quotes',
        }),
      );
      expect(resetBridgeStoreSpy).not.toHaveBeenCalled();
      expect(mockResetState).not.toHaveBeenCalled();
    });
  });
});
