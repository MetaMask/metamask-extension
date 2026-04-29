import { renderHook, act } from '@testing-library/react-hooks';
import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import {
  useHardwareWalletActions,
  useHardwareWalletConfig,
  useHardwareWalletState,
} from './HardwareWalletContext';
import { useHardwareWalletError } from './HardwareWalletErrorProvider';
import {
  isHardwareWalletError,
  isUserRejectedHardwareWalletError,
} from './rpcErrorUtils';
import { useHardwareFooter } from './useHardwareFooter';
import { useHardwareWalletMetrics } from './useHardwareWalletMetrics';
import {
  ConnectionStatus,
  HardwareConnectionPermissionState,
  HardwareWalletType,
} from './types';

jest.mock('./useHardwareWalletMetrics', () => ({
  useHardwareWalletMetrics: jest.fn(),
}));

jest.mock('./HardwareWalletContext', () => ({
  useHardwareWalletState: jest.fn(),
  useHardwareWalletConfig: jest.fn(),
  useHardwareWalletActions: jest.fn(),
}));

jest.mock('./HardwareWalletErrorProvider', () => ({
  useHardwareWalletError: jest.fn(),
}));

jest.mock('./rpcErrorUtils', () => ({
  isHardwareWalletError: jest.fn(),
  isUserRejectedHardwareWalletError: jest.fn(),
}));

const mockUseHardwareWalletMetrics = jest.mocked(useHardwareWalletMetrics);

