import React from 'react';
import { render, act } from '@testing-library/react';
import { LottieAnimation } from './lottie-animation';

// Mock lottie-web
jest.mock('lottie-web', () => {
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
  const mockPath = 'path/to/animation.json';

  it('renders without crashing', () => {
    const { container } = render(<LottieAnimation path={mockPath} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const customClass = 'custom-class';
    const { container } = render(
      <LottieAnimation path={mockPath} className={customClass} />,
    );
    expect(container.firstChild).toHaveClass(customClass);
  });

  it('applies custom style', () => {
    const customStyle = { width: '100px', height: '100px' };
    const { container } = render(
      <LottieAnimation path={mockPath} style={customStyle} />,
    );
    const element = container.firstChild as HTMLElement;
    expect(element).toHaveStyle('width: 100px');
    expect(element).toHaveStyle('height: 100px');
  });

  it('calls lottie.loadAnimation with correct config', () => {
    const lottie = require('lottie-web');
    render(<LottieAnimation path={mockPath} loop={false} autoplay={false} />);

    expect(lottie.loadAnimation).toHaveBeenCalledWith(
      expect.objectContaining({
        path: mockPath,
        loop: false,
        autoplay: false,
        renderer: 'svg',
      }),
    );
  });

  it('calls onComplete when animation completes', () => {
    const onCompleteMock = jest.fn();
    const lottie = require('lottie-web');

    render(<LottieAnimation path={mockPath} onComplete={onCompleteMock} />);

    const animationInstance = lottie.loadAnimation.mock.results[0].value;

    act(() => {
      animationInstance.triggerComplete();
    });

    expect(onCompleteMock).toHaveBeenCalledTimes(1);
  });

  it('removes event listener on unmount', () => {
    const onCompleteMock = jest.fn();
    const lottie = require('lottie-web');

    const { unmount } = render(
      <LottieAnimation path={mockPath} onComplete={onCompleteMock} />,
    );

    const animationInstance = lottie.loadAnimation.mock.results[0].value;

    unmount();

    expect(animationInstance.removeEventListener).toHaveBeenCalledWith(
      'complete',
      expect.any(Function),
    );
  });
});
