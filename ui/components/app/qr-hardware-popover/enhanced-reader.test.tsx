import React from 'react';
import { render, act, waitFor } from '@testing-library/react';
import { BrowserQRCodeReader } from '@zxing/browser';
import EnhancedReader from './enhanced-reader';

const MockBrowserQRCodeReader = BrowserQRCodeReader as jest.MockedClass<
  typeof BrowserQRCodeReader
>;

jest.mock('@zxing/browser', () => ({
  BrowserQRCodeReader: jest.fn(),
}));

jest.mock('@zxing/library', () => ({
  BarcodeFormat: { QR_CODE: 'QR_CODE' },
  DecodeHintType: { POSSIBLE_FORMATS: 'POSSIBLE_FORMATS' },
}));

describe('EnhancedReader', () => {
  let mockDecodeFromVideoDevice: jest.Mock;
  let mockControls: { stop: jest.Mock };
  let mockVideoElem: HTMLVideoElement;

  beforeEach(() => {
    mockControls = { stop: jest.fn() };
    mockDecodeFromVideoDevice = jest.fn().mockResolvedValue(mockControls);

    MockBrowserQRCodeReader.mockImplementation(
      () =>
        ({
          decodeFromVideoDevice: mockDecodeFromVideoDevice,
        }) as unknown as BrowserQRCodeReader,
    );

    // Create a mock video element in the DOM
    mockVideoElem = document.createElement('video');
    mockVideoElem.id = 'video';
    document.body.appendChild(mockVideoElem);
  });

  afterEach(() => {
    if (mockVideoElem?.parentNode) {
      mockVideoElem.parentNode.removeChild(mockVideoElem);
    }
    jest.restoreAllMocks();
  });

  it('renders a video element and spinner initially', () => {
    const handleScan = jest.fn();
    const { container } = render(<EnhancedReader handleScan={handleScan} />);

    // The component renders a video element with id="video"
    const renderedVideo = container.querySelector(
      'video#video',
    ) as HTMLVideoElement;
    expect(renderedVideo).toBeInTheDocument();
    expect(renderedVideo.style.display).toBe('none');

    // Spinner should be shown when canplay is false
    expect(container.querySelector('.spinner')).toBeInTheDocument();
  });

  it('sets up decodeFromVideoDevice with codeReader', () => {
    const handleScan = jest.fn();
    render(<EnhancedReader handleScan={handleScan} />);

    expect(mockDecodeFromVideoDevice).toHaveBeenCalledWith(
      undefined,
      'video',
      expect.any(Function),
    );
  });

  it('calls handleScan when QR code is detected', () => {
    const handleScan = jest.fn();

    // Capture the decode callback
    mockDecodeFromVideoDevice.mockImplementation(
      (
        _device: undefined,
        _elemId: string,
        callback: (result: { getText: () => string } | null) => void,
      ) => {
        callback({ getText: () => 'scanned-data' });
        return Promise.resolve(mockControls);
      },
    );

    render(<EnhancedReader handleScan={handleScan} />);

    expect(handleScan).toHaveBeenCalledWith('scanned-data');
  });

  it('does not call handleScan when result is null', () => {
    const handleScan = jest.fn();

    mockDecodeFromVideoDevice.mockImplementation(
      (
        _device: undefined,
        _elemId: string,
        callback: (result: null) => void,
      ) => {
        callback(null);
        return Promise.resolve(mockControls);
      },
    );

    render(<EnhancedReader handleScan={handleScan} />);

    expect(handleScan).not.toHaveBeenCalled();
  });

  it('hides spinner and shows video when canplay fires', async () => {
    const handleScan = jest.fn();
    const { container } = render(<EnhancedReader handleScan={handleScan} />);

    // Fire canplay event on the video element
    await act(async () => {
      mockVideoElem.dispatchEvent(new Event('canplay'));
    });

    await waitFor(() => {
      expect(container.querySelector('.spinner')).not.toBeInTheDocument();
    });

    const renderedVideo = container.querySelector(
      'video#video',
    ) as HTMLVideoElement;
    expect(renderedVideo.style.display).toBe('block');
  });

  it('cleans up on unmount by stopping controls', async () => {
    const handleScan = jest.fn();
    const { unmount } = render(<EnhancedReader handleScan={handleScan} />);

    unmount();

    // Allow the promise chain in cleanup to resolve
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(mockControls.stop).toHaveBeenCalled();
  });
});