describe('useHardwareFooter', () => {
  let mockConnectionState: { status: ConnectionStatus };
  let mockEnsureDeviceReady: jest.Mock<Promise<boolean>, [unknown?]>;
  let mockShowErrorModal: jest.Mock;
  let mockTrackConnectCtaClicked: jest.Mock;
  let mockOnUserRejectedHardwareWalletError: jest.Mock<
    Promise<void>,
    [],
    unknown
  >;
  let originalInTest: string | undefined;
  let originalJestWorkerId: string | undefined;

  beforeEach(() => {
    jest.clearAllMocks();

    originalInTest = process.env.IN_TEST;
    originalJestWorkerId = process.env.JEST_WORKER_ID;
    delete process.env.IN_TEST;
    delete process.env.JEST_WORKER_ID;

    mockConnectionState = {
      status: ConnectionStatus.Ready,
    };
    mockEnsureDeviceReady = jest.fn();
    mockShowErrorModal = jest.fn();
    mockOnUserRejectedHardwareWalletError = jest
      .fn()
      .mockResolvedValue(undefined);

    (useHardwareWalletState as jest.Mock).mockReturnValue({
      connectionState: mockConnectionState,
    });
    (useHardwareWalletConfig as jest.Mock).mockReturnValue({
      isHardwareWalletAccount: true,
      walletType: HardwareWalletType.Ledger,
      hardwareConnectionPermissionState:
        HardwareConnectionPermissionState.Unknown,
    });
    (useHardwareWalletActions as jest.Mock).mockReturnValue({
      ensureDeviceReady: mockEnsureDeviceReady,
    });
    (useHardwareWalletError as jest.Mock).mockReturnValue({
      showErrorModal: mockShowErrorModal,
    });
    (isHardwareWalletError as jest.Mock).mockReturnValue(false);
    (isUserRejectedHardwareWalletError as jest.Mock).mockReturnValue(false);

    mockTrackConnectCtaClicked = jest.fn();
    mockUseHardwareWalletMetrics.mockReturnValue({
      trackConnectCtaClicked: mockTrackConnectCtaClicked,
    });
  });

  afterEach(() => {
    if (originalInTest === undefined) {
      delete process.env.IN_TEST;
    } else {
      process.env.IN_TEST = originalInTest;
    }

    if (originalJestWorkerId === undefined) {
      delete process.env.JEST_WORKER_ID;
    } else {
      process.env.JEST_WORKER_ID = originalJestWorkerId;
    }
  });

  const createConfirmation = (type: TransactionType): TransactionMeta =>
    ({
      id: 'confirmation-id',
      type,
    }) as TransactionMeta;

  const renderUseHardwareFooter = ({
    currentConfirmation = createConfirmation(TransactionType.simpleSend),
    currentConfirmationId = 'confirmation-id',
  }: {
    currentConfirmation?: TransactionMeta;
    currentConfirmationId?: string;
  } = {}) =>
    renderHook(
      (props) =>
        useHardwareFooter({
          ...props,
          onUserRejectedHardwareWalletError:
            mockOnUserRejectedHardwareWalletError,
        }),
      {
        initialProps: {
          currentConfirmation,
          currentConfirmationId,
        },
      },
    );

  describe('preflight state', () => {
    it('returns preflight disabled and ready for non-hardware wallet accounts', () => {
      (useHardwareWalletConfig as jest.Mock).mockReturnValue({
        isHardwareWalletAccount: false,
        walletType: null,
      });
      mockConnectionState.status = ConnectionStatus.Disconnected;

      const { result } = renderUseHardwareFooter();

      expect(result.current.walletType).toBeNull();
      expect(result.current.shouldRunHardwareWalletPreflight).toBe(false);
      expect(result.current.isHardwareWalletReady).toBe(true);
    });

    it('returns preflight enabled for hardware transaction confirmations', () => {
      const { result } = renderUseHardwareFooter({
        currentConfirmation: createConfirmation(TransactionType.simpleSend),
      });

      expect(result.current.shouldRunHardwareWalletPreflight).toBe(true);
    });

    it('returns preflight enabled for hardware signature confirmations', () => {
      const { result } = renderUseHardwareFooter({
        currentConfirmation: createConfirmation(TransactionType.signTypedData),
      });

      expect(result.current.shouldRunHardwareWalletPreflight).toBe(true);
    });

    it('treats Connected transport as ready for footer CTA before ensureDeviceReady', () => {
      mockConnectionState.status = ConnectionStatus.Connected;

      const { result } = renderUseHardwareFooter();

      expect(result.current.isHardwareWalletReady).toBe(true);
    });

    it('returns preflight disabled in e2e mode', () => {
      process.env.IN_TEST = 'true';
      process.env.JEST_WORKER_ID = 'undefined';

      const { result } = renderUseHardwareFooter();

      expect(result.current.shouldRunHardwareWalletPreflight).toBe(false);
      expect(result.current.isHardwareWalletReady).toBe(true);
    });

    it('returns ready for QR wallet when camera permission is already granted', () => {
      mockConnectionState.status = ConnectionStatus.Disconnected;
      (useHardwareWalletConfig as jest.Mock).mockReturnValue({
        isHardwareWalletAccount: true,
        walletType: HardwareWalletType.Qr,
        hardwareConnectionPermissionState:
          HardwareConnectionPermissionState.Granted,
      });

      const { result } = renderUseHardwareFooter();

      expect(result.current.isHardwareWalletReady).toBe(true);
    });

    it('returns not ready for QR wallet when camera permission is not granted', () => {
      mockConnectionState.status = ConnectionStatus.Disconnected;
      (useHardwareWalletConfig as jest.Mock).mockReturnValue({
        isHardwareWalletAccount: true,
        walletType: HardwareWalletType.Qr,
        hardwareConnectionPermissionState:
          HardwareConnectionPermissionState.Prompt,
      });

      const { result } = renderUseHardwareFooter();

      expect(result.current.isHardwareWalletReady).toBe(false);
    });

    it('returns not ready for QR wallet when camera permission state is unknown', () => {
      mockConnectionState.status = ConnectionStatus.Disconnected;
      (useHardwareWalletConfig as jest.Mock).mockReturnValue({
        isHardwareWalletAccount: true,
        walletType: HardwareWalletType.Qr,
        hardwareConnectionPermissionState:
          HardwareConnectionPermissionState.Unknown,
      });

      const { result } = renderUseHardwareFooter();

      expect(result.current.isHardwareWalletReady).toBe(false);
    });

    it('returns not ready for Ledger even when camera permission is granted', () => {
      mockConnectionState.status = ConnectionStatus.Disconnected;
      (useHardwareWalletConfig as jest.Mock).mockReturnValue({
        isHardwareWalletAccount: true,
        walletType: HardwareWalletType.Ledger,
        hardwareConnectionPermissionState:
          HardwareConnectionPermissionState.Granted,
      });

      const { result } = renderUseHardwareFooter();

      expect(result.current.isHardwareWalletReady).toBe(false);
    });
  });

  describe('onSubmitPreflightCheck', () => {
    it('passes blind-signing disabled for simple sends', async () => {
      mockConnectionState.status = ConnectionStatus.Connected;
      mockEnsureDeviceReady.mockResolvedValue(true);

      const { result } = renderUseHardwareFooter({
        currentConfirmation: createConfirmation(TransactionType.simpleSend),
      });

      await act(async () => {
        await result.current.onSubmitPreflightCheck();
      });

      expect(mockEnsureDeviceReady).toHaveBeenCalledWith({
        requireBlindSigning: false,
      });
      expect(result.current.isHardwareWalletReady).toBe(true);
    });

    it('passes blind-signing required for non-simple requests', async () => {
      mockEnsureDeviceReady.mockResolvedValue(true);

      const { result } = renderUseHardwareFooter({
        currentConfirmation: createConfirmation(TransactionType.signTypedData),
      });

      await act(async () => {
        await result.current.onSubmitPreflightCheck();
      });

      expect(mockEnsureDeviceReady).toHaveBeenCalledWith({
        requireBlindSigning: true,
      });
    });

    it('returns false when the device is not ready', async () => {
      mockConnectionState.status = ConnectionStatus.Connected;
      mockEnsureDeviceReady.mockResolvedValue(false);

      const { result } = renderUseHardwareFooter();

      let isReady = true;
      await act(async () => {
        isReady = await result.current.onSubmitPreflightCheck();
      });

      expect(isReady).toBe(false);
      // Transport remains connected; footer still shows Confirm so the user can retry.
      expect(result.current.isHardwareWalletReady).toBe(true);
    });

    it('returns true without calling the device check in e2e mode', async () => {
      process.env.IN_TEST = 'true';
      process.env.JEST_WORKER_ID = 'undefined';

      const { result } = renderUseHardwareFooter();

      let isReady = false;
      await act(async () => {
        isReady = await result.current.onSubmitPreflightCheck();
      });

      expect(isReady).toBe(true);
      expect(mockEnsureDeviceReady).not.toHaveBeenCalled();
    });

    it('invokes trackConnectCtaClicked when trackConnectCta is true', async () => {
      mockConnectionState.status = ConnectionStatus.Connected;
      mockEnsureDeviceReady.mockResolvedValue(true);

      const { result } = renderHook(() =>
        useHardwareFooter({
          currentConfirmation: createConfirmation(TransactionType.simpleSend),
          currentConfirmationId: 'confirmation-id',
          onUserRejectedHardwareWalletError:
            mockOnUserRejectedHardwareWalletError,
        }),
      );

      await act(async () => {
        await result.current.onSubmitPreflightCheck({ trackConnectCta: true });
      });

      expect(mockTrackConnectCtaClicked).toHaveBeenCalledTimes(1);
      expect(mockEnsureDeviceReady).toHaveBeenCalled();
    });

    it('does not invoke trackConnectCtaClicked when trackConnectCta is omitted', async () => {
      mockConnectionState.status = ConnectionStatus.Connected;
      mockEnsureDeviceReady.mockResolvedValue(true);

      const { result } = renderHook(() =>
        useHardwareFooter({
          currentConfirmation: createConfirmation(TransactionType.simpleSend),
          currentConfirmationId: 'confirmation-id',
          onUserRejectedHardwareWalletError:
            mockOnUserRejectedHardwareWalletError,
        }),
      );

      await act(async () => {
        await result.current.onSubmitPreflightCheck();
      });

      expect(mockTrackConnectCtaClicked).not.toHaveBeenCalled();
    });
  });

  describe('readiness reset behavior', () => {
    it('resets a successful preflight when the confirmation changes', async () => {
      mockConnectionState.status = ConnectionStatus.Connected;
      mockEnsureDeviceReady.mockResolvedValue(true);

      const { result, rerender } = renderUseHardwareFooter({
        currentConfirmationId: 'confirmation-1',
      });

      await act(async () => {
        await result.current.onSubmitPreflightCheck();
      });

      expect(result.current.isHardwareWalletReady).toBe(true);

      await act(async () => {
        rerender({
          currentConfirmation: createConfirmation(TransactionType.simpleSend),
          currentConfirmationId: 'confirmation-2',
        });
      });

      // Transport is still up; confirm CTA stays enabled and preflight runs again on submit.
      expect(result.current.isHardwareWalletReady).toBe(true);
    });

    it('resets a successful preflight when the device disconnects', async () => {
      mockConnectionState.status = ConnectionStatus.Connected;
      mockEnsureDeviceReady.mockResolvedValue(true);

      const { result, rerender } = renderUseHardwareFooter();

      await act(async () => {
        await result.current.onSubmitPreflightCheck();
      });

      expect(result.current.isHardwareWalletReady).toBe(true);

      mockConnectionState.status = ConnectionStatus.Disconnected;

      await act(async () => {
        rerender({
          currentConfirmation: createConfirmation(TransactionType.simpleSend),
          currentConfirmationId: 'confirmation-id',
        });
      });

      expect(result.current.isHardwareWalletReady).toBe(false);
    });
  });

  describe('withHardwareWalletModalHandling', () => {
    it('invokes the request when no error is thrown', async () => {
      const request = jest.fn().mockResolvedValue(undefined);

      const { result } = renderUseHardwareFooter();

      await act(async () => {
        await result.current.withHardwareWalletModalHandling(request)();
      });

      expect(request).toHaveBeenCalledTimes(1);
      expect(mockShowErrorModal).not.toHaveBeenCalled();
    });

    it('rethrows non-hardware wallet errors', async () => {
      const error = new Error('Non hardware wallet error');
      const request = jest.fn().mockRejectedValue(error);

      const { result } = renderUseHardwareFooter();

      await expect(
        result.current.withHardwareWalletModalHandling(request)(),
      ).rejects.toThrow(error);
      expect(mockShowErrorModal).not.toHaveBeenCalled();
    });

    it('calls the rejection callback for user-rejected hardware wallet errors', async () => {
      const error = new Error('User rejected');
      const request = jest.fn().mockRejectedValue(error);
      (isHardwareWalletError as jest.Mock).mockReturnValue(true);
      (isUserRejectedHardwareWalletError as jest.Mock).mockReturnValue(true);

      const { result } = renderUseHardwareFooter();

      await act(async () => {
        await result.current.withHardwareWalletModalHandling(request)();
      });

      expect(mockOnUserRejectedHardwareWalletError).toHaveBeenCalledTimes(1);
      expect(mockShowErrorModal).not.toHaveBeenCalled();
    });

    it('shows the error modal for other hardware wallet errors', async () => {
      const error = new Error('Device locked');
      const request = jest.fn().mockRejectedValue(error);
      (isHardwareWalletError as jest.Mock).mockReturnValue(true);

      const { result } = renderUseHardwareFooter();

      await act(async () => {
        await result.current.withHardwareWalletModalHandling(request)();
      });

      expect(mockShowErrorModal).toHaveBeenCalledWith(error);
      expect(mockOnUserRejectedHardwareWalletError).not.toHaveBeenCalled();
    });
  });
});
