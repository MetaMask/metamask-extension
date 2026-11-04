import React from 'react';
import { act, render, screen } from '@testing-library/react';
import {
  mockResizeObserver,
  type ResizeObserverMock,
} from '../../test/lib/mock-resize-observer';
import { useAmountInputFontSize } from './useAmountInputFontSize';

const LONG_AMOUNT = '500000000000000000';

const Harness = ({
  text,
  fallbackWidth,
  onRender,
}: {
  text: string;
  fallbackWidth?: number;
  onRender?: () => void;
}) => {
  const { containerRef, fontSize } = useAmountInputFontSize(text, {
    fallbackWidth,
    maxFontSize: 40,
  });
  onRender?.();
  return (
    <div ref={containerRef} data-testid="container">
      <span data-testid="font-size">{fontSize}</span>
    </div>
  );
};

describe('useAmountInputFontSize', () => {
  let resizeObserver: ResizeObserverMock;

  beforeEach(() => {
    resizeObserver = mockResizeObserver();
  });

  afterEach(() => {
    resizeObserver.restore();
  });

  const getFontSize = () => Number(screen.getByTestId('font-size').textContent);

  it('uses the fallback width until the container is measured', () => {
    render(<Harness text={LONG_AMOUNT} fallbackWidth={219} />);

    expect(getFontSize()).toBe(24);
  });

  it('uses the popup width as the default fallback', () => {
    render(<Harness text={LONG_AMOUNT} />);

    expect(getFontSize()).toBe(40);
  });

  it('reads the content width before the first resize notification', () => {
    const clientWidth = jest
      .spyOn(HTMLElement.prototype, 'clientWidth', 'get')
      .mockReturnValue(640);
    const computedStyle = jest
      .spyOn(window, 'getComputedStyle')
      .mockReturnValue({
        paddingLeft: '10px',
        paddingRight: '4px',
      } as CSSStyleDeclaration);

    try {
      render(<Harness text={LONG_AMOUNT} fallbackWidth={219} />);

      // 640px client width minus 14px of padding is the 626px content box,
      // and no resize notification has been delivered yet.
      expect(getFontSize()).toBe(40);
      expect(resizeObserver.constructorSpy).toHaveBeenCalledTimes(1);
    } finally {
      clientWidth.mockRestore();
      computedStyle.mockRestore();
    }
  });

  it('keeps the start size when the measured container is wide', () => {
    render(<Harness text={LONG_AMOUNT} fallbackWidth={219} />);

    act(() => resizeObserver.resize(626));

    expect(resizeObserver.observe).toHaveBeenCalledWith(
      screen.getByTestId('container'),
    );
    expect(getFontSize()).toBe(40);
  });

  it('steps down when the container is resized narrower', () => {
    render(<Harness text={LONG_AMOUNT} />);
    act(() => resizeObserver.resize(626));

    act(() => resizeObserver.resize(200.4));

    expect(getFontSize()).toBe(24);
  });

  it('falls back when the container reports a zero width', () => {
    render(<Harness text={LONG_AMOUNT} fallbackWidth={219} />);
    act(() => resizeObserver.resize(626));

    act(() => resizeObserver.resize(0));

    expect(getFontSize()).toBe(24);
  });

  it('renders once per keystroke without re-running the measurement', () => {
    const onRender = jest.fn();
    const { rerender } = render(<Harness text="1" onRender={onRender} />);
    act(() => resizeObserver.resize(626));
    onRender.mockClear();

    for (const text of ['12', '123', '1234', '12345']) {
      rerender(<Harness text={text} onRender={onRender} />);
    }

    expect(onRender).toHaveBeenCalledTimes(4);
    expect(resizeObserver.constructorSpy).toHaveBeenCalledTimes(1);
    expect(resizeObserver.observe).toHaveBeenCalledTimes(1);
    expect(resizeObserver.disconnect).not.toHaveBeenCalled();
  });

  it('does not re-render when a resize rounds to the same width', () => {
    const onRender = jest.fn();
    render(<Harness text="1" onRender={onRender} />);
    act(() => resizeObserver.resize(626));
    onRender.mockClear();

    act(() => resizeObserver.resize(626.3));
    act(() => resizeObserver.resize(625.6));

    expect(onRender).not.toHaveBeenCalled();
  });

  it('disconnects the observer on unmount', () => {
    const { unmount } = render(<Harness text="1" />);

    unmount();

    expect(resizeObserver.disconnect).toHaveBeenCalledTimes(1);
  });
});
