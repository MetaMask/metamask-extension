import { act, renderHook } from '@testing-library/react';
import { useOneShotBusyRefetch } from './useOneShotBusyRefetch';

describe('useOneShotBusyRefetch', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest
      .spyOn(globalThis.crypto, 'getRandomValues')
      .mockImplementation((array) => {
        (array as Uint32Array)[0] = 0;
        return array;
      });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('refetches once after a short busy wait and not again', () => {
    const refetch = jest.fn();
    const { result } = renderHook(() => useOneShotBusyRefetch());

    act(() => {
      result.current.arm(
        { data: { status: 503, retryAfterSeconds: 2 } },
        refetch,
      );
    });
    expect(refetch).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(refetch).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('does not arm a wait longer than 30 seconds', () => {
    const refetch = jest.fn();
    const { result } = renderHook(() => useOneShotBusyRefetch());

    act(() => {
      result.current.arm(
        { data: { status: 429, retryAfterSeconds: 31 } },
        refetch,
      );
    });
    act(() => {
      jest.advanceTimersByTime(31000);
    });

    expect(refetch).not.toHaveBeenCalled();
  });

  it('cancels a pending refetch on unmount', () => {
    const refetch = jest.fn();
    const { result, unmount } = renderHook(() => useOneShotBusyRefetch());

    act(() => {
      result.current.arm(
        { data: { status: 429, retryAfterSeconds: 2 } },
        refetch,
      );
    });
    unmount();
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(refetch).not.toHaveBeenCalled();
  });
});
