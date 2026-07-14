import { act } from '@testing-library/react-hooks';

import { ConnectionStatus } from '../../contexts/hardware-wallets';
import { cleanupPendingApproval } from '../../pages/hardware-wallets/swap/hardware-wallet-signatures.utils';
import {
  HardwareWalletSignatureEvent,
  HardwareWalletSignatureStatus,
} from '../../pages/hardware-wallets/swap/hardware-wallet-signatures-state-machine';
import { createSignatureState } from '../../pages/hardware-wallets/swap/hardware-wallet-signatures-state-machine/test-helpers';
import { renderHookWithProvider } from '../../../test/lib/render-helpers-navigate';
import { useHwSwapActions } from './useHwSwapActions';

jest.mock('../../pages/hardware-wallets/swap/hardware-wallet-signatures.utils', () => ({
  ...jest.requireActual(
    '../../pages/hardware-wallets/swap/hardware-wallet-signatures.utils',
  ),
  cleanupPendingApproval: jest.fn(),
}));

const mockNavigate = jest.fn();
const mockNavigateToBridgePage = jest.fn();
const mockUseHardwareWalletState = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../bridge/useBridgeNavigation', () => ({
  useBridgeNavigation: () => ({
    navigateToBridgePage: mockNavigateToBridgePage,
  }),
}));

jest.mock('../../contexts/hardware-wallets', () => ({
  ...jest.requireActual('../../contexts/hardware-wallets'),
  useHardwareWalletState: () => mockUseHardwareWalletState(),
}));

const mockCleanupPendingApproval = cleanupPendingApproval as jest.MockedFunction<
  typeof cleanupPendingApproval
>;

