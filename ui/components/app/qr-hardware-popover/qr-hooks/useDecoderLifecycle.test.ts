import { renderHook, act } from '@testing-library/react-hooks';
import { URDecoder } from '@ngraveio/bc-ur';
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
  const mockSetErrorTitle = jest.fn();
  const mockSetScanProgress = jest.fn();
  const mockSetError = jest.fn();
  const mockT = jest.fn((key: string) => key);

  const defaultProps = {
    handleSuccess: mockHandleSuccess,
    isReadingWallet: true,
    setErrorTitle: mockSetErrorTitle,
  };

  const defaultCallbacks = {
    setScanProgress: mockSetScanProgress,
    setError: mockSetError,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function renderDecoderHook(
    props = defaultProps,
    callbacks = defaultCallbacks,
  ) {
    return renderHook(() => useDecoderLifecycle(props, callbacks, mockT));
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

    it('sets wallet error title when scan throws and isReadingWallet is true', () => {
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

      expect(mockSetErrorTitle).toHaveBeenCalledWith(
        'QRHardwareUnknownQRCodeTitle',
      );
      expect(mockSetError).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'unknownQrCode' }),
      );
    });

    it('sets transaction error title when scan throws and isReadingWallet is false', () => {
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

      expect(mockSetErrorTitle).toHaveBeenCalledWith(
        'QRHardwareInvalidTransactionTitle',
      );
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
