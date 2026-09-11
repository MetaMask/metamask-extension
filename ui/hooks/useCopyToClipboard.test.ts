import { renderHook, act } from '@testing-library/react';
import { DEFAULT_UI_DELAY, useCopyToClipboard } from './useCopyToClipboard';

describe('useCopyToClipboard', () => {
  const mockCopyToClipboard = globalThis.navigator.clipboard
    .writeText as unknown as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('copies text and resets copy feedback after the default delay', () => {
    const { result } = renderHook(() => useCopyToClipboard());
    const [, handleCopy] = result.current;

    // Act/Assert - Copy
    act(() => handleCopy('test'));
    expect(mockCopyToClipboard).toHaveBeenNthCalledWith(1, 'test');
    expect(result.current[0]).toBe(true);

    // Act/Assert - Expiry only resets the UI state.
    act(() => {
      jest.advanceTimersByTime(DEFAULT_UI_DELAY + 1);
    });
    expect(mockCopyToClipboard).toHaveBeenCalledTimes(1);
    expect(result.current[0]).toBe(false);
  });

  it('does not write to the clipboard again after copy feedback resets', () => {
    const { result } = renderHook(() => useCopyToClipboard());
    const [, handleCopy] = result.current;

    // Act/Assert - Copy
    act(() => handleCopy('test'));
    expect(mockCopyToClipboard).toHaveBeenNthCalledWith(1, 'test');
    expect(result.current[0]).toBe(true);

    // Act/Assert - Expiry
    act(() => {
      jest.advanceTimersByTime(DEFAULT_UI_DELAY + 1);
    });
    expect(mockCopyToClipboard).toHaveBeenCalledTimes(1);
    expect(result.current[0]).toBe(false);
  });

  it('resets copied state when invoked', () => {
    const { result } = renderHook(() => useCopyToClipboard());
    const [, handleCopy, resetCopyState] = result.current;

    // Act/Assert - Copy
    act(() => handleCopy('test'));
    expect(mockCopyToClipboard).toHaveBeenNthCalledWith(1, 'test');
    expect(result.current[0]).toBe(true);

    // Act/Assert - Copy State Reset
    act(() => resetCopyState());
    expect(result.current[0]).toBe(false);

    // Act/Assert - No Expiry (as the copy state was reset)
    act(() => {
      jest.advanceTimersByTime(DEFAULT_UI_DELAY + 1);
    });
    expect(mockCopyToClipboard).toHaveBeenCalledTimes(1); // it was not called a second time
    expect(result.current[0]).toBe(false);
  });
});
