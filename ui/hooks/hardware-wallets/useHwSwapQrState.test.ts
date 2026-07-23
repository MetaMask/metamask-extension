import { act, renderHook } from '@testing-library/react-hooks';
import { QrScanRequestType } from '@metamask/eth-qr-keyring';
import { HardwareKeyringType } from '../../../shared/constants/hardware-wallets';
import { HardwareWalletSignatureStatus } from '../../pages/hardware-wallets/swap/hardware-wallet-signatures-state-machine';
import { createSignatureState } from '../../pages/hardware-wallets/swap/hardware-wallet-signatures-state-machine/test-helpers';
import { useHwSwapQrState } from './useHwSwapQrState';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
  useDispatch: jest.fn(),
}));

jest.mock('../../../shared/lib/selectors/keyring', () => ({
  isHardwareWallet: jest.fn(),
  getHardwareWalletType: jest.fn(),
}));

jest.mock('../../selectors', () => ({
  getActiveQrCodeScanRequest: jest.fn(),
}));

jest.mock('../../store/actions', () => ({
  cancelQrCodeScan: jest.fn(),
  cancelTx: jest.fn(),
  completeQrCodeScan: jest.fn(),
  rejectPendingApproval: jest.fn(),
}));

jest.mock(
  '../../pages/hardware-wallets/swap/hardware-wallet-signatures.utils',
  () => ({
    isQrHardwareSignRequest: jest.fn(),
    cleanupPendingApproval: jest.fn(),
  }),
);

const mockUseSelector = jest.requireMock('react-redux').useSelector;
const mockUseDispatch = jest.requireMock('react-redux').useDispatch;
const mockGetHardwareWalletType = jest.requireMock(
  '../../../shared/lib/selectors/keyring',
).getHardwareWalletType;
const mockGetActiveQrCodeScanRequest =
  jest.requireMock('../../selectors').getActiveQrCodeScanRequest;
const mockIsQrHardwareSignRequest = jest.requireMock(
  '../../pages/hardware-wallets/swap/hardware-wallet-signatures.utils',
).isQrHardwareSignRequest;
const mockCleanupPendingApproval = jest.requireMock(
  '../../pages/hardware-wallets/swap/hardware-wallet-signatures.utils',
).cleanupPendingApproval;
const mockCancelQrCodeScan = jest.requireMock(
  '../../store/actions',
).cancelQrCodeScan;
const mockCompleteQrCodeScan = jest.requireMock(
  '../../store/actions',
).completeQrCodeScan;

