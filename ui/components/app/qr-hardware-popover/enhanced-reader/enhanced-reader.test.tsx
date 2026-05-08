import React from 'react';
import { render, act } from '@testing-library/react';
import { BrowserQRCodeReader } from '@zxing/browser';
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

  it('renders a video element hidden with spinner when isVisible is false', () => {
    const { container } = render(
      <EnhancedReader onFrame={jest.fn()} isVisible={false} />,
    );

    const video = container.querySelector('video') as HTMLVideoElement;
    expect(video).toBeInTheDocument();
    expect(video.style.display).toBe('none');
    expect(container.querySelector('.spinner')).toBeInTheDocument();
  });

  it('renders video visible without spinner when isVisible is true', () => {
    const { container } = render(
      <EnhancedReader onFrame={jest.fn()} isVisible />,
    );

    const video = container.querySelector('video') as HTMLVideoElement;
    expect(video.style.display).toBe('block');
    expect(container.querySelector('.spinner')).not.toBeInTheDocument();
  });

  it('initializes BrowserQRCodeReader with QR_CODE hint', () => {
    render(<EnhancedReader onFrame={jest.fn()} isVisible />);

    expect(MockBrowserQRCodeReader).toHaveBeenCalledWith(
      expect.any(Map),
      expect.objectContaining({
        delayBetweenScanAttempts: 100,
        delayBetweenScanSuccess: 100,
      }),
    );
  });

  it('calls decodeFromVideoDevice with a video element ref', () => {
    render(<EnhancedReader onFrame={jest.fn()} isVisible />);

    expect(mockDecodeFromVideoDevice).toHaveBeenCalledWith(
      undefined,
      expect.any(HTMLVideoElement),
      expect.any(Function),
    );
  });

  it('invokes onFrame when a QR code is decoded', () => {
    const onFrame = jest.fn();

    mockDecodeFromVideoDevice.mockImplementation((_device, _elem, callback) => {
      callback({ getText: () => 'decoded-payload' }, null);
      return Promise.resolve(mockControls);
    });

    render(<EnhancedReader onFrame={onFrame} isVisible />);

    expect(onFrame).toHaveBeenCalledWith('decoded-payload');
  });

  it('does not invoke onFrame when result is null', () => {
    const onFrame = jest.fn();

    mockDecodeFromVideoDevice.mockImplementation((_device, _elem, callback) => {
      callback(null, null);
      return Promise.resolve(mockControls);
    });

    render(<EnhancedReader onFrame={onFrame} isVisible />);

    expect(onFrame).not.toHaveBeenCalled();
  });

  it('invokes onCameraError when decode reports an error', () => {
    const onCameraError = jest.fn();
    const scanError = new Error('Camera lost');

    mockDecodeFromVideoDevice.mockImplementation((_device, _elem, callback) => {
      callback(null, scanError);
      return Promise.resolve(mockControls);
    });

    render(
      <EnhancedReader
        onFrame={jest.fn()}
        onCameraError={onCameraError}
        isVisible
      />,
    );

    expect(onCameraError).toHaveBeenCalledWith(scanError);
  });

  it('passes the error object directly to onCameraError', () => {
    const onCameraError = jest.fn();
    const scanError = new Error('Device unavailable');

    mockDecodeFromVideoDevice.mockImplementation((_device, _elem, callback) => {
      callback(null, scanError);
      return Promise.resolve(mockControls);
    });

    render(
      <EnhancedReader
        onFrame={jest.fn()}
        onCameraError={onCameraError}
        isVisible
      />,
    );

    expect(onCameraError).toHaveBeenCalledWith(scanError);
  });

  it('stops controls on unmount', async () => {
    const { unmount } = render(
      <EnhancedReader onFrame={jest.fn()} isVisible />,
    );

    unmount();

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(mockControls.stop).toHaveBeenCalled();
  });

  it('does not call onCameraError when callback is not provided', () => {
    mockDecodeFromVideoDevice.mockImplementation((_device, _elem, callback) => {
      callback(null, new Error('ignored'));
      return Promise.resolve(mockControls);
    });

    expect(() => {
      render(<EnhancedReader onFrame={jest.fn()} isVisible />);
    }).not.toThrow();
  });
});
