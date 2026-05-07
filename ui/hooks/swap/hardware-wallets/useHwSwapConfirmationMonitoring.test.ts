import {
  HardwareWalletSignatureEvent,
  HardwareWalletSignatureStatus,
} from '../../../pages/bridge/hardware-wallets/hardware-wallet-signatures-state-machine';
import { createSignatureState } from '../../../pages/bridge/hardware-wallets/hardware-wallet-signatures-state-machine.test-helpers';
import { renderHookWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { useHwSwapConfirmationMonitoring } from './useHwSwapConfirmationMonitoring';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));

const mockUseSelector = jest.requireMock('react-redux').useSelector;

describe('useHwSwapConfirmationMonitoring', () => {
  const mockDispatchSignatureEvent = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSelector.mockReturnValue(undefined);
  });

  it('returns confirmationTxData from selector', () => {
    const mockTxData = { id: 'tx-123', data: '0xabc' };

    mockUseSelector.mockReturnValue(mockTxData);

    const { result } = renderHookWithProvider(
      () =>
        useHwSwapConfirmationMonitoring({
          hardwareWalletUsed: true,
          signatureState: createSignatureState(
            HardwareWalletSignatureStatus.AwaitingFirstSignature,
          ),
          dispatchSignatureEvent: mockDispatchSignatureEvent,
        }),
      {},
    );

    expect(result.current.confirmationTxData).toEqual(mockTxData);
  });

  it('dispatches TransactionRejected when txData goes from having an id to no id while awaiting signature', () => {
    mockUseSelector.mockReturnValue({ id: 'tx-123' });

    const { rerender } = renderHookWithProvider(
      () =>
        useHwSwapConfirmationMonitoring({
          hardwareWalletUsed: true,
          signatureState: createSignatureState(
            HardwareWalletSignatureStatus.AwaitingFirstSignature,
          ),
          dispatchSignatureEvent: mockDispatchSignatureEvent,
        }),
      {},
    );

    expect(mockDispatchSignatureEvent).not.toHaveBeenCalled();

    mockUseSelector.mockReturnValue(undefined);

    rerender();

    expect(mockDispatchSignatureEvent).toHaveBeenCalledWith({
      type: HardwareWalletSignatureEvent.TransactionRejected,
    });
  });

  it('dispatches TransactionRejected for AwaitingFinalSignature status', () => {
    mockUseSelector.mockReturnValue({ id: 'tx-123' });

    const { rerender } = renderHookWithProvider(
      () =>
        useHwSwapConfirmationMonitoring({
          hardwareWalletUsed: true,
          signatureState: createSignatureState(
            HardwareWalletSignatureStatus.AwaitingFinalSignature,
          ),
          dispatchSignatureEvent: mockDispatchSignatureEvent,
        }),
      {},
    );

    mockUseSelector.mockReturnValue(undefined);

    rerender();

    expect(mockDispatchSignatureEvent).toHaveBeenCalledWith({
      type: HardwareWalletSignatureEvent.TransactionRejected,
    });
  });

  it('does not dispatch TransactionRejected when hardwareWalletUsed is false', () => {
    mockUseSelector.mockReturnValue({ id: 'tx-123' });

    const { rerender } = renderHookWithProvider(
      () =>
        useHwSwapConfirmationMonitoring({
          hardwareWalletUsed: false,
          signatureState: createSignatureState(
            HardwareWalletSignatureStatus.AwaitingFirstSignature,
          ),
          dispatchSignatureEvent: mockDispatchSignatureEvent,
        }),
      {},
    );

    mockUseSelector.mockReturnValue(undefined);

    rerender();

    expect(mockDispatchSignatureEvent).not.toHaveBeenCalled();
  });

  it('does not dispatch TransactionRejected when signatureState is not awaiting', () => {
    mockUseSelector.mockReturnValue({ id: 'tx-123' });

    const { rerender } = renderHookWithProvider(
      () =>
        useHwSwapConfirmationMonitoring({
          hardwareWalletUsed: true,
          signatureState: createSignatureState(
            HardwareWalletSignatureStatus.Submitted,
          ),
          dispatchSignatureEvent: mockDispatchSignatureEvent,
        }),
      {},
    );

    mockUseSelector.mockReturnValue(undefined);

    rerender();

    expect(mockDispatchSignatureEvent).not.toHaveBeenCalled();
  });

  it('does not dispatch TransactionRejected when there was no previous tx id', () => {
    mockUseSelector.mockReturnValue(undefined);

    renderHookWithProvider(
      () =>
        useHwSwapConfirmationMonitoring({
          hardwareWalletUsed: true,
          signatureState: createSignatureState(
            HardwareWalletSignatureStatus.AwaitingFirstSignature,
          ),
          dispatchSignatureEvent: mockDispatchSignatureEvent,
        }),
      {},
    );

    expect(mockDispatchSignatureEvent).not.toHaveBeenCalled();
  });

  it('does not dispatch TransactionRejected when device is disconnected', () => {
    const isDeviceDisconnectedRef = { current: true };

    mockUseSelector.mockReturnValue({ id: 'tx-123' });

    const { rerender } = renderHookWithProvider(
      () =>
        useHwSwapConfirmationMonitoring({
          hardwareWalletUsed: true,
          signatureState: createSignatureState(
            HardwareWalletSignatureStatus.AwaitingFirstSignature,
          ),
          dispatchSignatureEvent: mockDispatchSignatureEvent,
          isDeviceDisconnectedRef,
        }),
      {},
    );

    mockUseSelector.mockReturnValue(undefined);

    rerender();

    expect(mockDispatchSignatureEvent).not.toHaveBeenCalled();
  });

  it('resets previous tx id when retryGeneration changes', () => {
    const retryGenerationRef = { current: 0 };

    mockUseSelector.mockReturnValue({ id: 'tx-123' });

    const { rerender } = renderHookWithProvider(
      () =>
        useHwSwapConfirmationMonitoring({
          hardwareWalletUsed: true,
          signatureState: createSignatureState(
            HardwareWalletSignatureStatus.AwaitingFirstSignature,
          ),
          dispatchSignatureEvent: mockDispatchSignatureEvent,
          retryGenerationRef,
        }),
      {},
    );

    retryGenerationRef.current = 1;

    mockUseSelector.mockReturnValue(undefined);

    rerender();

    expect(mockDispatchSignatureEvent).not.toHaveBeenCalled();
  });
});