describe('useHwSwapQrState', () => {
  const mockDispatch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseDispatch.mockReturnValue(mockDispatch);
    mockGetHardwareWalletType.mockReturnValue(undefined);
    mockGetActiveQrCodeScanRequest.mockReturnValue(undefined);
    mockIsQrHardwareSignRequest.mockReturnValue(false);

    mockUseSelector.mockImplementation((selector: unknown) => {
      if (selector === mockGetHardwareWalletType) {
        return mockGetHardwareWalletType();
      }
      if (selector === mockGetActiveQrCodeScanRequest) {
        return mockGetActiveQrCodeScanRequest();
      }
      return undefined;
    });
  });

  it('identifies QR hardware wallet when hardwareWalletType is QR', () => {
    mockGetHardwareWalletType.mockReturnValue(HardwareKeyringType.qr);

    const { result } = renderHook(() =>
      useHwSwapQrState({
        signatureState: createSignatureState(
          HardwareWalletSignatureStatus.AwaitingFirstSignature,
        ),
        confirmationTxData: undefined,
      }),
    );

    expect(result.current.isQrHardwareWallet).toBe(true);
  });

  it('does not identify a QR hardware wallet from a QR sign request alone', () => {
    mockGetHardwareWalletType.mockReturnValue(undefined);
    mockIsQrHardwareSignRequest.mockReturnValue(true);

    const { result } = renderHook(() =>
      useHwSwapQrState({
        signatureState: createSignatureState(
          HardwareWalletSignatureStatus.AwaitingFirstSignature,
        ),
        confirmationTxData: undefined,
      }),
    );

    expect(result.current.isQrHardwareWallet).toBe(false);
  });

  it('returns false for isQrHardwareWallet when not a QR wallet', () => {
    mockGetHardwareWalletType.mockReturnValue(HardwareKeyringType.ledger);

    const { result } = renderHook(() =>
      useHwSwapQrState({
        signatureState: createSignatureState(
          HardwareWalletSignatureStatus.AwaitingFirstSignature,
        ),
        confirmationTxData: undefined,
      }),
    );

    expect(result.current.isQrHardwareWallet).toBe(false);
  });

  it('ignores a stale QR sign request for a non-QR hardware wallet', () => {
    const mockQrSignRequest = {
      type: QrScanRequestType.SIGN,
      request: {
        requestId: 'stale-qr-request',
        payload: { type: 'test', cbor: '0x' },
      },
    };

    mockGetHardwareWalletType.mockReturnValue(HardwareKeyringType.ledger);
    mockGetActiveQrCodeScanRequest.mockReturnValue(mockQrSignRequest);
    mockIsQrHardwareSignRequest.mockReturnValue(true);

    const { result } = renderHook(() =>
      useHwSwapQrState({
        signatureState: createSignatureState(
          HardwareWalletSignatureStatus.AwaitingFirstSignature,
        ),
        confirmationTxData: undefined,
      }),
    );

    expect(result.current.isQrHardwareWallet).toBe(false);
    expect(result.current.qrSignRequest).toBeUndefined();
    expect(result.current.showInlineQrSigning).toBe(false);
  });

  it('shows inline QR signing when qrSignRequest exists and awaiting signature', () => {
    const mockQrSignRequest = {
      type: 'SIGN',
      request: {
        requestId: 'qr-123',
        payload: { type: 'test', cbor: '0x' },
      },
    };

    mockGetHardwareWalletType.mockReturnValue(HardwareKeyringType.qr);
    mockGetActiveQrCodeScanRequest.mockReturnValue(mockQrSignRequest);
    mockIsQrHardwareSignRequest.mockReturnValue(true);

    const { result } = renderHook(() =>
      useHwSwapQrState({
        signatureState: createSignatureState(
          HardwareWalletSignatureStatus.AwaitingFirstSignature,
        ),
        confirmationTxData: undefined,
      }),
    );

    expect(result.current.showInlineQrSigning).toBe(true);
    expect(result.current.qrSignRequest).toEqual(mockQrSignRequest);
  });

  it('does not show inline QR signing when not awaiting signature', () => {
    const mockQrSignRequest = {
      type: 'SIGN',
      request: {
        requestId: 'qr-123',
        payload: { type: 'test', cbor: '0x' },
      },
    };

    mockGetHardwareWalletType.mockReturnValue(HardwareKeyringType.qr);
    mockGetActiveQrCodeScanRequest.mockReturnValue(mockQrSignRequest);
    mockIsQrHardwareSignRequest.mockReturnValue(true);

    const { result } = renderHook(() =>
      useHwSwapQrState({
        signatureState: createSignatureState(
          HardwareWalletSignatureStatus.Submitted,
        ),
        confirmationTxData: undefined,
      }),
    );

    expect(result.current.showInlineQrSigning).toBe(false);
  });

  it('returns activeQrStep when showing inline signing and not reading', () => {
    const mockQrSignRequest = {
      type: 'SIGN',
      request: {
        requestId: 'qr-123',
        payload: { type: 'test', cbor: '0x' },
      },
    };

    mockGetHardwareWalletType.mockReturnValue(HardwareKeyringType.qr);
    mockGetActiveQrCodeScanRequest.mockReturnValue(mockQrSignRequest);
    mockIsQrHardwareSignRequest.mockReturnValue(true);

    const { result } = renderHook(() =>
      useHwSwapQrState({
        signatureState: createSignatureState(
          HardwareWalletSignatureStatus.AwaitingFirstSignature,
        ),
        confirmationTxData: undefined,
      }),
    );

    expect(result.current.activeQrStep).toBe(
      HardwareWalletSignatureStatus.AwaitingFirstSignature,
    );
  });

  it('keeps activeQrStep when isReadingQrSignature is true', () => {
    const mockQrSignRequest = {
      type: 'SIGN',
      request: {
        requestId: 'qr-123',
        payload: { type: 'test', cbor: '0x' },
      },
    };

    mockGetHardwareWalletType.mockReturnValue(HardwareKeyringType.qr);
    mockGetActiveQrCodeScanRequest.mockReturnValue(mockQrSignRequest);
    mockIsQrHardwareSignRequest.mockReturnValue(true);

    const { result } = renderHook(() =>
      useHwSwapQrState({
        signatureState: createSignatureState(
          HardwareWalletSignatureStatus.AwaitingFirstSignature,
        ),
        confirmationTxData: undefined,
      }),
    );

    act(() => {
      result.current.setIsReadingQrSignature(true);
    });

    expect(result.current.activeQrStep).toBe(
      HardwareWalletSignatureStatus.AwaitingFirstSignature,
    );
  });

  it('shows a later QR request under the final step before the state machine transitions', () => {
    const firstQrSignRequest = {
      type: QrScanRequestType.SIGN,
      request: {
        requestId: 'approval-request',
        payload: { type: 'test', cbor: '0x' },
      },
    };

    mockGetHardwareWalletType.mockReturnValue(HardwareKeyringType.qr);
    mockGetActiveQrCodeScanRequest.mockReturnValue(firstQrSignRequest);
    mockIsQrHardwareSignRequest.mockReturnValue(true);

    const { result, rerender } = renderHook(() =>
      useHwSwapQrState({
        signatureState: createSignatureState(
          HardwareWalletSignatureStatus.AwaitingFirstSignature,
        ),
        confirmationTxData: undefined,
      }),
    );

    expect(result.current.activeQrStep).toBe(
      HardwareWalletSignatureStatus.AwaitingFirstSignature,
    );

    const finalQrSignRequest = {
      type: QrScanRequestType.SIGN,
      request: {
        requestId: 'trade-request',
        payload: { type: 'test', cbor: '0x' },
      },
    };

    mockGetActiveQrCodeScanRequest.mockReturnValue(finalQrSignRequest);

    rerender();

    expect(result.current.activeQrStep).toBe(
      HardwareWalletSignatureStatus.AwaitingFinalSignature,
    );
  });

  it('keeps a new first-step QR request on the first step after a reset', () => {
    const firstQrSignRequest = {
      type: QrScanRequestType.SIGN,
      request: {
        requestId: 'approval-request',
        payload: { type: 'test', cbor: '0x' },
      },
    };

    mockGetHardwareWalletType.mockReturnValue(HardwareKeyringType.qr);
    mockGetActiveQrCodeScanRequest.mockReturnValue(firstQrSignRequest);
    mockIsQrHardwareSignRequest.mockReturnValue(true);

    const { result, rerender } = renderHook(
      ({ stepTrackingResetKey }: { stepTrackingResetKey: number }) =>
        useHwSwapQrState({
          signatureState: createSignatureState(
            HardwareWalletSignatureStatus.AwaitingFirstSignature,
          ),
          confirmationTxData: undefined,
          stepTrackingResetKey,
        }),
      {
        initialProps: { stepTrackingResetKey: 0 },
      },
    );

    expect(result.current.activeQrStep).toBe(
      HardwareWalletSignatureStatus.AwaitingFirstSignature,
    );

    const retriedFirstQrSignRequest = {
      type: QrScanRequestType.SIGN,
      request: {
        requestId: 'retried-approval-request',
        payload: { type: 'test', cbor: '0x' },
      },
    };

    mockGetActiveQrCodeScanRequest.mockReturnValue(retriedFirstQrSignRequest);

    rerender({ stepTrackingResetKey: 1 });

    expect(result.current.activeQrStep).toBe(
      HardwareWalletSignatureStatus.AwaitingFirstSignature,
    );
  });

  it('uses the state-machine step when the QR request id has not changed', () => {
    const firstQrSignRequest = {
      type: QrScanRequestType.SIGN,
      request: {
        requestId: 'approval-request',
        payload: { type: 'test', cbor: '0x' },
      },
    };

    mockGetHardwareWalletType.mockReturnValue(HardwareKeyringType.qr);
    mockGetActiveQrCodeScanRequest.mockReturnValue(firstQrSignRequest);
    mockIsQrHardwareSignRequest.mockReturnValue(true);

    type RenderProps = { status: HardwareWalletSignatureStatus };
    const initialProps: RenderProps = {
      status: HardwareWalletSignatureStatus.AwaitingFirstSignature,
    };

    const { result, rerender } = renderHook(
      ({ status }: RenderProps) =>
        useHwSwapQrState({
          signatureState: createSignatureState(status),
          confirmationTxData: undefined,
        }),
      {
        initialProps,
      },
    );

    expect(result.current.activeQrStep).toBe(
      HardwareWalletSignatureStatus.AwaitingFirstSignature,
    );

    rerender({ status: HardwareWalletSignatureStatus.AwaitingFinalSignature });

    expect(result.current.activeQrStep).toBe(
      HardwareWalletSignatureStatus.AwaitingFinalSignature,
    );
  });

  it('resets isReadingQrSignature when currentQrRequestId changes', () => {
    const mockQrSignRequest = {
      type: 'SIGN',
      request: {
        requestId: 'qr-123',
        payload: { type: 'test', cbor: '0x' },
      },
    };

    mockGetHardwareWalletType.mockReturnValue(HardwareKeyringType.qr);
    mockGetActiveQrCodeScanRequest.mockReturnValue(mockQrSignRequest);
    mockIsQrHardwareSignRequest.mockReturnValue(true);

    const { result, rerender } = renderHook(() =>
      useHwSwapQrState({
        signatureState: createSignatureState(
          HardwareWalletSignatureStatus.AwaitingFirstSignature,
        ),
        confirmationTxData: undefined,
      }),
    );

    act(() => {
      result.current.setIsReadingQrSignature(true);
    });

    expect(result.current.isReadingQrSignature).toBe(true);

    const newQrSignRequest = {
      type: 'SIGN',
      request: {
        requestId: 'qr-456',
        payload: { type: 'test', cbor: '0x' },
      },
    };

    mockGetActiveQrCodeScanRequest.mockReturnValue(newQrSignRequest);

    rerender();

    expect(result.current.isReadingQrSignature).toBe(false);
  });

  describe('handleQrScanSuccess', () => {
    it('dispatches completeQrCodeScan', () => {
      const { result } = renderHook(() =>
        useHwSwapQrState({
          signatureState: createSignatureState(
            HardwareWalletSignatureStatus.AwaitingFirstSignature,
          ),
          confirmationTxData: undefined,
        }),
      );

      const mockResponse = { type: 'bytes', data: [] };
      result.current.handleQrScanSuccess(mockResponse as never);

      expect(mockDispatch).toHaveBeenCalledTimes(1);
    });
  });

  describe('handleQrSignatureCancel', () => {
    it('rejects pending approval and cancels tx when confirmationTxData has id', () => {
      const mockTxData = { id: 'tx-123' };

      const { result } = renderHook(() =>
        useHwSwapQrState({
          signatureState: createSignatureState(
            HardwareWalletSignatureStatus.AwaitingFirstSignature,
          ),
          confirmationTxData: mockTxData as never,
        }),
      );

      result.current.handleQrSignatureCancel();

      expect(mockCleanupPendingApproval).toHaveBeenCalledWith(
        mockDispatch,
        'tx-123',
      );
      expect(mockDispatch).toHaveBeenCalledTimes(1);
    });

    it('cancels QR code scan when qrSignRequest exists', () => {
      const mockQrSignRequest = {
        type: 'SIGN',
        request: {
          requestId: 'qr-123',
          payload: { type: 'test', cbor: '0x' },
        },
      };

      mockGetHardwareWalletType.mockReturnValue(HardwareKeyringType.qr);
      mockGetActiveQrCodeScanRequest.mockReturnValue(mockQrSignRequest);
      mockIsQrHardwareSignRequest.mockReturnValue(true);

      const { result } = renderHook(() =>
        useHwSwapQrState({
          signatureState: createSignatureState(
            HardwareWalletSignatureStatus.AwaitingFirstSignature,
          ),
          confirmationTxData: undefined,
        }),
      );

      result.current.handleQrSignatureCancel();

      expect(mockDispatch).toHaveBeenCalledTimes(1);
    });
  });
});
