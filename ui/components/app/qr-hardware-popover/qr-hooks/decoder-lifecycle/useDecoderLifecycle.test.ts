import { renderHook, act } from '@testing-library/react-hooks';
import { URDecoder } from '@ngraveio/bc-ur';
import log from 'loglevel';
import {
  UrType,
  PAIRING_EXPECTED_UR_TYPES,
  SIGNING_EXPECTED_UR_TYPES,
  type BaseQrReaderProps,
} from '../../base-qr-reader';
import {
  ScanErrorCategory,
  QrMismatchedTransactionError,
} from '../../qr-utils/qr-utils';
import type { DecoderCallbacks } from '../qr-hooks.types';
import { useDecoderLifecycle } from './useDecoderLifecycle';

jest.mock('@ngraveio/bc-ur', () => {
  const actual = jest.requireActual('@ngraveio/bc-ur');
  return {
    ...actual,
    URDecoder: jest.fn().mockImplementation(() => ({
      isComplete: jest.fn().mockReturnValue(false),
      isError: jest.fn().mockReturnValue(false),
      receivePart: jest.fn(),
      estimatedPercentComplete: jest.fn().mockReturnValue(0),
      resultUR: jest.fn(),
    })),
  };
});

const mockURDecoder = jest.mocked(URDecoder);

/**
 * The subset of the `URDecoder` surface that {@link useDecoderLifecycle} uses.
 */
type MockDecoder = {
  isComplete: jest.Mock<boolean, []>;
  isError: jest.Mock<boolean, []>;
  receivePart: jest.Mock<void, [string]>;
  estimatedPercentComplete: jest.Mock<number, []>;
  resultUR: jest.Mock<{ type: string }, []>;
};

/**
 * Builds a `URDecoder` mock with inert defaults that tests can override.
 *
 * @param overrides - Mock methods to replace the defaults with.
 * @returns A decoder mock.
 */
function buildDecoderMock(overrides: Partial<MockDecoder> = {}): MockDecoder {
  return {
    isComplete: jest.fn().mockReturnValue(false),
    isError: jest.fn().mockReturnValue(false),
    receivePart: jest.fn(),
    estimatedPercentComplete: jest.fn().mockReturnValue(0),
    resultUR: jest.fn(),
    ...overrides,
  };
}

/**
 * Builds a decoder mock that reports incomplete on the first frame and complete
 * on the second, returning a UR of the given type.
 *
 * @param resultType - UR type returned by `resultUR()`.
 * @returns A decoder mock that completes on the next frame.
 */
function buildCompletingDecoderMock(resultType: string): MockDecoder {
  return buildDecoderMock({
    isComplete: jest.fn().mockReturnValueOnce(false).mockReturnValueOnce(true),
    estimatedPercentComplete: jest.fn().mockReturnValue(1),
    resultUR: jest.fn().mockReturnValue({ type: resultType }),
  });
}

/**
 * Registers the URDecoder constructor mock to return the given instance.
 *
 * @param instance - The decoder mock to return on construction.
 */
function setDecoderInstance(instance: MockDecoder): void {
  mockURDecoder.mockImplementation(() => instance as unknown as URDecoder);
}

