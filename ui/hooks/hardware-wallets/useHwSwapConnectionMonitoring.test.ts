import {
  Category,
  ErrorCode,
  HardwareWalletError,
  Severity,
} from '@metamask/hw-wallet-sdk';
import { ConnectionStatus } from '../../contexts/hardware-wallets/types';
import {
  HardwareWalletSignatureEvent,
  HardwareWalletSignatureStatus,
} from '../../pages/hardware-wallets/swap/hardware-wallet-signatures-state-machine/types';
import { createSignatureState } from '../../pages/hardware-wallets/swap/hardware-wallet-signatures-state-machine/test-helpers';
import { renderHookWithProvider } from '../../../test/lib/render-helpers-navigate';
import { useHwSwapConnectionMonitoring } from './useHwSwapConnectionMonitoring';

jest.mock('../../contexts/hardware-wallets/HardwareWalletContext', () => ({
  ...jest.requireActual(
    '../../contexts/hardware-wallets/HardwareWalletContext',
  ),
  useHardwareWalletState: jest.fn(),
}));

jest.mock(
  '../../pages/hardware-wallets/swap/hardware-wallet-signatures.utils',
  () => ({
    ...jest.requireActual(
      '../../pages/hardware-wallets/swap/hardware-wallet-signatures.utils',
    ),
    getHardwareWalletSignatureErrorEvent: jest.fn(),
  }),
);

