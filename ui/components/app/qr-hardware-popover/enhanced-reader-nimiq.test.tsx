import React from 'react';
import { render, act, waitFor } from '@testing-library/react';
import QrScanner from 'qr-scanner';
import log from 'loglevel';
import EnhancedReaderNimiq from './enhanced-reader-nimiq';

jest.mock('qr-scanner');
jest.mock('loglevel', () => ({
  error: jest.fn(),
  warn: jest.fn(),
}));

class FakeMediaStream {
  private _tracks: { readyState: string; stop: jest.Mock }[];

  constructor(tracks: { readyState: string; stop: jest.Mock }[] = []) {
    this._tracks = tracks;
  }

  getTracks() {
    return this._tracks;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).MediaStream = FakeMediaStream;

const MockQrScanner = QrScanner as jest.MockedClass<typeof QrScanner>;

describe('EnhancedReaderNimiq', () => {
  let mockStart: jest.Mock;
  let mockDestroy: jest.Mock;
  let capturedOnDecode: ((result: { data: string }) => void) | null;
  let capturedOptions: Record<string, unknown> | null;

  beforeEach(() => {
    capturedOnDecode = null;
    capturedOptions = null;
    mockStart = jest.fn().mockResolvedValue(undefined);
    mockDestroy = jest.fn();

    MockQrScanner.mockImplementation(
      // @ts-expect-error The mock captures the new API signature which
      // doesn't match the legacy overload TypeScript resolves to.
      (
        _video: HTMLVideoElement,
        onDecode: (result: { data: string }) => void,
        options?: Record<string, unknown>,
      ) => {
        capturedOnDecode = onDecode;
        capturedOptions = options ?? null;
        return {
          start: mockStart,
          destroy: mockDestroy,
        } as unknown as QrScanner;
      },
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders a video element', () => {
      const { container } = render(
        <EnhancedReaderNimiq handleScan={jest.fn()} />,
      );

      const video = container.querySelector('video#video') as HTMLVideoElement;
      expect(video).toBeInTheDocument();
    });

    it('shows a loading spinner before camera is ready', () => {
      const { container } = render(
        <EnhancedReaderNimiq handleScan={jest.fn()} />,
      );

      expect(container.querySelector('.spinner')).toBeInTheDocument();
    });

    it('removes the spinner once the video fires canplay', async () => {
      const { container } = render(
        <EnhancedReaderNimiq handleScan={jest.fn()} />,
      );
      const video = container.querySelector('video#video') as HTMLVideoElement;

      await act(async () => {
        video.dispatchEvent(new Event('canplay'));
      });

      await waitFor(() => {
        expect(container.querySelector('.spinner')).not.toBeInTheDocument();
      });
    });
  });

  describe('scanner initialization', () => {
    it('passes the video element to QrScanner', () => {
      const { container } = render(
        <EnhancedReaderNimiq handleScan={jest.fn()} />,
      );
      const video = container.querySelector('video#video');

      expect(MockQrScanner).toHaveBeenCalledWith(
        video,
        expect.any(Function),
        expect.any(Object),
      );
    });

    it('configures maxScansPerSecond to 25 for fast decode', () => {
      render(<EnhancedReaderNimiq handleScan={jest.fn()} />);

      expect(capturedOptions).toMatchObject({
        maxScansPerSecond: 25,
      });
    });

    it('requests detailed scan results', () => {
      render(<EnhancedReaderNimiq handleScan={jest.fn()} />);

      expect(capturedOptions).toMatchObject({
        returnDetailedScanResult: true,
      });
    });

    it('prefers the environment-facing camera', () => {
      render(<EnhancedReaderNimiq handleScan={jest.fn()} />);

      expect(capturedOptions).toMatchObject({
        preferredCamera: 'environment',
      });
    });

    it('provides a calculateScanRegion that uses the full video frame', () => {
      render(<EnhancedReaderNimiq handleScan={jest.fn()} />);

      const calculateScanRegion =
        capturedOptions?.calculateScanRegion as (video: {
          videoWidth: number;
          videoHeight: number;
        }) => Record<string, number>;

      const region = calculateScanRegion({
        videoWidth: 1280,
        videoHeight: 720,
      });
      expect(region).toEqual({
        x: 0,
        y: 0,
        width: 1280,
        height: 720,
        downScaledWidth: 600,
        downScaledHeight: 600,
      });
    });

    it('calls scanner.start() on mount', () => {
      render(<EnhancedReaderNimiq handleScan={jest.fn()} />);

      expect(mockStart).toHaveBeenCalledTimes(1);
    });

    it('logs an error if scanner.start() rejects', async () => {
      const startError = new Error('Camera unavailable');
      mockStart.mockRejectedValueOnce(startError);

      render(<EnhancedReaderNimiq handleScan={jest.fn()} />);

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(log.error).toHaveBeenCalledWith(
        'QR scanner (nimiq): failed to start camera',
        startError,
      );
    });
  });

  describe('QR decode callback', () => {
    it('forwards decoded data to handleScan', () => {
      const handleScan = jest.fn();
      render(<EnhancedReaderNimiq handleScan={handleScan} />);

      expect(capturedOnDecode).not.toBeNull();
      (capturedOnDecode as NonNullable<typeof capturedOnDecode>)({
        data: 'ur:crypto-account/test-payload',
      });

      expect(handleScan).toHaveBeenCalledWith('ur:crypto-account/test-payload');
    });

    it('always calls the latest handleScan without remounting', () => {
      const firstHandler = jest.fn();
      const secondHandler = jest.fn();

      const { rerender } = render(
        <EnhancedReaderNimiq handleScan={firstHandler} />,
      );

      rerender(<EnhancedReaderNimiq handleScan={secondHandler} />);

      (capturedOnDecode as NonNullable<typeof capturedOnDecode>)({
        data: 'ur:crypto-hdkey/data',
      });

      expect(firstHandler).not.toHaveBeenCalled();
      expect(secondHandler).toHaveBeenCalledWith('ur:crypto-hdkey/data');
    });

    it('does not recreate the scanner when handleScan reference changes', () => {
      const { rerender } = render(
        <EnhancedReaderNimiq handleScan={jest.fn()} />,
      );

      const callCountAfterMount = MockQrScanner.mock.calls.length;

      rerender(<EnhancedReaderNimiq handleScan={jest.fn()} />);

      expect(MockQrScanner.mock.calls.length).toBe(callCountAfterMount);
      expect(mockDestroy).not.toHaveBeenCalled();
    });
  });

  describe('cleanup on unmount', () => {
    it('calls scanner.destroy()', () => {
      const { unmount } = render(
        <EnhancedReaderNimiq handleScan={jest.fn()} />,
      );

      unmount();

      expect(mockDestroy).toHaveBeenCalledTimes(1);
    });

    it('force-stops tracks still in live state after destroy', () => {
      const { container, unmount } = render(
        <EnhancedReaderNimiq handleScan={jest.fn()} />,
      );

      const video = container.querySelector('video#video') as HTMLVideoElement;
      const liveTrack = { readyState: 'live', stop: jest.fn() };
      const mockStream = new FakeMediaStream([liveTrack]);

      Object.defineProperty(video, 'srcObject', {
        value: mockStream,
        writable: true,
        configurable: true,
      });

      unmount();

      expect(liveTrack.stop).toHaveBeenCalledTimes(1);
    });

    it('does not stop tracks that are already ended', () => {
      const { container, unmount } = render(
        <EnhancedReaderNimiq handleScan={jest.fn()} />,
      );

      const video = container.querySelector('video#video') as HTMLVideoElement;
      const endedTrack = { readyState: 'ended', stop: jest.fn() };
      const mockStream = new FakeMediaStream([endedTrack]);

      Object.defineProperty(video, 'srcObject', {
        value: mockStream,
        writable: true,
        configurable: true,
      });

      unmount();

      expect(endedTrack.stop).not.toHaveBeenCalled();
    });

    it('logs a warning when leaked tracks are detected', () => {
      const { container, unmount } = render(
        <EnhancedReaderNimiq handleScan={jest.fn()} />,
      );

      const video = container.querySelector('video#video') as HTMLVideoElement;
      const liveTrack = { readyState: 'live', stop: jest.fn() };
      const mockStream = new FakeMediaStream([liveTrack]);

      Object.defineProperty(video, 'srcObject', {
        value: mockStream,
        writable: true,
        configurable: true,
      });

      unmount();

      expect(log.warn).toHaveBeenCalledWith(
        'QR scanner (nimiq): leaked tracks detected after destroy',
        [liveTrack],
      );
    });

    it('does not warn or stop when srcObject is null', () => {
      const { container, unmount } = render(
        <EnhancedReaderNimiq handleScan={jest.fn()} />,
      );

      const video = container.querySelector('video#video') as HTMLVideoElement;
      Object.defineProperty(video, 'srcObject', {
        value: null,
        writable: true,
        configurable: true,
      });

      unmount();

      expect(log.warn).not.toHaveBeenCalled();
    });

    it('handles a mix of live and ended tracks correctly', () => {
      const { container, unmount } = render(
        <EnhancedReaderNimiq handleScan={jest.fn()} />,
      );

      const video = container.querySelector('video#video') as HTMLVideoElement;
      const liveTrack = { readyState: 'live', stop: jest.fn() };
      const endedTrack = { readyState: 'ended', stop: jest.fn() };
      const mockStream = new FakeMediaStream([liveTrack, endedTrack]);

      Object.defineProperty(video, 'srcObject', {
        value: mockStream,
        writable: true,
        configurable: true,
      });

      unmount();

      expect(liveTrack.stop).toHaveBeenCalledTimes(1);
      expect(endedTrack.stop).not.toHaveBeenCalled();
    });
  });
});
