import { act, renderHook } from '@testing-library/react-hooks';
import { HardwareKeyringType } from '../../../../shared/constants/hardware-wallets';
import { HardwareWalletSignatureStatus } from '../../../pages/bridge/hardware-wallets/hardware-wallet-signatures-state-machine';
import { createSignatureState } from '../../../pages/bridge/hardware-wallets/hardware-wallet-signatures-state-machine.test-helpers';
import { useHwSwapQrState } from './useHwSwapQrState';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
  useDispatch: jest.fn(),
}));

jest.mock('../../../selectors/selectors', () => ({
  isHardwareWallet: jest.fn(),
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
  '../../../pages/bridge/hardware-wallets/hardware-wallet-signatures.utils',
  () => ({
    isQrHardwareSignRequest: jest.fn(),
  }),
);

const mockUseSelector = jest.requireMock('react-redux').useSelector;
const mockUseDispatch = jest.requireMock('react-redux').useDispatch;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const mockGetHardwareWalletType = jest.requireMock(
  '../../../selectors/selectors',
).getHardwareWalletType;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const mockGetActiveQrCodeScanRequest =
  jest.requireMock('../../../selectors').getActiveQrCodeScanRequest;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const mockIsQrHardwareSignRequest = jest.requireMock(
  '../../../pages/bridge/hardware-wallets/hardware-wallet-signatures.utils',
).isQrHardwareSignRequest;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const mockCancelQrCodeScan = jest.requireMock(
  '../../../store/actions',
).cancelQrCodeScan;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const mockCompleteQrCodeScan = jest.requireMock(
  '../../../store/actions',
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

  it('returns undefined activeQrStep when isReadingQrSignature is true', () => {
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

    expect(result.current.activeQrStep).toBeUndefined();
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

    expect(result.current.isReadingQrSignature).toBe(true);

    const newQrSignRequest = {
      type: 'SIGN',
      request: {
        requestId: 'qr-456',
        payload: { type: 'test', cbor: '0x' },
      },
    };

    mockGetActiveQrCodeScanRequest.mockReturnValue(newQrSignRequest);

    expect(result.current.isReadingQrSignature).toBe(true);
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

      expect(mockDispatch).toHaveBeenCalledTimes(2);
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