const mockUseHardwareWalletState = {
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get ConnectionState() {
    return jest.requireMock('../../contexts/hardware-wallets/connectionState')
      .ConnectionState;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get ConnectionStatus() {
    return jest.requireMock('../../contexts/hardware-wallets/types')
      .ConnectionStatus;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get DeviceEvent() {
    return jest.requireMock('../../contexts/hardware-wallets/types')
      .DeviceEvent;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get HardwareConnectionPermissionState() {
    return jest.requireMock('../../contexts/hardware-wallets/types')
      .HardwareConnectionPermissionState;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get HardwareWalletErrorProvider() {
    return jest.requireMock(
      '../../contexts/hardware-wallets/HardwareWalletErrorProvider',
    ).HardwareWalletErrorProvider;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get HardwareWalletProvider() {
    return jest.requireMock(
      '../../contexts/hardware-wallets/HardwareWalletContext',
    ).HardwareWalletProvider;
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get HardwareWalletType() {
    return jest.requireMock('../../../shared/lib/hardware-wallets/types')
      .HardwareWalletType;
  },
  get checkCameraPermission() {
    return jest.requireMock(
      '../../contexts/hardware-wallets/webConnectionUtils',
    ).checkCameraPermission;
  },
  get checkCameraPermissionState() {
    return jest.requireMock(
      '../../contexts/hardware-wallets/webConnectionUtils',
    ).checkCameraPermissionState;
  },
  get checkHardwareWalletPermission() {
    return jest.requireMock(
      '../../contexts/hardware-wallets/webConnectionUtils',
    ).checkHardwareWalletPermission;
  },
  get checkWebHidPermission() {
    return jest.requireMock(
      '../../contexts/hardware-wallets/webConnectionUtils',
    ).checkWebHidPermission;
  },
  get checkWebUsbPermission() {
    return jest.requireMock(
      '../../contexts/hardware-wallets/webConnectionUtils',
    ).checkWebUsbPermission;
  },
  get createHardwareWalletError() {
    return jest.requireMock('../../../shared/lib/hardware-wallets/errors')
      .createHardwareWalletError;
  },
  get extractMessageFromUnknownError() {
    return jest.requireMock('../../../shared/lib/error')
      .extractMessageFromUnknownError;
  },
  get extractTrezorCodeFromMessage() {
    return jest.requireMock(
      '../../../shared/lib/hardware-wallets/rpc-error-utils',
    ).extractTrezorCodeFromMessage;
  },
  get getConnectedDevices() {
    return jest.requireMock(
      '../../contexts/hardware-wallets/webConnectionUtils',
    ).getConnectedDevices;
  },
  get getConnectedLedgerDevices() {
    return jest.requireMock(
      '../../contexts/hardware-wallets/webConnectionUtils',
    ).getConnectedLedgerDevices;
  },
  get getConnectedTrezorDevices() {
    return jest.requireMock(
      '../../contexts/hardware-wallets/webConnectionUtils',
    ).getConnectedTrezorDevices;
  },
  get getDeviceEventForError() {
    return jest.requireMock('../../contexts/hardware-wallets/errors')
      .getDeviceEventForError;
  },
  get getHardwareWalletErrorCode() {
    return jest.requireMock(
      '../../../shared/lib/hardware-wallets/rpc-error-utils',
    ).getHardwareWalletErrorCode;
  },
  get handleContinueWithPermissionCheck() {
    return jest.requireMock(
      '../../contexts/hardware-wallets/webConnectionUtils',
    ).handleContinueWithPermissionCheck;
  },
  get hasUserRejectedMessage() {
    return jest.requireMock(
      '../../../shared/lib/hardware-wallets/rpc-error-utils',
    ).hasUserRejectedMessage;
  },
  get isCameraAvailable() {
    return jest.requireMock(
      '../../contexts/hardware-wallets/webConnectionUtils',
    ).isCameraAvailable;
  },
  get isHardwareConnectionReadyForConfirmFooter() {
    return jest.requireMock('../../contexts/hardware-wallets/useHardwareFooter')
      .isHardwareConnectionReadyForConfirmFooter;
  },
  get isHardwareWalletError() {
    return jest.requireMock(
      '../../../shared/lib/hardware-wallets/rpc-error-utils',
    ).isHardwareWalletError;
  },
  get isInE2eTest() {
    return jest.requireMock('../../contexts/hardware-wallets/is-in-e2e-test')
      .isInE2eTest;
  },
  get isJsonRpcHardwareWalletError() {
    return jest.requireMock(
      '../../../shared/lib/hardware-wallets/rpc-error-utils',
    ).isJsonRpcHardwareWalletError;
  },
  get isRestrictedCameraEnvironment() {
    return jest.requireMock(
      '../../contexts/hardware-wallets/webConnectionUtils',
    ).isRestrictedCameraEnvironment;
  },
  get isRetryableHardwareWalletError() {
    return jest.requireMock('../../contexts/hardware-wallets/errors')
      .isRetryableHardwareWalletError;
  },
  get isTrezorDesktopConnectionMissingError() {
    return jest.requireMock(
      '../../../shared/lib/hardware-wallets/rpc-error-utils',
    ).isTrezorDesktopConnectionMissingError;
  },
  get isUserRejectedHardwareWalletError() {
    return jest.requireMock(
      '../../../shared/lib/hardware-wallets/rpc-error-utils',
    ).isUserRejectedHardwareWalletError;
  },
  get isWebHidAvailable() {
    return jest.requireMock(
      '../../contexts/hardware-wallets/webConnectionUtils',
    ).isWebHidAvailable;
  },
  get isWebUsbAvailable() {
    return jest.requireMock(
      '../../contexts/hardware-wallets/webConnectionUtils',
    ).isWebUsbAvailable;
  },
  get openCameraVideoStream() {
    return jest.requireMock(
      '../../contexts/hardware-wallets/webConnectionUtils',
    ).openCameraVideoStream;
  },
  get queryCameraPermissionWithStatus() {
    return jest.requireMock(
      '../../contexts/hardware-wallets/webConnectionUtils',
    ).queryCameraPermissionWithStatus;
  },
  get redirectToFullscreen() {
    return jest.requireMock(
      '../../contexts/hardware-wallets/webConnectionUtils',
    ).redirectToFullscreen;
  },
  get requestCameraPermission() {
    return jest.requireMock(
      '../../contexts/hardware-wallets/webConnectionUtils',
    ).requestCameraPermission;
  },
  get requestHardwareWalletPermission() {
    return jest.requireMock(
      '../../contexts/hardware-wallets/webConnectionUtils',
    ).requestHardwareWalletPermission;
  },
  get requestWebHidDevices() {
    return jest.requireMock(
      '../../contexts/hardware-wallets/webConnectionUtils',
    ).requestWebHidDevices;
  },
  get requestWebHidPermission() {
    return jest.requireMock(
      '../../contexts/hardware-wallets/webConnectionUtils',
    ).requestWebHidPermission;
  },
  get requestWebUsbPermission() {
    return jest.requireMock(
      '../../contexts/hardware-wallets/webConnectionUtils',
    ).requestWebUsbPermission;
  },
  get stopMediaStreamTracks() {
    return jest.requireMock(
      '../../contexts/hardware-wallets/webConnectionUtils',
    ).stopMediaStreamTracks;
  },
  get subscribeToHardwareWalletEvents() {
    return jest.requireMock(
      '../../contexts/hardware-wallets/webConnectionUtils',
    ).subscribeToHardwareWalletEvents;
  },
  get subscribeToWebHidEvents() {
    return jest.requireMock(
      '../../contexts/hardware-wallets/webConnectionUtils',
    ).subscribeToWebHidEvents;
  },
  get subscribeToWebUsbEvents() {
    return jest.requireMock(
      '../../contexts/hardware-wallets/webConnectionUtils',
    ).subscribeToWebUsbEvents;
  },
  get toHardwareWalletError() {
    return jest.requireMock(
      '../../../shared/lib/hardware-wallets/rpc-error-utils',
    ).toHardwareWalletError;
  },
  get useHardwareFooter() {
    return jest.requireMock('../../contexts/hardware-wallets/useHardwareFooter')
      .useHardwareFooter;
  },
  get useHardwareWallet() {
    return jest.requireMock(
      '../../contexts/hardware-wallets/HardwareWalletContext',
    ).useHardwareWallet;
  },
  get useHardwareWalletActions() {
    return jest.requireMock(
      '../../contexts/hardware-wallets/HardwareWalletContext',
    ).useHardwareWalletActions;
  },
  get useHardwareWalletConfig() {
    return jest.requireMock(
      '../../contexts/hardware-wallets/HardwareWalletContext',
    ).useHardwareWalletConfig;
  },
  get useHardwareWalletError() {
    return jest.requireMock(
      '../../contexts/hardware-wallets/HardwareWalletErrorProvider',
    ).useHardwareWalletError;
  },
  get useHardwareWalletMetrics() {
    return jest.requireMock(
      '../../contexts/hardware-wallets/useHardwareWalletMetrics',
    ).useHardwareWalletMetrics;
  },
  get useHardwareWalletState() {
    return jest.requireMock(
      '../../contexts/hardware-wallets/HardwareWalletContext',
    ).useHardwareWalletState;
  },
}.useHardwareWalletState;
const mockGetHardwareWalletSignatureErrorEvent = {
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get SignatureStepStatus() {
    return jest.requireMock('../../pages/hardware-wallets/swap/types')
      .SignatureStepStatus;
  },
  get cleanupPendingApproval() {
    return jest.requireMock(
      '../../pages/hardware-wallets/swap/hardware-wallet-signatures.utils',
    ).cleanupPendingApproval;
  },
  get getAllStepStatuses() {
    return jest.requireMock(
      '../../pages/hardware-wallets/swap/hardware-wallet-signatures.utils',
    ).getAllStepStatuses;
  },
  get getFinalStepDescription() {
    return jest.requireMock(
      '../../pages/hardware-wallets/swap/hardware-wallet-signatures.utils',
    ).getFinalStepDescription;
  },
  get getFinalStepLabel() {
    return jest.requireMock(
      '../../pages/hardware-wallets/swap/hardware-wallet-signatures.utils',
    ).getFinalStepLabel;
  },
  get getFirstStepDescription() {
    return jest.requireMock(
      '../../pages/hardware-wallets/swap/hardware-wallet-signatures.utils',
    ).getFirstStepDescription;
  },
  get getHardwareWalletSignatureErrorEvent() {
    return jest.requireMock(
      '../../pages/hardware-wallets/swap/hardware-wallet-signatures.utils',
    ).getHardwareWalletSignatureErrorEvent;
  },
  get getHardwareWalletSignatureViewModel() {
    return jest.requireMock(
      '../../pages/hardware-wallets/swap/hardware-wallet-signatures.utils',
    ).getHardwareWalletSignatureViewModel;
  },
  get getQrHardwareSigningPageTitle() {
    return jest.requireMock(
      '../../pages/hardware-wallets/swap/hardware-wallet-signatures.utils',
    ).getQrHardwareSigningPageTitle;
  },
  get getQrScanButtonLabelKey() {
    return jest.requireMock(
      '../../pages/hardware-wallets/swap/hardware-wallet-signatures.utils',
    ).getQrScanButtonLabelKey;
  },
  get getSignatureStepDescriptionLines() {
    return jest.requireMock(
      '../../pages/hardware-wallets/swap/hardware-wallet-signatures.utils',
    ).getSignatureStepDescriptionLines;
  },
  get getStepDescriptions() {
    return jest.requireMock(
      '../../pages/hardware-wallets/swap/hardware-wallet-signatures.utils',
    ).getStepDescriptions;
  },
  get getStepLabelColor() {
    return jest.requireMock(
      '../../pages/hardware-wallets/swap/hardware-wallet-signatures.utils',
    ).getStepLabelColor;
  },
  get getStepLabels() {
    return jest.requireMock(
      '../../pages/hardware-wallets/swap/hardware-wallet-signatures.utils',
    ).getStepLabels;
  },
  get getStepStatus() {
    return jest.requireMock(
      '../../pages/hardware-wallets/swap/hardware-wallet-signatures.utils',
    ).getStepStatus;
  },
  get getTitle() {
    return jest.requireMock(
      '../../pages/hardware-wallets/swap/hardware-wallet-signatures.utils',
    ).getTitle;
  },
  get getTransactionField() {
    return jest.requireMock(
      '../../pages/hardware-wallets/swap/hardware-wallet-signatures.utils',
    ).getTransactionField;
  },
  get hasApprovalTxForRequestId() {
    return jest.requireMock(
      '../../pages/hardware-wallets/swap/hardware-wallet-signatures.utils',
    ).hasApprovalTxForRequestId;
  },
  get isAwaitingSignature() {
    return jest.requireMock(
      '../../pages/hardware-wallets/swap/hardware-wallet-signatures.utils',
    ).isAwaitingSignature;
  },
  get isErrorStepStatus() {
    return jest.requireMock(
      '../../pages/hardware-wallets/swap/hardware-wallet-signatures.utils',
    ).isErrorStepStatus;
  },
  get isQrHardwareSignRequest() {
    return jest.requireMock(
      '../../pages/hardware-wallets/swap/hardware-wallet-signatures.utils',
    ).isQrHardwareSignRequest;
  },
}.getHardwareWalletSignatureErrorEvent;

describe('useHwSwapConnectionMonitoring', () => {
  const mockDispatchSignatureEvent = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseHardwareWalletState.mockReturnValue({
      connectionState: { status: ConnectionStatus.Ready },
    });
    mockGetHardwareWalletSignatureErrorEvent.mockReturnValue({
      type: HardwareWalletSignatureEvent.TransactionFailed,
    });
  });

  it('dispatches DeviceDisconnected when connection status is Disconnected', () => {
    mockUseHardwareWalletState.mockReturnValue({
      connectionState: { status: ConnectionStatus.Disconnected },
    });

    renderHookWithProvider(
      () =>
        useHwSwapConnectionMonitoring({
          signatureState: createSignatureState(
            HardwareWalletSignatureStatus.AwaitingFirstSignature,
          ),
          dispatchSignatureEvent: mockDispatchSignatureEvent,
        }),
      {},
    );

    expect(mockDispatchSignatureEvent).toHaveBeenCalledWith({
      type: HardwareWalletSignatureEvent.DeviceDisconnected,
    });
  });

  it('does not dispatch DeviceDisconnected twice for same disconnection', () => {
    mockUseHardwareWalletState.mockReturnValue({
      connectionState: { status: ConnectionStatus.Disconnected },
    });

    const { rerender } = renderHookWithProvider(
      () =>
        useHwSwapConnectionMonitoring({
          signatureState: createSignatureState(
            HardwareWalletSignatureStatus.AwaitingFirstSignature,
          ),
          dispatchSignatureEvent: mockDispatchSignatureEvent,
        }),
      {},
    );

    expect(mockDispatchSignatureEvent).toHaveBeenCalledTimes(1);

    rerender();

    expect(mockDispatchSignatureEvent).toHaveBeenCalledTimes(1);
  });

  it('dispatches DeviceDisconnected when error code is ConnectionClosed', () => {
    const error = new Error('connection closed');
    mockUseHardwareWalletState.mockReturnValue({
      connectionState: { status: ConnectionStatus.ErrorState, error },
    });
    mockGetHardwareWalletSignatureErrorEvent.mockReturnValue({
      type: HardwareWalletSignatureEvent.DeviceDisconnected,
    });

    renderHookWithProvider(
      () =>
        useHwSwapConnectionMonitoring({
          signatureState: createSignatureState(
            HardwareWalletSignatureStatus.AwaitingFirstSignature,
          ),
          dispatchSignatureEvent: mockDispatchSignatureEvent,
        }),
      {},
    );

    expect(mockDispatchSignatureEvent).toHaveBeenCalledWith({
      type: HardwareWalletSignatureEvent.DeviceDisconnected,
    });
  });

  it('dispatches DeviceDisconnected when error code is DeviceDisconnected', () => {
    const error = new Error('device disconnected');
    mockUseHardwareWalletState.mockReturnValue({
      connectionState: { status: ConnectionStatus.ErrorState, error },
    });
    mockGetHardwareWalletSignatureErrorEvent.mockReturnValue({
      type: HardwareWalletSignatureEvent.DeviceDisconnected,
    });

    renderHookWithProvider(
      () =>
        useHwSwapConnectionMonitoring({
          signatureState: createSignatureState(
            HardwareWalletSignatureStatus.AwaitingFirstSignature,
          ),
          dispatchSignatureEvent: mockDispatchSignatureEvent,
        }),
      {},
    );

    expect(mockDispatchSignatureEvent).toHaveBeenCalledWith({
      type: HardwareWalletSignatureEvent.DeviceDisconnected,
    });
  });

  it('does not dispatch when error code is DeviceStateEthAppClosed', () => {
    const error = new HardwareWalletError('Ethereum app is not open', {
      code: ErrorCode.DeviceStateEthAppClosed,
      severity: Severity.Err,
      category: Category.DeviceState,
      userMessage: 'Ethereum app is not open',
    });
    mockUseHardwareWalletState.mockReturnValue({
      connectionState: { status: ConnectionStatus.ErrorState, error },
    });
    mockGetHardwareWalletSignatureErrorEvent.mockReturnValue(null);

    renderHookWithProvider(
      () =>
        useHwSwapConnectionMonitoring({
          signatureState: createSignatureState(
            HardwareWalletSignatureStatus.AwaitingFirstSignature,
          ),
          dispatchSignatureEvent: mockDispatchSignatureEvent,
        }),
      {},
    );

    expect(mockDispatchSignatureEvent).not.toHaveBeenCalled();
  });

  it('dispatches TransactionRejected when user rejected error', () => {
    const error = new Error('user rejected');
    mockUseHardwareWalletState.mockReturnValue({
      connectionState: { status: ConnectionStatus.ErrorState, error },
    });
    mockGetHardwareWalletSignatureErrorEvent.mockReturnValue({
      type: HardwareWalletSignatureEvent.TransactionRejected,
    });

    renderHookWithProvider(
      () =>
        useHwSwapConnectionMonitoring({
          signatureState: createSignatureState(
            HardwareWalletSignatureStatus.AwaitingFirstSignature,
          ),
          dispatchSignatureEvent: mockDispatchSignatureEvent,
        }),
      {},
    );

    expect(mockDispatchSignatureEvent).toHaveBeenCalledWith({
      type: HardwareWalletSignatureEvent.TransactionRejected,
    });
  });

  it('dispatches TransactionFailed for non-user-rejected errors', () => {
    const error = new Error('some error');
    mockUseHardwareWalletState.mockReturnValue({
      connectionState: { status: ConnectionStatus.ErrorState, error },
    });

    renderHookWithProvider(
      () =>
        useHwSwapConnectionMonitoring({
          signatureState: createSignatureState(
            HardwareWalletSignatureStatus.AwaitingFinalSignature,
          ),
          dispatchSignatureEvent: mockDispatchSignatureEvent,
        }),
      {},
    );

    expect(mockDispatchSignatureEvent).toHaveBeenCalledWith({
      type: HardwareWalletSignatureEvent.TransactionFailed,
    });
  });

  it('marks device-unavailable errors as disconnected', () => {
    const error = new Error('device locked');
    mockUseHardwareWalletState.mockReturnValue({
      connectionState: { status: ConnectionStatus.ErrorState, error },
    });
    mockGetHardwareWalletSignatureErrorEvent.mockReturnValue({
      type: HardwareWalletSignatureEvent.DeviceDisconnected,
    });

    const { result } = renderHookWithProvider(
      () =>
        useHwSwapConnectionMonitoring({
          signatureState: createSignatureState(
            HardwareWalletSignatureStatus.AwaitingFirstSignature,
          ),
          dispatchSignatureEvent: mockDispatchSignatureEvent,
        }),
      {},
    );

    expect(mockGetHardwareWalletSignatureErrorEvent).toHaveBeenCalledWith(
      error,
    );
    expect(result.current.isDeviceDisconnectedRef.current).toBe(true);
  });

  it('does not dispatch when signatureState is not awaiting', () => {
    mockUseHardwareWalletState.mockReturnValue({
      connectionState: { status: ConnectionStatus.Disconnected },
    });

    renderHookWithProvider(
      () =>
        useHwSwapConnectionMonitoring({
          signatureState: createSignatureState(
            HardwareWalletSignatureStatus.Submitted,
          ),
          dispatchSignatureEvent: mockDispatchSignatureEvent,
        }),
      {},
    );

    expect(mockDispatchSignatureEvent).not.toHaveBeenCalled();
  });

  it('does not dispatch when connection state is Ready', () => {
    mockUseHardwareWalletState.mockReturnValue({
      connectionState: { status: ConnectionStatus.Ready },
    });

    renderHookWithProvider(
      () =>
        useHwSwapConnectionMonitoring({
          signatureState: createSignatureState(
            HardwareWalletSignatureStatus.AwaitingFirstSignature,
          ),
          dispatchSignatureEvent: mockDispatchSignatureEvent,
        }),
      {},
    );

    expect(mockDispatchSignatureEvent).not.toHaveBeenCalled();
  });

  it('returns isDeviceDisconnectedRef and resetConnectionError', () => {
    mockUseHardwareWalletState.mockReturnValue({
      connectionState: { status: ConnectionStatus.Ready },
    });

    const { result } = renderHookWithProvider(
      () =>
        useHwSwapConnectionMonitoring({
          signatureState: createSignatureState(
            HardwareWalletSignatureStatus.AwaitingFirstSignature,
          ),
          dispatchSignatureEvent: mockDispatchSignatureEvent,
        }),
      {},
    );

    expect(result.current.isDeviceDisconnectedRef).toBeDefined();
    expect(result.current.resetConnectionError).toBeInstanceOf(Function);
  });

  it('resets connection error via resetConnectionError callback', () => {
    mockUseHardwareWalletState.mockReturnValue({
      connectionState: { status: ConnectionStatus.Disconnected },
    });

    const { result } = renderHookWithProvider(
      () =>
        useHwSwapConnectionMonitoring({
          signatureState: createSignatureState(
            HardwareWalletSignatureStatus.AwaitingFirstSignature,
          ),
          dispatchSignatureEvent: mockDispatchSignatureEvent,
        }),
      {},
    );

    expect(result.current.isDeviceDisconnectedRef.current).toBe(true);

    result.current.resetConnectionError();

    expect(result.current.isDeviceDisconnectedRef.current).toBe(false);
  });

  it('sets isDeviceDisconnectedRef to true on disconnection', () => {
    mockUseHardwareWalletState.mockReturnValue({
      connectionState: { status: ConnectionStatus.Disconnected },
    });

    const { result } = renderHookWithProvider(
      () =>
        useHwSwapConnectionMonitoring({
          signatureState: createSignatureState(
            HardwareWalletSignatureStatus.AwaitingFirstSignature,
          ),
          dispatchSignatureEvent: mockDispatchSignatureEvent,
        }),
      {},
    );

    expect(result.current.isDeviceDisconnectedRef.current).toBe(true);
  });

  describe('e2e mode', () => {
    let originalInTest: string | undefined;
    let originalJestWorkerId: string | undefined;

    beforeEach(() => {
      originalInTest = process.env.IN_TEST;
      originalJestWorkerId = process.env.JEST_WORKER_ID;
      process.env.IN_TEST = 'true';
      process.env.JEST_WORKER_ID = 'undefined';
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

    it('does not dispatch when the device appears disconnected', () => {
      mockUseHardwareWalletState.mockReturnValue({
        connectionState: { status: ConnectionStatus.Disconnected },
      });

      const { result } = renderHookWithProvider(
        () =>
          useHwSwapConnectionMonitoring({
            signatureState: createSignatureState(
              HardwareWalletSignatureStatus.AwaitingFirstSignature,
            ),
            dispatchSignatureEvent: mockDispatchSignatureEvent,
          }),
        {},
      );

      expect(mockDispatchSignatureEvent).not.toHaveBeenCalled();
      expect(result.current.isDeviceDisconnectedRef.current).toBe(false);
    });

    it('does not dispatch on connection errors', () => {
      const error = new Error('device disconnected');
      mockUseHardwareWalletState.mockReturnValue({
        connectionState: { status: ConnectionStatus.ErrorState, error },
      });

      renderHookWithProvider(
        () =>
          useHwSwapConnectionMonitoring({
            signatureState: createSignatureState(
              HardwareWalletSignatureStatus.AwaitingFirstSignature,
            ),
            dispatchSignatureEvent: mockDispatchSignatureEvent,
          }),
        {},
      );

      expect(mockDispatchSignatureEvent).not.toHaveBeenCalled();
    });
  });
});
