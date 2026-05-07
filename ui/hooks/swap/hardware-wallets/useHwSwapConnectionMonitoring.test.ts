import { ErrorCode } from '@metamask/hw-wallet-sdk';
import { ConnectionStatus } from '../../../contexts/hardware-wallets';
import {
  HardwareWalletSignatureEvent,
  HardwareWalletSignatureStatus,
} from '../../../pages/bridge/hardware-wallets/hardware-wallet-signatures-state-machine';
import { createSignatureState } from '../../../pages/bridge/hardware-wallets/hardware-wallet-signatures-state-machine.test-helpers';
import { renderHookWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { useHwSwapConnectionMonitoring } from './useHwSwapConnectionMonitoring';

jest.mock('../../../contexts/hardware-wallets', () => ({
  ConnectionStatus: {
    Disconnected: 'disconnected',
    Connecting: 'connecting',
    Connected: 'connected',
    Ready: 'ready',
    AwaitingConfirmation: 'awaiting_confirmation',
    AwaitingApp: 'awaiting_app',
    ErrorState: 'error',
  },
  useHardwareWalletState: jest.fn(),
  getHardwareWalletErrorCode: jest.fn(),
  isUserRejectedHardwareWalletError: jest.fn(),
}));

const mockUseHardwareWalletState = jest.requireMock(
  '../../../contexts/hardware-wallets',
).useHardwareWalletState;
const mockGetHardwareWalletErrorCode = jest.requireMock(
  '../../../contexts/hardware-wallets',
).getHardwareWalletErrorCode;
const mockIsUserRejectedHardwareWalletError = jest.requireMock(
  '../../../contexts/hardware-wallets',
).isUserRejectedHardwareWalletError;

describe('useHwSwapConnectionMonitoring', () => {
  const mockDispatchSignatureEvent = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseHardwareWalletState.mockReturnValue({
      connectionState: { status: ConnectionStatus.Ready },
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
    mockGetHardwareWalletErrorCode.mockReturnValue(ErrorCode.ConnectionClosed);

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
    mockGetHardwareWalletErrorCode.mockReturnValue(
      ErrorCode.DeviceDisconnected,
    );

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

  it('dispatches TransactionRejected when user rejected error', () => {
    const error = new Error('user rejected');
    mockUseHardwareWalletState.mockReturnValue({
      connectionState: { status: ConnectionStatus.ErrorState, error },
    });
    mockGetHardwareWalletErrorCode.mockReturnValue(null);
    mockIsUserRejectedHardwareWalletError.mockReturnValue(true);

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
    mockGetHardwareWalletErrorCode.mockReturnValue(null);
    mockIsUserRejectedHardwareWalletError.mockReturnValue(false);

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
});