describe('useHwSwapActions', () => {
  const mockDispatchSignatureEvent = jest.fn();
  const mockCancelCurrentBatch = jest.fn();
  const mockResetConnectionError = jest.fn();
  const mockRetrySendBundleSubmission = jest.fn();
  const mockRetrySubmission = jest.fn();
  const mockHandleQrSignatureCancel = jest.fn();
  const retryGenerationRef = { current: 0 };
  const hasStartedSendBundleSubmission = { current: false };
  const isRetryingRef = { current: false };

  const renderUseHwSwapActions = (
    overrides: Partial<Parameters<typeof useHwSwapActions>[0]> = {},
  ) => {
    return renderHookWithProvider(
      () =>
        useHwSwapActions({
          signatureState: createSignatureState(
            HardwareWalletSignatureStatus.Rejected,
          ),
          dispatchSignatureEvent: mockDispatchSignatureEvent,
          cancelCurrentBatch: mockCancelCurrentBatch,
          resetConnectionError: mockResetConnectionError,
          retryGenerationRef,
          needsTwoConfirmations: true,
          isStxEnabled: false,
          isSendBundleFlow: false,
          hasStartedSendBundleSubmission,
          retrySendBundleSubmission: mockRetrySendBundleSubmission,
          retrySubmission: mockRetrySubmission,
          handleQrSignatureCancel: mockHandleQrSignatureCancel,
          currentApprovalRequestId: 'approval-1',
          returnRoute: '/send',
          isRetryingRef,
          ...overrides,
        }),
      {},
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    retryGenerationRef.current = 0;
    hasStartedSendBundleSubmission.current = false;
    isRetryingRef.current = false;
    mockCancelCurrentBatch.mockResolvedValue(undefined);
    mockRetrySendBundleSubmission.mockResolvedValue(undefined);
    mockRetrySubmission.mockResolvedValue(undefined);
    mockUseHardwareWalletState.mockReturnValue({
      connectionState: { status: ConnectionStatus.Connected },
    });
  });

  describe('handleRetry', () => {
    it('cancels the current batch, resets state, and retries bridge submission', async () => {
      const { result } = renderUseHwSwapActions();

      await act(async () => {
        await result.current.handleRetry();
      });

      expect(mockCancelCurrentBatch).toHaveBeenCalledTimes(1);
      expect(mockResetConnectionError).toHaveBeenCalledTimes(1);
      expect(mockDispatchSignatureEvent).toHaveBeenCalledWith({
        type: HardwareWalletSignatureEvent.Reset,
        needsTwoConfirmations: true,
      });
      expect(mockRetrySubmission).toHaveBeenCalledTimes(1);
      expect(mockRetrySendBundleSubmission).not.toHaveBeenCalled();
      expect(result.current.hasRetriedRef.current).toBe(true);
      expect(isRetryingRef.current).toBe(false);
      expect(result.current.isRetrying).toBe(false);
    });

    it('retries sendBundle submission when in the sendBundle flow', async () => {
      const { result } = renderUseHwSwapActions({
        isSendBundleFlow: true,
      });

      await act(async () => {
        await result.current.handleRetry();
      });

      expect(hasStartedSendBundleSubmission.current).toBe(true);
      expect(mockRetrySendBundleSubmission).toHaveBeenCalledTimes(1);
      expect(mockRetrySubmission).not.toHaveBeenCalled();
    });

    it('dispatches Retry when the interrupted step was the final signature', async () => {
      const { result } = renderUseHwSwapActions({
        signatureState: createSignatureState(
          HardwareWalletSignatureStatus.Rejected,
          HardwareWalletSignatureStatus.AwaitingFinalSignature,
        ),
      });

      await act(async () => {
        await result.current.handleRetry();
      });

      expect(mockDispatchSignatureEvent).toHaveBeenCalledWith({
        type: HardwareWalletSignatureEvent.Retry,
      });
    });

    it('dispatches Retry when already awaiting the final signature (stuck resend)', async () => {
      const { result } = renderUseHwSwapActions({
        signatureState: createSignatureState(
          HardwareWalletSignatureStatus.AwaitingFinalSignature,
        ),
      });

      await act(async () => {
        await result.current.handleRetry();
      });

      expect(mockDispatchSignatureEvent).toHaveBeenCalledWith({
        type: HardwareWalletSignatureEvent.Retry,
      });
      expect(mockDispatchSignatureEvent).not.toHaveBeenCalledWith({
        type: HardwareWalletSignatureEvent.Reset,
        needsTwoConfirmations: true,
      });
    });

    it('always resets when smart transactions are enabled', async () => {
      const { result } = renderUseHwSwapActions({
        isStxEnabled: true,
        signatureState: createSignatureState(
          HardwareWalletSignatureStatus.Rejected,
          HardwareWalletSignatureStatus.AwaitingFinalSignature,
        ),
      });

      await act(async () => {
        await result.current.handleRetry();
      });

      expect(mockDispatchSignatureEvent).toHaveBeenCalledWith({
        type: HardwareWalletSignatureEvent.Reset,
        needsTwoConfirmations: true,
      });
    });

    it('does not resubmit when the device is not in a retryable connection state', async () => {
      mockUseHardwareWalletState.mockReturnValue({
        connectionState: { status: ConnectionStatus.Connecting },
      });

      const { result } = renderUseHwSwapActions();

      await act(async () => {
        await result.current.handleRetry();
      });

      expect(mockCancelCurrentBatch).toHaveBeenCalledTimes(1);
      expect(mockRetrySubmission).not.toHaveBeenCalled();
      expect(mockResetConnectionError).not.toHaveBeenCalled();
    });

    it('ignores a second retry while one is already in flight', async () => {
      let resolveCancel: (() => void) | undefined;
      mockCancelCurrentBatch.mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            resolveCancel = resolve;
          }),
      );

      const { result } = renderUseHwSwapActions();

      let firstRetry: Promise<void> | undefined;
      await act(async () => {
        firstRetry = result.current.handleRetry();
      });

      await act(async () => {
        await result.current.handleRetry();
      });

      expect(mockCancelCurrentBatch).toHaveBeenCalledTimes(1);

      await act(async () => {
        resolveCancel?.();
        await firstRetry;
      });
    });

    it('suppresses old-batch errors only during cancel, not during resubmit', async () => {
      let isRetryingDuringCancel: boolean | undefined;
      let isRetryingDuringResubmit: boolean | undefined;

      mockCancelCurrentBatch.mockImplementation(async () => {
        isRetryingDuringCancel = isRetryingRef.current;
      });
      mockRetrySubmission.mockImplementation(async () => {
        isRetryingDuringResubmit = isRetryingRef.current;
      });

      const { result } = renderUseHwSwapActions();

      await act(async () => {
        await result.current.handleRetry();
      });

      expect(isRetryingDuringCancel).toBe(true);
      expect(isRetryingDuringResubmit).toBe(false);
      expect(isRetryingRef.current).toBe(false);
    });
  });

  describe('handleCancel', () => {
    it('cancels the batch and navigates to the bridge page for swap flow', async () => {
      const { result } = renderUseHwSwapActions();

      await act(async () => {
        await result.current.handleCancel();
      });

      expect(mockCancelCurrentBatch).toHaveBeenCalledTimes(1);
      expect(mockHandleQrSignatureCancel).toHaveBeenCalledTimes(1);
      expect(mockNavigateToBridgePage).toHaveBeenCalledTimes(1);
      expect(mockNavigate).not.toHaveBeenCalled();
      expect(mockCleanupPendingApproval).not.toHaveBeenCalled();
    });

    it('rejects the pending approval and navigates to the return route for sendBundle', async () => {
      const { result } = renderUseHwSwapActions({
        isSendBundleFlow: true,
        returnRoute: '/send',
        currentApprovalRequestId: 'approval-1',
      });

      await act(async () => {
        await result.current.handleCancel();
      });

      expect(mockCleanupPendingApproval).toHaveBeenCalledWith(
        expect.any(Function),
        'approval-1',
      );
      expect(mockNavigate).toHaveBeenCalledWith('/send', { replace: true });
      expect(mockNavigateToBridgePage).not.toHaveBeenCalled();
    });

    it('navigates to the default route when sendBundle cancel has no return route', async () => {
      const { result } = renderUseHwSwapActions({
        isSendBundleFlow: true,
        returnRoute: undefined,
      });

      await act(async () => {
        await result.current.handleCancel();
      });

      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    });
  });
});
