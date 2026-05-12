import React from 'react';
import { render, act } from '@testing-library/react';
import { BrowserQRCodeReader } from '@zxing/browser';
import log from 'loglevel';
import EnhancedReader from './enhanced-reader';

jest.mock('@zxing/browser', () => ({
  BrowserQRCodeReader: jest.fn(),
}));

jest.mock('@zxing/library', () => ({
  BarcodeFormat: { QR_CODE: 'QR_CODE' },
  DecodeHintType: { POSSIBLE_FORMATS: 'POSSIBLE_FORMATS' },
}));

const MockBrowserQRCodeReader = BrowserQRCodeReader as jest.MockedClass<
  typeof BrowserQRCodeReader
>;

describe('EnhancedReader', () => {
  let mockDecodeFromVideoDevice: jest.Mock;
  let mockControls: { stop: jest.Mock };

  beforeEach(() => {
    mockControls = { stop: jest.fn() };
    mockDecodeFromVideoDevice = jest.fn().mockResolvedValue(mockControls);

    MockBrowserQRCodeReader.mockImplementation(
      () =>
        ({
          decodeFromVideoDevice: mockDecodeFromVideoDevice,
        }) as unknown as BrowserQRCodeReader,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('rendering', () => {
    it('hides video and shows spinner before canplay fires', () => {
      const { container } = render(<EnhancedReader onFrame={jest.fn()} />);

      const video = container.querySelector('video') as HTMLVideoElement;
      expect(video).toBeInTheDocument();
      expect(video.style.display).toBe('none');
      expect(container.querySelector('.spinner')).toBeInTheDocument();
    });

    it('shows video and hides spinner after canplay fires', () => {
      const { container } = render(<EnhancedReader onFrame={jest.fn()} />);

      const video = container.querySelector('video') as HTMLVideoElement;

      act(() => {
        video.dispatchEvent(new Event('canplay'));
      });

      expect(video.style.display).toBe('block');
      expect(container.querySelector('.spinner')).not.toBeInTheDocument();
    });
  });

  describe('QR reader initialization', () => {
    it('configures BrowserQRCodeReader with scan interval options', () => {
      render(<EnhancedReader onFrame={jest.fn()} />);

      expect(MockBrowserQRCodeReader).toHaveBeenCalledWith(
        expect.any(Map),
        expect.objectContaining({
          delayBetweenScanAttempts: 100,
          delayBetweenScanSuccess: 100,
        }),
      );
    });

    it('starts decoding from the video element ref', () => {
      render(<EnhancedReader onFrame={jest.fn()} />);

      expect(mockDecodeFromVideoDevice).toHaveBeenCalledWith(
        undefined,
        expect.any(HTMLVideoElement),
        expect.any(Function),
      );
    });
  });

  describe('onFrame callback', () => {
    it('invokes onFrame with decoded text on successful scan', () => {
      const onFrame = jest.fn();
      mockDecodeFromVideoDevice.mockImplementation(
        (_device, _elem, callback) => {
          callback({ getText: () => 'decoded-payload' });
          return Promise.resolve(mockControls);
        },
      );

      render(<EnhancedReader onFrame={onFrame} />);

      expect(onFrame).toHaveBeenCalledWith('decoded-payload');
    });

    it('does not invoke onFrame when result is undefined', () => {
      const onFrame = jest.fn();
      mockDecodeFromVideoDevice.mockImplementation(
        (_device, _elem, callback) => {
          callback(undefined);
          return Promise.resolve(mockControls);
        },
      );

      render(<EnhancedReader onFrame={onFrame} />);

      expect(onFrame).not.toHaveBeenCalled();
    });
  });

  describe('cleanup on unmount', () => {
    it('stops scanner controls when component unmounts', async () => {
      const { unmount } = render(<EnhancedReader onFrame={jest.fn()} />);

      unmount();

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(mockControls.stop).toHaveBeenCalledTimes(1);
    });

    it('handles gracefully when controls resolve to undefined', async () => {
      mockDecodeFromVideoDevice.mockResolvedValue(undefined);

      const { unmount } = render(<EnhancedReader onFrame={jest.fn()} />);

      unmount();

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(mockControls.stop).not.toHaveBeenCalled();
    });

    it('logs rejection instead of throwing when cleanup fails', async () => {
      const logDebugSpy = jest.spyOn(log, 'debug');
      mockDecodeFromVideoDevice.mockRejectedValue(new Error('cleanup failed'));

      const { unmount } = render(<EnhancedReader onFrame={jest.fn()} />);

      unmount();

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(logDebugSpy).toHaveBeenCalled();
    });

    it('removes canplay listener on unmount', () => {
      const { container, unmount } = render(
        <EnhancedReader onFrame={jest.fn()} />,
      );

      const video = container.querySelector('video') as HTMLVideoElement;
      const removeSpy = jest.spyOn(video, 'removeEventListener');

      unmount();

      expect(removeSpy).toHaveBeenCalledWith('canplay', expect.any(Function));
    });
  });
});
