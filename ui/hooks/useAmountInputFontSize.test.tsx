import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { useAmountInputFontSize } from './useAmountInputFontSize';

type ResizeCallback = (entries: { contentRect: { width: number } }[]) => void;

const LONG_AMOUNT = '500000000000000000';

const Harness = ({
  text,
  fallbackWidth,
}: {
  text: string;
  fallbackWidth?: number;
}) => {
  const { containerRef, fontSize } = useAmountInputFontSize(text, {
    fallbackWidth,
    maxFontSize: 40,
  });
  return (
    <div ref={containerRef} data-testid="container">
      <span data-testid="font-size">{fontSize}</span>
    </div>
  );
};

describe('useAmountInputFontSize', () => {
  let resizeCallback: ResizeCallback | undefined;
  const observe = jest.fn();
  const disconnect = jest.fn();
  const originalResizeObserver = window.ResizeObserver;
  let clientWidthSpy: jest.SpyInstance;

  beforeEach(() => {
    resizeCallback = undefined;
    observe.mockClear();
    disconnect.mockClear();
    window.ResizeObserver = jest.fn((callback: ResizeCallback) => {
      resizeCallback = callback;
      return { observe, unobserve: jest.fn(), disconnect };
    }) as unknown as typeof ResizeObserver;
    clientWidthSpy = jest
      .spyOn(HTMLElement.prototype, 'clientWidth', 'get')
      .mockReturnValue(0);
  });

  afterEach(() => {
    window.ResizeObserver = originalResizeObserver;
    clientWidthSpy.mockRestore();
  });

  const getFontSize = () => Number(screen.getByTestId('font-size').textContent);

  it('uses the fallback width until the container is laid out', () => {
    render(<Harness text={LONG_AMOUNT} fallbackWidth={219} />);

    expect(getFontSize()).toBe(24);
  });

  it('keeps the start size when the measured container is wide', () => {
    clientWidthSpy.mockReturnValue(626);

    render(<Harness text={LONG_AMOUNT} fallbackWidth={219} />);

    expect(getFontSize()).toBe(40);
    expect(observe).toHaveBeenCalledWith(screen.getByTestId('container'));
  });

  it('steps down when the container is resized narrower', () => {
    clientWidthSpy.mockReturnValue(626);
    render(<Harness text={LONG_AMOUNT} />);

    act(() => {
      resizeCallback?.([{ contentRect: { width: 200.6 } }]);
    });

    expect(getFontSize()).toBe(24);
  });

  it('does not read the width again while the text changes', () => {
    clientWidthSpy.mockReturnValue(626);
    const { rerender } = render(<Harness text="1" />);
    const readsAfterMount = clientWidthSpy.mock.calls.length;

    rerender(<Harness text="12" />);
    rerender(<Harness text="123" />);

    expect(clientWidthSpy.mock.calls.length).toBe(readsAfterMount);
    expect(window.ResizeObserver).toHaveBeenCalledTimes(1);
  });

  it('disconnects the observer on unmount', () => {
    const { unmount } = render(<Harness text="1" />);

    unmount();

    expect(disconnect).toHaveBeenCalledTimes(1);
  });
});
