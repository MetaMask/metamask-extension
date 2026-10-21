import React from 'react';
import { render, act } from '@testing-library/react';
import { BrowserQRCodeReader } from '@zxing/browser';
import log from 'loglevel';
import EnhancedQrReader from './enhanced-qr-reader';

jest.mock('@zxing/browser', () => ({
  BrowserQRCodeReader: jest.fn(),
}));

jest.mock('@zxing/library', () => ({
  BarcodeFormat: { QR_CODE: 'QR_CODE' },
  DecodeHintType: {
    POSSIBLE_FORMATS: 'POSSIBLE_FORMATS',
    TRY_HARDER: 'TRY_HARDER',
    CHARACTER_SET: 'CHARACTER_SET',
  },
}));

const MockBrowserQRCodeReader = BrowserQRCodeReader as jest.MockedClass<
  typeof BrowserQRCodeReader
>;

const flushPromises = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

const createMockStream = () => {
  const track = { stop: jest.fn() };
  return {
    track,
    stream: { getTracks: () => [track] } as unknown as MediaStream,
  };
};

describe('EnhancedQrReader', () => {
  let mockDecodeFromStream: jest.Mock;
  let mockGetUserMedia: jest.Mock;
  let mockControls: { stop: jest.Mock };
  let mockStream: ReturnType<typeof createMockStream>;
  const originalMediaDevices = globalThis.navigator.mediaDevices;

  beforeEach(() => {
    mockControls = { stop: jest.fn() };
    mockStream = createMockStream();
    mockDecodeFromStream = jest.fn().mockResolvedValue(mockControls);
    mockGetUserMedia = jest.fn().mockResolvedValue(mockStream.stream);

    Object.defineProperty(globalThis.navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: mockGetUserMedia },
    });

    MockBrowserQRCodeReader.mockImplementation(
      () =>
        ({
          decodeFromStream: mockDecodeFromStream,
        }) as unknown as BrowserQRCodeReader,
    );
  });

  afterEach(() => {
    Object.defineProperty(globalThis.navigator, 'mediaDevices', {
      configurable: true,
      value: originalMediaDevices,
    });
    jest.restoreAllMocks();
  });

  describe('rendering', () => {
    it('hides video and shows spinner before canplay fires', () => {
      const { container } = render(<EnhancedQrReader onFrame={jest.fn()} />);

      const video = container.querySelector('video') as HTMLVideoElement;
      expect(video).toBeInTheDocument();
      expect(video.style.display).toBe('none');
      expect(container.querySelector('.spinner')).toBeInTheDocument();
    });

    it('shows video and hides spinner after canplay fires', () => {
      const { container } = render(<EnhancedQrReader onFrame={jest.fn()} />);

      const video = container.querySelector('video') as HTMLVideoElement;

      act(() => {
        video.dispatchEvent(new Event('canplay'));
      });

      expect(video.style.display).toBe('block');
      expect(container.querySelector('.spinner')).not.toBeInTheDocument();
    });
  });

  describe('QR reader initialization', () => {
    it('configures BrowserQRCodeReader with optimized scan intervals', () => {
      render(<EnhancedQrReader onFrame={jest.fn()} />);

      expect(MockBrowserQRCodeReader).toHaveBeenCalledWith(
        expect.any(Map),
        expect.objectContaining({
          delayBetweenScanAttempts: 80,
          delayBetweenScanSuccess: 50,
        }),
      );
    });

    it('enables TRY_HARDER and CHARACTER_SET decode hints', () => {
      render(<EnhancedQrReader onFrame={jest.fn()} />);

      const [hintsArg] = MockBrowserQRCodeReader.mock.calls[0] ?? [];
      const hints = hintsArg as unknown as Map<string, unknown>;
      expect(hints.get('TRY_HARDER')).toBe(true);
      expect(hints.get('CHARACTER_SET')).toBe('UTF-8');
    });

    it('requests the camera stream with HD video constraints', () => {
      render(<EnhancedQrReader onFrame={jest.fn()} />);

      expect(mockGetUserMedia).toHaveBeenCalledWith(
        expect.objectContaining({
          audio: false,
          video: expect.objectContaining({
            width: { ideal: 1280 },
            height: { ideal: 720 },
          }),
        }),
      );
    });

    it('starts decoding from the acquired stream', async () => {
      render(<EnhancedQrReader onFrame={jest.fn()} />);

      await flushPromises();

      expect(mockDecodeFromStream).toHaveBeenCalledWith(
        mockStream.stream,
        expect.any(HTMLVideoElement),
        expect.any(Function),
      );
    });
  });

  describe('onFrame callback', () => {
    it('invokes onFrame with decoded text on successful scan', async () => {
      const onFrame = jest.fn();
      mockDecodeFromStream.mockImplementation((_stream, _elem, callback) => {
        callback({ getText: () => 'decoded-payload' });
        return Promise.resolve(mockControls);
      });

      render(<EnhancedQrReader onFrame={onFrame} />);
      await flushPromises();

      expect(onFrame).toHaveBeenCalledWith('decoded-payload');
    });

    it('does not invoke onFrame when result is undefined', async () => {
      const onFrame = jest.fn();
      mockDecodeFromStream.mockImplementation((_stream, _elem, callback) => {
        callback(undefined);
        return Promise.resolve(mockControls);
      });

      render(<EnhancedQrReader onFrame={onFrame} />);
      await flushPromises();

      expect(onFrame).not.toHaveBeenCalled();
    });

    it('uses the latest onFrame without restarting the camera', async () => {
      const firstOnFrame = jest.fn();
      const secondOnFrame = jest.fn();

      const { rerender } = render(<EnhancedQrReader onFrame={firstOnFrame} />);
      await flushPromises();
      rerender(<EnhancedQrReader onFrame={secondOnFrame} />);
      await flushPromises();

      const [, , scanCallback] = mockDecodeFromStream.mock.calls[0];
      scanCallback({ getText: () => 'decoded-payload' });

      expect(mockGetUserMedia).toHaveBeenCalledTimes(1);
      expect(mockControls.stop).not.toHaveBeenCalled();
      expect(firstOnFrame).not.toHaveBeenCalled();
      expect(secondOnFrame).toHaveBeenCalledWith('decoded-payload');
    });
  });

  describe('camera start failures', () => {
    it('releases the stream and logs when decoding fails to start', async () => {
      const logDebugSpy = jest.spyOn(log, 'debug');
      const error = new Error('play failed');
      mockDecodeFromStream.mockRejectedValue(error);

      render(<EnhancedQrReader onFrame={jest.fn()} />);
      await flushPromises();

      expect(mockStream.track.stop).toHaveBeenCalledTimes(1);
      expect(logDebugSpy).toHaveBeenCalledWith(error);
    });

    it('logs rejection instead of throwing when the camera fails to start', async () => {
      const logDebugSpy = jest.spyOn(log, 'debug');
      const error = new Error('camera unavailable');
      mockGetUserMedia.mockRejectedValue(error);

      render(<EnhancedQrReader onFrame={jest.fn()} />);
      await flushPromises();

      expect(logDebugSpy).toHaveBeenCalledWith(error);
      expect(mockDecodeFromStream).not.toHaveBeenCalled();
    });
  });

  describe('StrictMode', () => {
    it('attaches only one stream under StrictMode double mount', async () => {
      const staleStream = createMockStream();
      mockGetUserMedia
        .mockResolvedValueOnce(staleStream.stream)
        .mockResolvedValueOnce(mockStream.stream);

      render(
        <React.StrictMode>
          <EnhancedQrReader onFrame={jest.fn()} />
        </React.StrictMode>,
      );
      await flushPromises();

      expect(mockGetUserMedia).toHaveBeenCalledTimes(2);
      expect(staleStream.track.stop).toHaveBeenCalledTimes(1);
      expect(mockDecodeFromStream).toHaveBeenCalledTimes(1);
      expect(mockDecodeFromStream).toHaveBeenCalledWith(
        mockStream.stream,
        expect.any(HTMLVideoElement),
        expect.any(Function),
      );
      expect(mockControls.stop).not.toHaveBeenCalled();
      expect(mockStream.track.stop).not.toHaveBeenCalled();
    });
  });

  describe('cleanup on unmount', () => {
    it('stops scanner controls when component unmounts', async () => {
      const { unmount } = render(<EnhancedQrReader onFrame={jest.fn()} />);
      await flushPromises();

      unmount();

      expect(mockControls.stop).toHaveBeenCalledTimes(1);
    });

    it('releases the stream without attaching it when unmounted before the camera resolves', async () => {
      const { unmount } = render(<EnhancedQrReader onFrame={jest.fn()} />);

      unmount();
      await flushPromises();

      expect(mockStream.track.stop).toHaveBeenCalledTimes(1);
      expect(mockDecodeFromStream).not.toHaveBeenCalled();
    });

    it('stops scanner controls when unmounted while decoding is starting', async () => {
      let resolveDecode: (controls: typeof mockControls) => void = jest.fn();
      mockDecodeFromStream.mockReturnValue(
        new Promise((resolve) => {
          resolveDecode = resolve;
        }),
      );

      const { unmount } = render(<EnhancedQrReader onFrame={jest.fn()} />);
      await flushPromises();

      unmount();
      await act(async () => {
        resolveDecode(mockControls);
      });

      expect(mockControls.stop).toHaveBeenCalledTimes(1);
    });

    it('removes canplay listener on unmount', () => {
      const { container, unmount } = render(
        <EnhancedQrReader onFrame={jest.fn()} />,
      );

      const video = container.querySelector('video') as HTMLVideoElement;
      const removeSpy = jest.spyOn(video, 'removeEventListener');

      unmount();

      expect(removeSpy).toHaveBeenCalledWith('canplay', expect.any(Function));
    });
  });
});
