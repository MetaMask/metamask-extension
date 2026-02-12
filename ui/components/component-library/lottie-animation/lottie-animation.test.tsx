import React from 'react';
import { render, act } from '@testing-library/react';
import lottie from 'lottie-web/build/player/lottie_light';
import { LottieAnimation } from './lottie-animation';

// Mock lottie-web
jest.mock('lottie-web/build/player/lottie_light', () => {
  const eventListeners: { [key: string]: (() => void) | undefined } = {};
  return {
    loadAnimation: jest.fn(() => ({
      destroy: jest.fn(),
      addEventListener: jest.fn((event: string, callback: () => void) => {
        eventListeners[event] = callback;
      }),
      removeEventListener: jest.fn((event: string) => {
        delete eventListeners[event];
      }),
      // Method to trigger the 'complete' event in tests
      triggerComplete: () => eventListeners.complete?.(),
    })),
  };
});

describe('LottieAnimation', () => {
  const mockData = {
    /* Your mock animation data here */
  };
  const mockPath = 'https://example.com/animation.json';

  it('renders without crashing', () => {
    const { container } = render(<LottieAnimation data={mockData} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const customClass = 'custom-class';
    const { container } = render(
      <LottieAnimation data={mockData} className={customClass} />,
    );
    expect(container.firstChild).toHaveClass(customClass);
  });

  it('applies custom style', () => {
    const customStyle = { width: '100px', height: '100px' };
    const { container } = render(
      <LottieAnimation data={mockData} style={customStyle} />,
    );
    const element = container.firstChild as HTMLElement;
    expect(element).toHaveStyle('width: 100px');
    expect(element).toHaveStyle('height: 100px');
  });

  it('calls lottie.loadAnimation with correct config when using data', () => {
    render(<LottieAnimation data={mockData} loop={false} autoplay={false} />);

    expect(lottie.loadAnimation).toHaveBeenCalledWith(
      expect.objectContaining({
        animationData: mockData,
        loop: false,
        autoplay: false,
        renderer: 'svg',
        container: expect.any(HTMLElement),
      }),
    );
  });

  it('calls lottie.loadAnimation with correct config when using path', () => {
    render(<LottieAnimation path={mockPath} loop={true} autoplay={true} />);

    expect(lottie.loadAnimation).toHaveBeenCalledWith(
      expect.objectContaining({
        path: mockPath,
        loop: true,
        autoplay: true,
        renderer: 'svg',
        container: expect.any(HTMLElement),
      }),
    );
  });

  it('logs an error when neither data nor path is provided', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    render(<LottieAnimation />);

    expect(consoleSpy).toHaveBeenCalledWith(
      'LottieAnimation: Exactly one of data or path must be provided',
    );
    consoleSpy.mockRestore();
  });

  it('logs an error when both data and path are provided', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    render(<LottieAnimation data={mockData} path={mockPath} />);

    expect(consoleSpy).toHaveBeenCalledWith(
      'LottieAnimation: Exactly one of data or path must be provided',
    );
    consoleSpy.mockRestore();
  });

  it('calls onComplete when animation completes', () => {
    const onCompleteMock = jest.fn();

    render(<LottieAnimation data={mockData} onComplete={onCompleteMock} />);

    const animationInstance = (lottie.loadAnimation as jest.Mock).mock
      .results[0].value;

    act(() => {
      animationInstance.triggerComplete();
    });

    expect(onCompleteMock).toHaveBeenCalledTimes(1);
  });

  it('removes event listener on unmount', () => {
    const onCompleteMock = jest.fn();

    const { unmount } = render(
      <LottieAnimation data={mockData} onComplete={onCompleteMock} />,
    );

    const animationInstance = (lottie.loadAnimation as jest.Mock).mock
      .results[0].value;

    unmount();

    expect(animationInstance.removeEventListener).toHaveBeenCalledWith(
      'complete',
      expect.any(Function),
    );
  });
});
