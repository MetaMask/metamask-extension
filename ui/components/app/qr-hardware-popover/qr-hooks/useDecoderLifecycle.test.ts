import { renderHook, act } from '@testing-library/react-hooks';
import { URDecoder } from '@ngraveio/bc-ur';
import { ScanErrorCategory } from '../qr-utils/qr-utils';
import { useDecoderLifecycle } from './useDecoderLifecycle';

jest.mock('@ngraveio/bc-ur', () => {
  const actual = jest.requireActual('@ngraveio/bc-ur');
  return {
    ...actual,
    URDecoder: jest.fn().mockImplementation(() => ({
      isComplete: jest.fn().mockReturnValue(false),
      receivePart: jest.fn(),
      estimatedPercentComplete: jest.fn().mockReturnValue(0),
      resultUR: jest.fn(),
    })),
  };
});

const mockURDecoder = jest.mocked(URDecoder);

describe('useDecoderLifecycle', () => {
  const mockHandleSuccess = jest.fn().mockResolvedValue(undefined);
  const mockSetScanProgress = jest.fn();
  const mockSetScanError = jest.fn();
  const mockSetError = jest.fn();

  const defaultProps = {
    handleSuccess: mockHandleSuccess,
    isReadingWallet: true,
  };

  const defaultCallbacks = {
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

    it('feeds data into the decoder and updates progress', () => {
      const mockInstance = {
        isComplete: jest.fn().mockReturnValue(false),
        receivePart: jest.fn(),
        estimatedPercentComplete: jest.fn().mockReturnValue(0.5),
        resultUR: jest.fn(),
      };
      mockURDecoder.mockImplementation(
        () => mockInstance as unknown as URDecoder,
      );

      const { result } = renderDecoderHook();

      act(() => {
        result.current.handleScan('UR:CRYPTO-HDKEY/1-2/some-data');
      });

      expect(mockInstance.receivePart).toHaveBeenCalledWith(
        'UR:CRYPTO-HDKEY/1-2/some-data',
      );
      expect(mockSetScanProgress).toHaveBeenCalledWith(0.5);
    });

    it('calls handleSuccess when decoder completes', () => {
      const mockResult = { type: 'crypto-hdkey' };
      const mockInstance = {
        isComplete: jest
          .fn()
          .mockReturnValueOnce(false)
          .mockReturnValueOnce(true),
        receivePart: jest.fn(),
        estimatedPercentComplete: jest.fn().mockReturnValue(1),
        resultUR: jest.fn().mockReturnValue(mockResult),
      };
      mockURDecoder.mockImplementation(
        () => mockInstance as unknown as URDecoder,
      );

      const { result } = renderDecoderHook();

      act(() => {
        result.current.handleScan('final-frame');
      });

      expect(mockHandleSuccess).toHaveBeenCalledWith(mockResult);
    });

    it('does not process data when decoder is already complete', () => {
      const mockInstance = {
        isComplete: jest.fn().mockReturnValue(true),
        receivePart: jest.fn(),
        estimatedPercentComplete: jest.fn(),
        resultUR: jest.fn(),
      };
      mockURDecoder.mockImplementation(
        () => mockInstance as unknown as URDecoder,
      );

      const { result } = renderDecoderHook();

      act(() => {
        result.current.handleScan('extra-frame');
      });

      expect(mockInstance.receivePart).not.toHaveBeenCalled();
    });

    it('classifies as WrongUrType when decoded UR does not match expected pairing types', () => {
      const mockInstance = {
        isComplete: jest
          .fn()
          .mockReturnValueOnce(false)
          .mockReturnValueOnce(true),
        receivePart: jest.fn(),
        estimatedPercentComplete: jest.fn().mockReturnValue(1),
        resultUR: jest.fn().mockReturnValue({ type: 'eth-signature' }),
      };
      mockURDecoder.mockImplementation(
        () => mockInstance as unknown as URDecoder,
      );

      const { result } = renderDecoderHook({
        ...defaultProps,
        isReadingWallet: true,
      });

      act(() => {
        result.current.handleScan('ur:eth-signature/complete-frame');
      });

      expect(mockSetScanError).toHaveBeenCalledWith({
        category: ScanErrorCategory.WrongUrType,
        isUrFormat: true,
        receivedUrType: 'eth-signature',
      });
      expect(mockHandleSuccess).not.toHaveBeenCalled();
    });

    it('classifies as WrongUrType when decoded UR does not match expected signing types', () => {
      const mockInstance = {
        isComplete: jest
          .fn()
          .mockReturnValueOnce(false)
          .mockReturnValueOnce(true),
        receivePart: jest.fn(),
        estimatedPercentComplete: jest.fn().mockReturnValue(1),
        resultUR: jest.fn().mockReturnValue({ type: 'crypto-hdkey' }),
      };
      mockURDecoder.mockImplementation(
        () => mockInstance as unknown as URDecoder,
      );

      const { result } = renderDecoderHook({
        ...defaultProps,
        isReadingWallet: false,
      });

      act(() => {
        result.current.handleScan('ur:crypto-hdkey/complete-frame');
      });

      expect(mockSetScanError).toHaveBeenCalledWith({
        category: ScanErrorCategory.WrongUrType,
        isUrFormat: true,
        receivedUrType: 'crypto-hdkey',
      });
      expect(mockHandleSuccess).not.toHaveBeenCalled();
    });

    it('classifies non-UR data as NonUrQrScanned when isReadingWallet is true', () => {
      const mockInstance = {
        isComplete: jest.fn().mockReturnValue(false),
        receivePart: jest.fn().mockImplementation(() => {
          throw new Error('invalid payload');
        }),
        estimatedPercentComplete: jest.fn(),
        resultUR: jest.fn(),
      };
      mockURDecoder.mockImplementation(
        () => mockInstance as unknown as URDecoder,
      );

      const { result } = renderDecoderHook({
        ...defaultProps,
        isReadingWallet: true,
      });

      act(() => {
        result.current.handleScan('bad-data');
      });

      expect(mockSetScanError).toHaveBeenCalledWith({
        category: ScanErrorCategory.NonUrQrScanned,
        isUrFormat: false,
      });
      expect(mockHandleSuccess).not.toHaveBeenCalled();
    });

    it('classifies non-UR data as NonUrQrScanned when isReadingWallet is false', () => {
      const mockInstance = {
        isComplete: jest.fn().mockReturnValue(false),
        receivePart: jest.fn().mockImplementation(() => {
          throw new Error('invalid payload');
        }),
        estimatedPercentComplete: jest.fn(),
        resultUR: jest.fn(),
      };
      mockURDecoder.mockImplementation(
        () => mockInstance as unknown as URDecoder,
      );

      const { result } = renderDecoderHook({
        ...defaultProps,
        isReadingWallet: false,
      });

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
      const mockInstance = {
        isComplete: jest.fn().mockReturnValue(false),
        receivePart: jest.fn().mockImplementation(() => {
          throw new Error('cbor decode failure');
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

      expect(mockSetScanError).toHaveBeenCalledWith({
        category: ScanErrorCategory.ScanException,
        isUrFormat: true,
        rawMessage: 'cbor decode failure',
      });
      expect(mockHandleSuccess).not.toHaveBeenCalled();
    });

    it('calls setError when handleSuccess rejects', async () => {
      const rejectError = new Error('processing failed');
      const mockInstance = {
        isComplete: jest
          .fn()
          .mockReturnValueOnce(false)
          .mockReturnValueOnce(true),
        receivePart: jest.fn(),
        estimatedPercentComplete: jest.fn().mockReturnValue(1),
        resultUR: jest.fn().mockReturnValue({ type: 'crypto-hdkey' }),
      };
      mockURDecoder.mockImplementation(
        () => mockInstance as unknown as URDecoder,
      );

      const failingHandleSuccess = jest.fn().mockRejectedValue(rejectError);
      const { result } = renderDecoderHook({
        ...defaultProps,
        handleSuccess: failingHandleSuccess,
      });

      act(() => {
        result.current.handleScan('final-frame');
      });

      await new Promise(process.nextTick);
      expect(mockSetError).toHaveBeenCalledWith(rejectError);
    });
  });

  describe('lazy decoder initialization', () => {
    it('constructs URDecoder only once across multiple handleScan calls', () => {
      const mockInstance = {
        isComplete: jest.fn().mockReturnValue(false),
        receivePart: jest.fn(),
        estimatedPercentComplete: jest.fn().mockReturnValue(0),
        resultUR: jest.fn(),
      };
      mockURDecoder.mockImplementation(
        () => mockInstance as unknown as URDecoder,
      );

      const { result } = renderDecoderHook();

      act(() => {
        result.current.handleScan('frame-1');
        result.current.handleScan('frame-2');
        result.current.handleScan('frame-3');
      });

      expect(mockURDecoder).toHaveBeenCalledTimes(1);
    });

    it('does not construct URDecoder until first handleScan call', () => {
      mockURDecoder.mockImplementation(
        () =>
          ({
            isComplete: jest.fn().mockReturnValue(false),
            receivePart: jest.fn(),
            estimatedPercentComplete: jest.fn().mockReturnValue(0),
            resultUR: jest.fn(),
          }) as unknown as URDecoder,
      );

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
      const completedInstance = {
        isComplete: jest.fn().mockReturnValue(true),
        receivePart: jest.fn(),
        estimatedPercentComplete: jest.fn().mockReturnValue(1),
        resultUR: jest.fn(),
      };
      const freshInstance = {
        isComplete: jest.fn().mockReturnValue(false),
        receivePart: jest.fn(),
        estimatedPercentComplete: jest.fn().mockReturnValue(0),
        resultUR: jest.fn(),
      };

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
      const mockInstance = {
        isComplete: jest.fn().mockReturnValue(false),
        receivePart: jest.fn(),
        estimatedPercentComplete: jest
          .fn()
          .mockReturnValueOnce(0.25)
          .mockReturnValueOnce(0.5)
          .mockReturnValueOnce(0.75),
        resultUR: jest.fn(),
      };
      mockURDecoder.mockImplementation(
        () => mockInstance as unknown as URDecoder,
      );

      const { result } = renderDecoderHook();

      act(() => {
        result.current.handleScan('frame-1');
        result.current.handleScan('frame-2');
        result.current.handleScan('frame-3');
      });

      expect(mockInstance.receivePart).toHaveBeenCalledTimes(3);
      expect(mockSetScanProgress).toHaveBeenCalledWith(0.25);
      expect(mockSetScanProgress).toHaveBeenCalledWith(0.5);
      expect(mockSetScanProgress).toHaveBeenCalledWith(0.75);
    });
  });
});
