import { waitFor } from '@testing-library/react';
import { act, renderHook } from '@testing-library/react-hooks';
import type { TransactionMeta } from '@metamask/transaction-controller';
import { TransactionType } from '@metamask/transaction-controller';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import React from 'react';
import configureStore from '../../../../store/store';
import { MetaMaskTestReduxProvider } from '../../../../../test/lib/redux-test-provider';
import {
  createBridgeMockStore,
  MOCK_LEDGER_ACCOUNT,
} from '../../../../../test/data/bridge/mock-bridge-store';
import {
  I18nProvider,
  en,
} from '../../../../../test/lib/render-helpers-navigate';
import { ConnectionStatus } from '../../../../contexts/hardware-wallets';
import {
  addTransaction,
  findNetworkClientIdByChainId,
  updateAndApproveTx,
} from '../../../../store/actions';
import { useHwSwapQuoteData } from '../../../../hooks/hardware-wallets/useHwSwapQuoteData';
import { useHwSwapSubmission } from '../../../../hooks/hardware-wallets/useHwSwapSubmission';
import { useHwSwapConnectionMonitoring } from '../../../../hooks/hardware-wallets/useHwSwapConnectionMonitoring';
import { useHwSwapConfirmationMonitoring } from '../../../../hooks/hardware-wallets/useHwSwapConfirmationMonitoring';
import { useHwSwapQrState } from '../../../../hooks/hardware-wallets/useHwSwapQrState';
import { useHwSwapNavigation } from '../../../../hooks/hardware-wallets/useHwSwapNavigation';
import { useHwSignTracker } from '../../../../hooks/hardware-wallets/useHwSignTracker';
import { useBridgeNavigation } from '../../../../hooks/bridge/useBridgeNavigation';
import useSubmitBridgeTransaction from '../../../../hooks/bridge/useSubmitBridgeTransaction';
import * as bridgeSelectors from '../../../../ducks/bridge/selectors';
import { HardwareWalletSignatureStatus } from '../hardware-wallet-signatures-state-machine';
import { cleanupPendingApproval } from '../hardware-wallet-signatures.utils';
import { flushPromises } from '../../../../../test/lib/timer-helpers';
import { useHardwareWalletSignatures } from './useHardwareWalletSignatures';

jest.mock('../../../../hooks/bridge/useSubmitBridgeTransaction');
jest.mock('../../../../hooks/hardware-wallets/useHwSwapQuoteData');
jest.mock('../../../../hooks/hardware-wallets/useHwSwapSubmission');
jest.mock('../../../../hooks/hardware-wallets/useHwSwapConnectionMonitoring');
jest.mock('../../../../hooks/hardware-wallets/useHwSwapConfirmationMonitoring');
jest.mock('../../../../hooks/hardware-wallets/useHwSwapQrState');
jest.mock('../../../../hooks/hardware-wallets/useHwSwapNavigation');
jest.mock('../../../../hooks/hardware-wallets/useHwSignTracker');
jest.mock('../../../../hooks/bridge/useBridgeNavigation');
jest.mock('../hardware-wallet-signatures.utils', () => ({
  ...jest.requireActual('../hardware-wallet-signatures.utils'),
  cleanupPendingApproval: jest.fn(),
}));
jest.mock('../../../../store/actions', () => ({
  ...jest.requireActual('../../../../store/actions'),
  addTransaction: jest.fn(),
  findNetworkClientIdByChainId: jest.fn(),
  updateAndApproveTx: jest.fn(),
}));

const mockUseHardwareWalletState = jest.fn();
const mockSetSigningInProgress = jest.fn();
const mockNavigate = jest.fn();

