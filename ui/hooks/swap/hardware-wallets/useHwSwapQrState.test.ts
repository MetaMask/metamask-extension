import { act, renderHook } from '@testing-library/react-hooks';
import { QrScanRequestType } from '@metamask/eth-qr-keyring';
import { HardwareKeyringType } from '../../../../shared/constants/hardware-wallets';
import { HardwareWalletSignatureStatus } from '../../../pages/hardware-wallets/swap/hardware-wallet-signatures-state-machine';
import { createSignatureState } from '../../../pages/hardware-wallets/swap/hardware-wallet-signatures-state-machine/test-helpers';
import { useHwSwapQrState } from './useHwSwapQrState';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
  useDispatch: jest.fn(),
}));

jest.mock('../../../../shared/lib/selectors/keyring', () => ({
  getHardwareWalletType: jest.fn(),
}));

jest.mock('../../../selectors', () => ({
  getActiveQrCodeScanRequest: jest.fn(),
}));

jest.mock('../../../store/actions', () => ({
  cancelQrCodeScan: jest.fn(),
  cancelTx: jest.fn(),
  completeQrCodeScan: jest.fn(),
  rejectPendingApproval: jest.fn(),
}));

jest.mock(
  '../../../pages/hardware-wallets/swap/hardware-wallet-signatures.utils',
  () => ({
    isQrHardwareSignRequest: jest.fn(),
  }),
);

const mockUseSelector = jest.requireMock('react-redux').useSelector;
const mockUseDispatch = jest.requireMock('react-redux').useDispatch;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const mockGetHardwareWalletType = jest.requireMock(
  '../../../../shared/lib/selectors/keyring',
).getHardwareWalletType;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const mockGetActiveQrCodeScanRequest =
  jest.requireMock('../../../selectors').getActiveQrCodeScanRequest;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const mockIsQrHardwareSignRequest = jest.requireMock(
  '../../../pages/hardware-wallets/swap/hardware-wallet-signatures.utils',
).isQrHardwareSignRequest;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const mockCancelQrCodeScan = jest.requireMock(
  '../../../store/actions',
).cancelQrCodeScan;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const mockCompleteQrCodeScan = jest.requireMock(
  '../../../store/actions',
).completeQrCodeScan;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const mockRejectPendingApproval = jest.requireMock(
  '../../../store/actions',
).rejectPendingApproval;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const mockCancelTx = jest.requireMock('../../../store/actions').cancelTx;

describe('useHwSwapQrState', () => {
  const mockDispatch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseDispatch.mockReturnValue(mockDispatch);
    mockGetHardwareWalletType.mockReturnValue(undefined);
    mockGetActiveQrCodeScanRequest.mockReturnValue(undefined);
    mockIsQrHardwareSignRequest.mockReturnValue(false);
    mockCancelQrCodeScan.mockReturnValue({ type: 'CANCEL_QR_CODE_SCAN' });
    mockCompleteQrCodeScan.mockReturnValue({ type: 'COMPLETE_QR_CODE_SCAN' });
    mockRejectPendingApproval.mockReturnValue({
      type: 'REJECT_PENDING_APPROVAL',
    });
    mockCancelTx.mockReturnValue({ type: 'CANCEL_TX' });

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

  it('identifies QR hardware wallet when activeQrCodeScanRequest is a QR sign request', () => {
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

    expect(result.current.isQrHardwareWallet).toBe(true);
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

  it('shows inline QR signing when qrSignRequest exists and awaiting signature', () => {
    const mockQrSignRequest = {
      type: QrScanRequestType.SIGN,
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
      type: QrScanRequestType.SIGN,
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
      type: QrScanRequestType.SIGN,
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

  it('returns undefined activeQrStep when isReadingQrSignature is true', () => {
    const mockQrSignRequest = {
      type: QrScanRequestType.SIGN,
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

    expect(result.current.activeQrStep).toBeUndefined();
  });

  it('resets isReadingQrSignature when currentQrRequestId changes', () => {
    const mockQrSignRequest = {
      type: QrScanRequestType.SIGN,
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
      type: QrScanRequestType.SIGN,
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
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'COMPLETE_QR_CODE_SCAN',
      });
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

      expect(mockDispatch).toHaveBeenCalledTimes(2);
      expect(mockDispatch).toHaveBeenNthCalledWith(1, {
        type: 'REJECT_PENDING_APPROVAL',
      });
      expect(mockDispatch).toHaveBeenNthCalledWith(2, { type: 'CANCEL_TX' });
    });

    it('keeps a stable reference while using the latest confirmation tx data', () => {
      const initialTxData = { id: 'tx-123' };
      const latestTxData = { id: 'tx-456' };

      const { result, rerender } = renderHook(
        ({ confirmationTxData }: { confirmationTxData: { id: string } }) =>
          useHwSwapQrState({
            signatureState: createSignatureState(
              HardwareWalletSignatureStatus.AwaitingFirstSignature,
            ),
            confirmationTxData,
          }),
        {
          initialProps: {
            confirmationTxData: initialTxData,
          },
        },
      );

      const initialHandleQrSignatureCancel =
        result.current.handleQrSignatureCancel;

      rerender({ confirmationTxData: latestTxData });

      expect(result.current.handleQrSignatureCancel).toBe(
        initialHandleQrSignatureCancel,
      );

      result.current.handleQrSignatureCancel();

      expect(mockRejectPendingApproval).toHaveBeenCalledWith(
        latestTxData.id,
        expect.any(Object),
      );
      expect(mockCancelTx).toHaveBeenCalledWith(latestTxData);
    });

    it('cancels QR code scan when qrSignRequest exists', () => {
      const mockQrSignRequest = {
        type: QrScanRequestType.SIGN,
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
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'CANCEL_QR_CODE_SCAN',
      });
    });
  });
});
