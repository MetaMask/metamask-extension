import { StrictMode } from 'react';
import { it as jestIt } from '@jest/globals';
import { act, renderHook } from '@testing-library/react';
import { useAfterPaint } from './useAfterPaint';

describe('useAfterPaint', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  const advanceFrame = () => act(() => jest.advanceTimersByTime(16));

  it('waits for a ready commit and two frames, including StrictMode replay', () => {
    const callback = jest.fn();
    const { rerender } = renderHook(
      ({ ready }) => useAfterPaint(ready, callback),
      { initialProps: { ready: false }, wrapper: StrictMode },
    );
    advanceFrame();
    advanceFrame();
    expect(callback).not.toHaveBeenCalled();

    rerender({ ready: true });
    advanceFrame();
    expect(callback).not.toHaveBeenCalled();
    advanceFrame();
    expect(callback).toHaveBeenCalledTimes(1);

    rerender({ ready: true });
    advanceFrame();
    expect(callback).toHaveBeenCalledTimes(1);
  });

  jestIt.each(['unmount', 'unready', 'callback change'] as const)(
    'cancels pending work on %s',
    (reason) => {
      const callback = jest.fn();
      const replacement = jest.fn();
      const { rerender, unmount } = renderHook(
        (props) => useAfterPaint(props.ready, props.callback),
        { initialProps: { ready: true, callback }, wrapper: StrictMode },
      );
      advanceFrame();
      if (reason === 'unmount') {
        unmount();
      } else {
        rerender({
          ready: reason !== 'unready',
          callback: reason === 'callback change' ? replacement : callback,
        });
      }
      advanceFrame();
      advanceFrame();
      expect(callback).not.toHaveBeenCalled();

      if (reason === 'unready') {
        rerender({ ready: true, callback });
        advanceFrame();
        advanceFrame();
        expect(callback).toHaveBeenCalledTimes(1);
      } else if (reason === 'callback change') {
        expect(replacement).toHaveBeenCalledTimes(1);
      }
    },
  );

  it('does not schedule work without a callback', () => {
    const requestFrame = jest.spyOn(window, 'requestAnimationFrame');
    renderHook(() => useAfterPaint(true));
    expect(requestFrame).not.toHaveBeenCalled();
  });
});