jest.mock('../../../../contexts/hardware-wallets', () => ({
  ...jest.requireActual('../../../../contexts/hardware-wallets'),
  useHardwareWalletState: () => mockUseHardwareWalletState(),
  useHardwareWalletActions: () => ({
    setSigningInProgress: mockSetSigningInProgress,
  }),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const mockUseHwSwapQuoteData = useHwSwapQuoteData as jest.MockedFunction<
  typeof useHwSwapQuoteData
>;
const mockUseHwSwapSubmission = useHwSwapSubmission as jest.MockedFunction<
  typeof useHwSwapSubmission
>;
const mockUseHwSwapConnectionMonitoring =
  useHwSwapConnectionMonitoring as jest.MockedFunction<
    typeof useHwSwapConnectionMonitoring
  >;
const mockUseHwSwapConfirmationMonitoring =
  useHwSwapConfirmationMonitoring as jest.MockedFunction<
    typeof useHwSwapConfirmationMonitoring
  >;
const mockUseHwSwapQrState = useHwSwapQrState as jest.MockedFunction<
  typeof useHwSwapQrState
>;
const mockUseHwSwapNavigation = useHwSwapNavigation as jest.MockedFunction<
  typeof useHwSwapNavigation
>;
const mockUseHwSignTracker = useHwSignTracker as jest.MockedFunction<
  typeof useHwSignTracker
>;
const mockUseBridgeNavigation = useBridgeNavigation as jest.MockedFunction<
  typeof useBridgeNavigation
>;
const mockUseSubmitBridgeTransaction =
  useSubmitBridgeTransaction as jest.MockedFunction<
    typeof useSubmitBridgeTransaction
  >;
const mockUpdateAndApproveTx = updateAndApproveTx as jest.MockedFunction<
  typeof updateAndApproveTx
>;
const mockAddTransaction = addTransaction as jest.MockedFunction<
  typeof addTransaction
>;
const mockFindNetworkClientIdByChainId =
  findNetworkClientIdByChainId as jest.MockedFunction<
    typeof findNetworkClientIdByChainId
  >;
const mockCleanupPendingApproval =
  cleanupPendingApproval as jest.MockedFunction<typeof cleanupPendingApproval>;

const LEDGER_ACCOUNT_GROUP =
  'keyring:Ledger Hardware/0xb3864b298f4fddbbbd2fa5cf1a2a2748932b3b82';
const APPROVAL_ID = 'approval-request-1';
const TX_ID = 'send-bundle-tx-1';
const BATCH_TX_ID = 'batch-tx-1';
const FROM_ADDRESS = '0xc5fe6ef47965741f6f7a4734bf784bf3ae3f2452';
const TO_ADDRESS = '0x0987654321098765432109876543210987654321';

const mockCancelCurrentBatch = jest.fn().mockResolvedValue(undefined);
const mockResetConnectionError = jest.fn();
const mockRetrySubmission = jest.fn().mockResolvedValue(undefined);
const mockNavigateToBridgePage = jest.fn();

function createSendBundleTxMeta(
  overrides: Partial<TransactionMeta> = {},
): TransactionMeta {
  return {
    id: TX_ID,
    chainId: '0x1',
    type: TransactionType.simpleSend,
    status: 'unapproved',
    time: Date.now(),
    txParams: {
      from: FROM_ADDRESS,
      to: TO_ADDRESS,
      value: '0x1',
      gas: '0x5208',
      maxFeePerGas: '0x1',
      maxPriorityFeePerGas: '0x1',
    },
    batchTransactions: [
      {
        id: BATCH_TX_ID,
        data: '0xabc',
        to: TO_ADDRESS,
        value: '0x0',
      },
      {
        data: '0xdef',
        to: TO_ADDRESS,
        value: '0x0',
      },
    ],
    ...overrides,
  } as TransactionMeta;
}

function createSendBundleLocationState(
  overrides: {
    needsTwoConfirmations?: boolean;
    approvalRequestId?: string;
    returnRoute?: string;
    txMeta?: TransactionMeta;
  } = {},
) {
  return {
    sendBundle: {
      txMeta: overrides.txMeta ?? createSendBundleTxMeta(),
      needsTwoConfirmations: overrides.needsTwoConfirmations ?? true,
      approvalRequestId: overrides.approvalRequestId ?? APPROVAL_ID,
      returnRoute: overrides.returnRoute,
      sendAmount: '1.5',
      sendSymbol: 'ETH',
      gasSymbol: 'ETH',
    },
  };
}

function createStore(options?: {
  includePendingApproval?: boolean;
  approvalId?: string;
}) {
  const approvalId = options?.approvalId ?? APPROVAL_ID;
  const includePendingApproval = options?.includePendingApproval ?? true;

  return configureStore(
    createBridgeMockStore({
      metamaskStateOverrides: {
        internalAccounts: {
          selectedAccount: MOCK_LEDGER_ACCOUNT.id,
        },
        accountTree: {
          selectedAccountGroup: LEDGER_ACCOUNT_GROUP,
        },
        pendingApprovals: includePendingApproval
          ? {
              [approvalId]: {
                id: approvalId,
                origin: 'metamask',
                type: 'transaction',
                time: Date.now(),
                requestData: {},
                requestState: null,
                expectsResult: false,
              },
            }
          : {},
      },
    }),
  );
}

function renderUseHardwareWalletSignatures({
  locationState,
  includePendingApproval = true,
}: {
  locationState?: ReturnType<typeof createSendBundleLocationState> | null;
  includePendingApproval?: boolean;
} = {}) {
  const store = createStore({ includePendingApproval });
  const initialEntries = locationState
    ? [{ pathname: '/', state: locationState }]
    : ['/'];

  const wrapper = ({ children }: { children: React.ReactNode }) => {
    const router = createMemoryRouter(
      [
        {
          path: '*',
          element: children as React.ReactElement,
        },
      ],
      {
        initialEntries,
        future: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          v7_relativeSplatPath: true,
        },
      },
    );

    return (
      <MetaMaskTestReduxProvider store={store}>
        <I18nProvider currentLocale="en" current={en} en={en}>
          <RouterProvider
            router={router}
            future={{
              // eslint-disable-next-line @typescript-eslint/naming-convention
              v7_startTransition: true,
            }}
          />
        </I18nProvider>
      </MetaMaskTestReduxProvider>
    );
  };

  return {
    ...renderHook(() => useHardwareWalletSignatures(), { wrapper }),
    store,
  };
}

/**
 * Renders the hook and flushes the sendBundle auto-submit effect so async
 * state updates land inside `act` (avoids React Act warnings).
 *
 * @param options - Optional render options forwarded to
 * {@link renderUseHardwareWalletSignatures}.
 * @returns The rendered hook result after pending microtasks have flushed.
 */
async function renderUseHardwareWalletSignaturesAndFlush(
  options: Parameters<typeof renderUseHardwareWalletSignatures>[0] = {},
) {
  const rendered = renderUseHardwareWalletSignatures(options);
  await act(async () => {
    // Flush effect scheduling + the updateAndApproveTx promise chain.
    await flushPromises();
  });
  return rendered;
}

describe('useHardwareWalletSignatures', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockCancelCurrentBatch.mockReset().mockResolvedValue(undefined);
    mockResetConnectionError.mockReset();
    mockRetrySubmission.mockReset().mockResolvedValue(undefined);
    mockNavigateToBridgePage.mockReset();
    mockNavigate.mockReset();
    mockSetSigningInProgress.mockReset();
    mockCleanupPendingApproval.mockReset();
    mockUpdateAndApproveTx
      .mockReset()
      .mockReturnValue((() => Promise.resolve(undefined)) as never);
    mockFindNetworkClientIdByChainId.mockReset().mockResolvedValue('mainnet');
    mockAddTransaction.mockReset().mockResolvedValue({
      id: 'new-tx-id',
      chainId: '0x1',
      type: TransactionType.simpleSend,
      status: 'unapproved',
      time: Date.now(),
      txParams: {
        from: FROM_ADDRESS,
        to: TO_ADDRESS,
        value: '0x1',
      },
    } as never);

    mockUseHardwareWalletState.mockReturnValue({
      connectionState: { status: ConnectionStatus.Ready },
    });
    mockUseHwSwapQuoteData.mockReturnValue({
      activeQuote: null,
      lockedQuote: null,
      fromToken: undefined,
      toToken: undefined,
      hardwareWalletType: undefined,
    } as never);
    mockUseHwSwapSubmission.mockReturnValue({
      retrySubmission: mockRetrySubmission,
      hasStartedSubmission: { current: false },
      submitActiveQuote: jest.fn(),
    } as never);
    mockUseHwSwapConnectionMonitoring.mockReturnValue({
      isDeviceDisconnectedRef: { current: false },
      resetConnectionError: mockResetConnectionError,
    });
    mockUseHwSwapConfirmationMonitoring.mockReturnValue({
      confirmationTxData: undefined,
    });
    mockUseHwSwapQrState.mockReturnValue({
      isReadingQrSignature: false,
      setIsReadingQrSignature: jest.fn(),
      isQrHardwareWallet: false,
      qrSignRequest: undefined,
      showInlineQrSigning: false,
      activeQrStep: undefined,
      handleQrScanSuccess: jest.fn(),
      handleQrSignatureCancel: jest.fn(),
    });
    mockUseHwSwapNavigation.mockReturnValue(undefined as never);
    mockUseHwSignTracker.mockReturnValue({
      cancelCurrentBatch: mockCancelCurrentBatch,
    } as never);
    mockUseBridgeNavigation.mockReturnValue({
      navigateToBridgePage: mockNavigateToBridgePage,
    } as never);
    mockUseSubmitBridgeTransaction.mockReturnValue({
      submitBridgeTransaction: jest.fn().mockResolvedValue(undefined),
      isSubmitting: false,
    });
    jest.spyOn(bridgeSelectors, 'getIsStxEnabled').mockReturnValue(false);
  });

  afterEach(async () => {
    await act(async () => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('sendBundle flow', () => {
    it('auto-submits the sendBundle transaction when the approval is still pending', async () => {
      const { result } = await renderUseHardwareWalletSignaturesAndFlush({
        locationState: createSendBundleLocationState(),
      });

      await waitFor(() => {
        expect(mockUpdateAndApproveTx).toHaveBeenCalledWith(
          expect.objectContaining({ id: TX_ID }),
          true,
          '',
        );
      });

      await waitFor(() => {
        expect(result.current.signatureStatus).toBe(
          HardwareWalletSignatureStatus.Submitted,
        );
      });

      expect(result.current.stepList.hasSigningRequest).toBe(true);
      expect(result.current.stepList.needsTwoConfirmations).toBe(true);
      expect(result.current.stepList.firstStepLabel).toContain('1.5');
    });

    it('marks the flow failed when the pending approval is gone', async () => {
      const { result } = await renderUseHardwareWalletSignaturesAndFlush({
        locationState: createSendBundleLocationState(),
        includePendingApproval: false,
      });

      await waitFor(() => {
        expect(result.current.signatureStatus).toBe(
          HardwareWalletSignatureStatus.Failed,
        );
      });

      expect(mockUpdateAndApproveTx).not.toHaveBeenCalled();
    });

    it('marks the flow rejected when the device rejects the sendBundle submit', async () => {
      mockUpdateAndApproveTx.mockReturnValue((() =>
        Promise.reject({
          code: 4001,
          message: 'User rejected the request.',
        })) as never);

      const { result } = await renderUseHardwareWalletSignaturesAndFlush({
        locationState: createSendBundleLocationState(),
      });

      await waitFor(() => {
        expect(result.current.signatureStatus).toBe(
          HardwareWalletSignatureStatus.Rejected,
        );
      });
    });

    it('marks the flow failed when sendBundle submit throws a non-rejection error', async () => {
      mockUpdateAndApproveTx.mockReturnValue((() =>
        Promise.reject(new Error('ledger busy'))) as never);

      const { result } = await renderUseHardwareWalletSignaturesAndFlush({
        locationState: createSendBundleLocationState(),
      });

      await waitFor(() => {
        expect(result.current.signatureStatus).toBe(
          HardwareWalletSignatureStatus.Failed,
        );
      });
    });

    it('passes nested batch transaction ids to the sign tracker', async () => {
      await renderUseHardwareWalletSignaturesAndFlush({
        locationState: createSendBundleLocationState(),
      });

      await waitFor(() => {
        expect(mockUseHwSignTracker).toHaveBeenCalled();
      });

      expect(mockUseHwSignTracker).toHaveBeenCalledWith(
        FROM_ADDRESS,
        expect.any(Boolean),
        expect.any(Function),
        expect.objectContaining({
          expectedTxIds: [TX_ID, BATCH_TX_ID],
          includeSendBundleTransactions: true,
          expectedTransactionParams: [
            {
              data: '0xabc',
              to: TO_ADDRESS,
              value: '0x0',
            },
            {
              data: '0xdef',
              to: TO_ADDRESS,
              value: '0x0',
            },
          ],
        }),
        expect.any(Object),
      );
    });

    it('cancels the pending approval and navigates to the return route', async () => {
      const { result } = await renderUseHardwareWalletSignaturesAndFlush({
        locationState: createSendBundleLocationState({
          returnRoute: '/send',
        }),
      });

      await waitFor(() => {
        expect(mockUpdateAndApproveTx).toHaveBeenCalled();
      });

      await act(async () => {
        await result.current.handleCancel();
      });

      expect(mockCancelCurrentBatch).toHaveBeenCalled();
      expect(mockCleanupPendingApproval).toHaveBeenCalledWith(
        expect.any(Function),
        APPROVAL_ID,
      );
      expect(mockNavigate).toHaveBeenCalledWith('/send', { replace: true });
      expect(mockNavigateToBridgePage).not.toHaveBeenCalled();
    });

    it('navigates to the default route when cancel has no return route', async () => {
      const { result } = await renderUseHardwareWalletSignaturesAndFlush({
        locationState: createSendBundleLocationState(),
      });

      await waitFor(() => {
        expect(mockUpdateAndApproveTx).toHaveBeenCalled();
      });

      await act(async () => {
        await result.current.handleCancel();
      });

      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    });

    it('retries sendBundle by recreating and approving a fresh transaction', async () => {
      mockUpdateAndApproveTx
        .mockReturnValueOnce((() =>
          Promise.reject({
            code: 4001,
            message: 'User rejected the request.',
          })) as never)
        .mockReturnValue((() => Promise.resolve(undefined)) as never);

      const { result } = await renderUseHardwareWalletSignaturesAndFlush({
        locationState: createSendBundleLocationState(),
      });

      await waitFor(() => {
        expect(result.current.signatureStatus).toBe(
          HardwareWalletSignatureStatus.Rejected,
        );
      });

      await act(async () => {
        await result.current.footer.handleRetry();
      });

      expect(mockCancelCurrentBatch).toHaveBeenCalled();
      expect(mockCleanupPendingApproval).toHaveBeenCalled();
      expect(mockFindNetworkClientIdByChainId).toHaveBeenCalledWith('0x1');
      expect(mockAddTransaction).toHaveBeenCalled();
      expect(mockUpdateAndApproveTx).toHaveBeenCalledTimes(2);
      expect(mockRetrySubmission).not.toHaveBeenCalled();

      await waitFor(() => {
        expect(result.current.signatureStatus).toBe(
          HardwareWalletSignatureStatus.Submitted,
        );
      });
    });

    it('marks retry failed when the original txMeta has no chainId', async () => {
      mockUpdateAndApproveTx.mockReturnValueOnce((() =>
        Promise.reject({
          code: 4001,
          message: 'User rejected the request.',
        })) as never);

      const { result } = await renderUseHardwareWalletSignaturesAndFlush({
        locationState: createSendBundleLocationState({
          txMeta: createSendBundleTxMeta({ chainId: undefined }),
        }),
      });

      await waitFor(() => {
        expect(result.current.signatureStatus).toBe(
          HardwareWalletSignatureStatus.Rejected,
        );
      });

      await act(async () => {
        await result.current.footer.handleRetry();
      });

      expect(mockAddTransaction).not.toHaveBeenCalled();
      expect(result.current.signatureStatus).toBe(
        HardwareWalletSignatureStatus.Failed,
      );
    });

    it('marks retry rejected when the recreated transaction is rejected', async () => {
      mockUpdateAndApproveTx.mockReturnValue((() =>
        Promise.reject({
          code: 4001,
          message: 'User rejected the request.',
        })) as never);

      const { result } = await renderUseHardwareWalletSignaturesAndFlush({
        locationState: createSendBundleLocationState(),
      });

      await waitFor(() => {
        expect(result.current.signatureStatus).toBe(
          HardwareWalletSignatureStatus.Rejected,
        );
      });

      await act(async () => {
        await result.current.footer.handleRetry();
      });

      expect(mockAddTransaction).toHaveBeenCalled();
      expect(result.current.signatureStatus).toBe(
        HardwareWalletSignatureStatus.Rejected,
      );
    });

    it('marks retry failed when recreating the transaction throws', async () => {
      mockUpdateAndApproveTx
        .mockReturnValueOnce((() =>
          Promise.reject({
            code: 4001,
            message: 'User rejected the request.',
          })) as never)
        .mockReturnValue((() =>
          Promise.reject(new Error('device locked'))) as never);

      const { result } = await renderUseHardwareWalletSignaturesAndFlush({
        locationState: createSendBundleLocationState(),
      });

      await waitFor(() => {
        expect(result.current.signatureStatus).toBe(
          HardwareWalletSignatureStatus.Rejected,
        );
      });

      await act(async () => {
        await result.current.footer.handleRetry();
      });

      expect(result.current.signatureStatus).toBe(
        HardwareWalletSignatureStatus.Failed,
      );
    });
  });

  describe('retry guards', () => {
    it('ignores a second retry while one is already in flight', async () => {
      let resolveCancel: (() => void) | undefined;
      mockCancelCurrentBatch.mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            resolveCancel = resolve;
          }),
      );
      mockUpdateAndApproveTx.mockReturnValueOnce((() =>
        Promise.reject({
          code: 4001,
          message: 'User rejected the request.',
        })) as never);

      const { result } = await renderUseHardwareWalletSignaturesAndFlush({
        locationState: createSendBundleLocationState(),
      });

      await waitFor(() => {
        expect(result.current.signatureStatus).toBe(
          HardwareWalletSignatureStatus.Rejected,
        );
      });

      let firstRetry: Promise<void> | undefined;
      await act(async () => {
        firstRetry = result.current.footer.handleRetry();
      });

      await act(async () => {
        await result.current.footer.handleRetry();
      });

      expect(mockCancelCurrentBatch).toHaveBeenCalledTimes(1);

      await act(async () => {
        resolveCancel?.();
        await firstRetry;
      });
    });

    it('ignores a late sendBundle reject from the cancelled batch during retry', async () => {
      let rejectFirstApprove: ((error: unknown) => void) | undefined;
      mockUpdateAndApproveTx
        .mockReturnValueOnce(
          (() =>
            new Promise((_resolve, reject) => {
              rejectFirstApprove = reject;
            })) as never,
        )
        .mockReturnValue((() => Promise.resolve(undefined)) as never);

      mockCancelCurrentBatch.mockImplementation(async () => {
        rejectFirstApprove?.({
          code: 4001,
          message: 'User rejected the request.',
        });
        // Let the aborted submit's catch run while isRetryingRef is still set.
        await Promise.resolve();
      });

      const { result } = renderUseHardwareWalletSignatures({
        locationState: createSendBundleLocationState(),
      });

      await waitFor(() => {
        expect(mockUpdateAndApproveTx).toHaveBeenCalledTimes(1);
      });

      expect(result.current.signatureStatus).toBe(
        HardwareWalletSignatureStatus.AwaitingFirstSignature,
      );

      await act(async () => {
        await result.current.footer.handleRetry();
      });

      expect(result.current.signatureStatus).not.toBe(
        HardwareWalletSignatureStatus.Rejected,
      );

      await waitFor(() => {
        expect(result.current.signatureStatus).toBe(
          HardwareWalletSignatureStatus.Submitted,
        );
      });
    });

    it('ignores a late sendBundle reject that arrives after cancel while retry is starting', async () => {
      let rejectFirstApprove: ((error: unknown) => void) | undefined;
      mockUpdateAndApproveTx
        .mockReturnValueOnce(
          (() =>
            new Promise((_resolve, reject) => {
              rejectFirstApprove = reject;
            })) as never,
        )
        .mockReturnValue((() => Promise.resolve(undefined)) as never);

      // Cancel finishes cleanly; the aborted approve rejects only once the
      // retry has cleared isRetryingRef and begun recreating the tx — the
      // generation mismatch must still suppress Rejected/Failed.
      mockCancelCurrentBatch.mockResolvedValue(undefined);
      mockAddTransaction.mockImplementation(async () => {
        rejectFirstApprove?.({
          code: 4001,
          message: 'User rejected the request.',
        });
        await Promise.resolve();
        return {
          id: 'new-tx-id',
          chainId: '0x1',
          type: TransactionType.simpleSend,
          status: 'unapproved',
          time: Date.now(),
          txParams: {
            from: FROM_ADDRESS,
            to: TO_ADDRESS,
            value: '0x1',
          },
        } as never;
      });

      const { result } = renderUseHardwareWalletSignatures({
        locationState: createSendBundleLocationState(),
      });

      await waitFor(() => {
        expect(mockUpdateAndApproveTx).toHaveBeenCalledTimes(1);
      });

      expect(result.current.signatureStatus).toBe(
        HardwareWalletSignatureStatus.AwaitingFirstSignature,
      );

      await act(async () => {
        await result.current.footer.handleRetry();
      });

      expect(result.current.signatureStatus).not.toBe(
        HardwareWalletSignatureStatus.Rejected,
      );

      await waitFor(() => {
        expect(result.current.signatureStatus).toBe(
          HardwareWalletSignatureStatus.Submitted,
        );
      });
    });

    it('resets the state machine when smart transactions are enabled', async () => {
      jest.spyOn(bridgeSelectors, 'getIsStxEnabled').mockReturnValue(true);
      mockUpdateAndApproveTx
        .mockReturnValueOnce((() =>
          Promise.reject({
            code: 4001,
            message: 'User rejected the request.',
          })) as never)
        .mockReturnValue((() => Promise.resolve(undefined)) as never);

      const { result } = await renderUseHardwareWalletSignaturesAndFlush({
        locationState: createSendBundleLocationState(),
      });

      await waitFor(() => {
        expect(result.current.signatureStatus).toBe(
          HardwareWalletSignatureStatus.Rejected,
        );
      });

      await act(async () => {
        await result.current.footer.handleRetry();
      });

      expect(mockAddTransaction).toHaveBeenCalled();
      expect(mockResetConnectionError).toHaveBeenCalled();
    });

    it('does not resubmit when the device is not in a retryable connection state', async () => {
      mockUpdateAndApproveTx.mockReturnValueOnce((() =>
        Promise.reject({
          code: 4001,
          message: 'User rejected the request.',
        })) as never);

      const { result, rerender } =
        await renderUseHardwareWalletSignaturesAndFlush({
          locationState: createSendBundleLocationState(),
        });

      await waitFor(() => {
        expect(result.current.signatureStatus).toBe(
          HardwareWalletSignatureStatus.Rejected,
        );
      });

      mockUseHardwareWalletState.mockReturnValue({
        connectionState: { status: ConnectionStatus.Connecting },
      });
      rerender();

      await act(async () => {
        await result.current.footer.handleRetry();
      });

      expect(mockCancelCurrentBatch).toHaveBeenCalled();
      expect(mockAddTransaction).not.toHaveBeenCalled();
    });
  });

  describe('bridge cancel', () => {
    it('navigates back to the bridge page when cancelling a non-sendBundle flow', async () => {
      mockUseHwSwapQuoteData.mockReturnValue({
        activeQuote: {
          quote: { requestId: 'quote-1' },
          sentAmount: { amount: '1' },
          trade: { from: FROM_ADDRESS, to: TO_ADDRESS },
        },
        lockedQuote: {
          quote: {
            requestId: 'quote-1',
            srcTokenAmount: '1',
            destTokenAmount: '2',
          },
          sentAmount: { amount: '1' },
          trade: { from: FROM_ADDRESS, to: TO_ADDRESS },
        },
        fromToken: { symbol: 'ETH' },
        toToken: { symbol: 'USDC' },
        hardwareWalletType: 'ledger',
      } as never);

      const { result } = await renderUseHardwareWalletSignaturesAndFlush();

      await act(async () => {
        await result.current.handleCancel();
      });

      expect(mockNavigateToBridgePage).toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});