describe('useDecoderLifecycle', () => {
  const mockHandleSuccess = jest.fn().mockResolvedValue(undefined);
  const mockSetScanProgress = jest.fn();
  const mockSetScanError = jest.fn();
  const mockSetError = jest.fn();

  const defaultProps: Pick<
    BaseQrReaderProps,
    'handleSuccess' | 'expectedUrTypes'
  > = {
    handleSuccess: mockHandleSuccess,
    expectedUrTypes: PAIRING_EXPECTED_UR_TYPES,
  };

  const defaultCallbacks: DecoderCallbacks = {
    setScanProgress: mockSetScanProgress,
    setScanError: mockSetScanError,
    setError: mockSetError,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function renderDecoderHook(
    props = defaultProps,
    callbacks = defaultCallbacks,
  ) {
    return renderHook(() => useDecoderLifecycle(props, callbacks));
  }

  describe('handleScan', () => {
    it('ignores null data', () => {
      const { result } = renderDecoderHook();

      act(() => {
        result.current.handleScan(null);
      });

      expect(mockSetScanProgress).not.toHaveBeenCalled();
    });

    it('ignores empty string data', () => {
      const { result } = renderDecoderHook();

      act(() => {
        result.current.handleScan('');
      });

      expect(mockSetScanProgress).not.toHaveBeenCalled();
    });

    it('skips processing when receiving the same frame content twice', () => {
      const mockInstance = {
        isComplete: jest.fn().mockReturnValue(false),
        isError: jest.fn().mockReturnValue(false),
        receivePart: jest.fn(),
        estimatedPercentComplete: jest.fn().mockReturnValue(0.25),
        resultUR: jest.fn(),
      };
      mockURDecoder.mockImplementation(
        () => mockInstance as unknown as URDecoder,
      );

      const { result } = renderDecoderHook();

      act(() => {
        result.current.handleScan('ur:crypto-hdkey/frame-1');
        result.current.handleScan('ur:crypto-hdkey/frame-1');
        result.current.handleScan('ur:crypto-hdkey/frame-1');
      });

      expect(mockInstance.receivePart).toHaveBeenCalledTimes(1);
      expect(mockSetScanProgress).toHaveBeenCalledTimes(1);
    });

    it('feeds data into the decoder and updates progress', () => {
      const decoder = buildDecoderMock({
        estimatedPercentComplete: jest.fn().mockReturnValue(0.5),
      });
      setDecoderInstance(decoder);

      const { result } = renderDecoderHook();

      act(() => {
        result.current.handleScan('UR:CRYPTO-HDKEY/1-2/some-data');
      });

      expect(decoder.receivePart).toHaveBeenCalledWith(
        'UR:CRYPTO-HDKEY/1-2/some-data',
      );
      expect(mockSetScanProgress).toHaveBeenCalledWith(0.5);
    });

    it('calls handleSuccess when decoder completes', () => {
      const decoder = buildCompletingDecoderMock(UrType.CryptoHdkey);
      setDecoderInstance(decoder);

      const { result } = renderDecoderHook();

      act(() => {
        result.current.handleScan('final-frame');
      });

      expect(mockHandleSuccess).toHaveBeenCalledWith({
        type: UrType.CryptoHdkey,
      });
    });

    it('does not update progress when decoder completes immediately', () => {
      const mockResult = { type: UrType.CryptoHdkey };
      const mockInstance = {
        isComplete: jest
          .fn()
          .mockReturnValueOnce(false)
          .mockReturnValueOnce(true),
        isError: jest.fn().mockReturnValue(false),
        receivePart: jest.fn(),
        estimatedPercentComplete: jest.fn().mockReturnValue(1),
        resultUR: jest.fn().mockReturnValue(mockResult),
      };
      mockURDecoder.mockImplementation(
        () => mockInstance as unknown as URDecoder,
      );

      const { result } = renderDecoderHook();

      act(() => {
        result.current.handleScan('single-frame-qr');
      });

      expect(mockHandleSuccess).toHaveBeenCalledWith(mockResult);
      expect(mockSetScanProgress).not.toHaveBeenCalled();
    });

    it('does not process data when decoder is already complete', () => {
      const decoder = buildDecoderMock({
        isComplete: jest.fn().mockReturnValue(true),
      });
      setDecoderInstance(decoder);

      const { result } = renderDecoderHook();

      act(() => {
        result.current.handleScan('extra-frame');
      });

      expect(decoder.receivePart).not.toHaveBeenCalled();
    });

    it('classifies as WrongUrType when decoded UR does not match expected pairing types', () => {
      setDecoderInstance(buildCompletingDecoderMock(UrType.EthSignature));

      const { result } = renderDecoderHook({
        ...defaultProps,
        expectedUrTypes: PAIRING_EXPECTED_UR_TYPES,
      });

      act(() => {
        result.current.handleScan('ur:eth-signature/complete-frame');
      });

      expect(mockSetScanError).toHaveBeenCalledWith({
        category: ScanErrorCategory.WrongUrType,
        isUrFormat: true,
        receivedUrType: UrType.EthSignature,
      });
      expect(mockHandleSuccess).not.toHaveBeenCalled();
    });

    it('classifies as WrongUrType when decoded UR does not match expected signing types', () => {
      setDecoderInstance(buildCompletingDecoderMock(UrType.CryptoHdkey));

      const { result } = renderDecoderHook({
        ...defaultProps,
        expectedUrTypes: SIGNING_EXPECTED_UR_TYPES,
      });

      act(() => {
        result.current.handleScan('ur:crypto-hdkey/complete-frame');
      });

      expect(mockSetScanError).toHaveBeenCalledWith({
        category: ScanErrorCategory.WrongUrType,
        isUrFormat: true,
        receivedUrType: UrType.CryptoHdkey,
      });
      expect(mockHandleSuccess).not.toHaveBeenCalled();
    });

    it('classifies a thrown non-UR payload as NonUrQrScanned', () => {
      setDecoderInstance(
        buildDecoderMock({
          receivePart: jest.fn().mockImplementation(() => {
            throw new Error('invalid payload');
          }),
        }),
      );

      const { result } = renderDecoderHook();

      act(() => {
        result.current.handleScan('bad-data');
      });

      expect(mockSetScanError).toHaveBeenCalledWith({
        category: ScanErrorCategory.NonUrQrScanned,
        isUrFormat: false,
      });
      expect(mockHandleSuccess).not.toHaveBeenCalled();
    });

    it('classifies UR-formatted data that throws as ScanException with isUrFormat true', () => {
      setDecoderInstance(
        buildDecoderMock({
          receivePart: jest.fn().mockImplementation(() => {
            throw new Error('cbor decode failure');
          }),
        }),
      );

      const { result } = renderDecoderHook();

      act(() => {
        result.current.handleScan('ur:crypto-hdkey/corrupted-data');
      });

      expect(mockSetScanError).toHaveBeenCalledWith({
        category: ScanErrorCategory.ScanException,
        isUrFormat: true,
        rawMessage: 'cbor decode failure',
      });
      expect(mockHandleSuccess).not.toHaveBeenCalled();
    });

    it('calls log.warn with the raw exception for ScanException errors', () => {
      const warnSpy = jest.spyOn(log, 'warn').mockImplementation();
      const thrownError = new Error('cbor decode failure');
      const mockInstance = {
        isComplete: jest.fn().mockReturnValue(false),
        isError: jest.fn().mockReturnValue(false),
        receivePart: jest.fn().mockImplementation(() => {
          throw thrownError;
        }),
        estimatedPercentComplete: jest.fn(),
        resultUR: jest.fn(),
      };
      mockURDecoder.mockImplementation(
        () => mockInstance as unknown as URDecoder,
      );

      const { result } = renderDecoderHook();

      act(() => {
        result.current.handleScan('ur:crypto-hdkey/corrupted-data');
      });

      expect(warnSpy).toHaveBeenCalledWith('QR scan exception', thrownError);
      warnSpy.mockRestore();
    });

    it('does not call log.warn for NonUrQrScanned errors', () => {
      const warnSpy = jest.spyOn(log, 'warn').mockImplementation();
      const mockInstance = {
        isComplete: jest.fn().mockReturnValue(false),
        isError: jest.fn().mockReturnValue(false),
        receivePart: jest.fn().mockImplementation(() => {
          throw new Error('invalid payload');
        }),
        estimatedPercentComplete: jest.fn(),
        resultUR: jest.fn(),
      };
      mockURDecoder.mockImplementation(
        () => mockInstance as unknown as URDecoder,
      );

      const { result } = renderDecoderHook();

      act(() => {
        result.current.handleScan('bad-data');
      });

      expect(mockSetScanError).toHaveBeenCalledWith(
        expect.objectContaining({
          category: ScanErrorCategory.NonUrQrScanned,
        }),
      );
      expect(warnSpy).not.toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('classifies as UrDecodeError when decoder enters error state', () => {
      setDecoderInstance(
        buildDecoderMock({
          isError: jest.fn().mockReturnValue(true),
          estimatedPercentComplete: jest.fn().mockReturnValue(0.99),
        }),
      );

      const { result } = renderDecoderHook();

      act(() => {
        result.current.handleScan('ur:crypto-hdkey/corrupted-checksum');
      });

      expect(mockSetScanError).toHaveBeenCalledWith({
        category: ScanErrorCategory.UrDecodeError,
        isUrFormat: true,
      });
      expect(mockHandleSuccess).not.toHaveBeenCalled();
    });

    it('routes a generic handleSuccess rejection to setError', async () => {
      const rejectError = new Error('processing failed');
      setDecoderInstance(buildCompletingDecoderMock(UrType.CryptoHdkey));

      const { result } = renderDecoderHook({
        ...defaultProps,
        handleSuccess: jest.fn().mockRejectedValue(rejectError),
      });

      act(() => {
        result.current.handleScan('final-frame');
      });

      await new Promise(process.nextTick);
      expect(mockSetError).toHaveBeenCalledWith(rejectError);
      expect(mockSetScanError).not.toHaveBeenCalled();
    });

    it('routes a QrMismatchedTransactionError rejection to setScanError', async () => {
      setDecoderInstance(buildCompletingDecoderMock(UrType.EthSignature));

      const { result } = renderDecoderHook({
        ...defaultProps,
        handleSuccess: jest
          .fn()
          .mockRejectedValue(new QrMismatchedTransactionError()),
        expectedUrTypes: SIGNING_EXPECTED_UR_TYPES,
      });

      act(() => {
        result.current.handleScan('final-frame');
      });

      await new Promise(process.nextTick);
      expect(mockSetScanError).toHaveBeenCalledWith({
        category: ScanErrorCategory.MismatchedSignId,
        isUrFormat: true,
      });
      expect(mockSetError).not.toHaveBeenCalled();
    });

    it('routes a plain Error sharing the mismatch message to setError, not setScanError', async () => {
      setDecoderInstance(buildCompletingDecoderMock(UrType.EthSignature));

      const lookalikeError = new Error('QrMismatchedTransactionError');
      const { result } = renderDecoderHook({
        ...defaultProps,
        handleSuccess: jest.fn().mockRejectedValue(lookalikeError),
        expectedUrTypes: SIGNING_EXPECTED_UR_TYPES,
      });

      act(() => {
        result.current.handleScan('final-frame');
      });

      await new Promise(process.nextTick);
      expect(mockSetError).toHaveBeenCalledWith(lookalikeError);
      expect(mockSetScanError).not.toHaveBeenCalled();
    });
  });

  describe('lazy decoder initialization', () => {
    it('constructs URDecoder only once across multiple handleScan calls', () => {
      setDecoderInstance(buildDecoderMock());

      const { result } = renderDecoderHook();

      act(() => {
        result.current.handleScan('frame-1');
        result.current.handleScan('frame-2');
        result.current.handleScan('frame-3');
      });

      expect(mockURDecoder).toHaveBeenCalledTimes(1);
    });

    it('does not construct URDecoder until first handleScan call', () => {
      setDecoderInstance(buildDecoderMock());

      renderDecoderHook();

      expect(mockURDecoder).not.toHaveBeenCalled();
    });
  });

  describe('resetDecoder', () => {
    it('resets progress to zero', () => {
      const { result } = renderDecoderHook();

      act(() => {
        result.current.resetDecoder();
      });

      expect(mockSetScanProgress).toHaveBeenCalledWith(0);
    });

    it('creates a fresh decoder so subsequent scans start from scratch', () => {
      const completedInstance = buildDecoderMock({
        isComplete: jest.fn().mockReturnValue(true),
        estimatedPercentComplete: jest.fn().mockReturnValue(1),
      });
      const freshInstance = buildDecoderMock();

      mockURDecoder
        .mockImplementationOnce(() => completedInstance as unknown as URDecoder)
        .mockImplementationOnce(() => freshInstance as unknown as URDecoder);

      const { result } = renderDecoderHook();

      act(() => {
        result.current.handleScan('data-after-complete');
      });
      expect(completedInstance.receivePart).not.toHaveBeenCalled();

      act(() => {
        result.current.resetDecoder();
      });

      act(() => {
        result.current.handleScan('new-scan-data');
      });
      expect(freshInstance.receivePart).toHaveBeenCalledWith('new-scan-data');
    });
  });

  describe('multi-frame scanning', () => {
    it('accumulates progress across multiple scan calls', () => {
      const decoder = buildDecoderMock({
        estimatedPercentComplete: jest
          .fn()
          .mockReturnValueOnce(0.25)
          .mockReturnValueOnce(0.5)
          .mockReturnValueOnce(0.75),
      });
      setDecoderInstance(decoder);

      const { result } = renderDecoderHook();

      act(() => {
        result.current.handleScan('frame-1');
        result.current.handleScan('frame-2');
        result.current.handleScan('frame-3');
      });

      expect(decoder.receivePart).toHaveBeenCalledTimes(3);
      expect(mockSetScanProgress).toHaveBeenCalledWith(0.25);
      expect(mockSetScanProgress).toHaveBeenCalledWith(0.5);
      expect(mockSetScanProgress).toHaveBeenCalledWith(0.75);
    });
  });
});
