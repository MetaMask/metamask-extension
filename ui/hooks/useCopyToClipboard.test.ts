import { act } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import { DEFAULT_UI_DELAY, useCopyToClipboard } from './useCopyToClipboard';

describe('useCopyToClipboard', () => {
  const mockWriteText = jest.fn().mockResolvedValue(undefined);
  let originalClipboard: Clipboard | undefined;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    originalClipboard = globalThis.navigator.clipboard;
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      configurable: true,
      value: { writeText: mockWriteText },
    });
  });

  afterEach(() => {
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      configurable: true,
      value: originalClipboard,
    });
    jest.useRealTimers();
  });

  it('copies text and expires if clearDelay = 1000', async () => {
    const clearDelay = 1000;
    const { result } = renderHook(() =>
      useCopyToClipboard({ clearDelayMs: clearDelay }),
    );
    const [, handleCopy] = result.current;

    // Act/Assert - Copy
    await act(async () => {
      handleCopy('test');
    });
    expect(mockWriteText).toHaveBeenNthCalledWith(1, 'test');
    expect(result.current[0]).toBe(true);

    // Act/Assert - Expiry (clipboard is cleared)
    act(() => {
      jest.advanceTimersByTime(clearDelay + 1);
    });
    expect(mockWriteText).toHaveBeenCalledTimes(2);
    expect(mockWriteText).toHaveBeenNthCalledWith(2, ' ');
    expect(result.current[0]).toBe(false);
  });

  it('copies text and does not expire if clearDelayMs is null', async () => {
    const { result } = renderHook(() =>
      useCopyToClipboard({ clearDelayMs: null }),
    );
    const [, handleCopy] = result.current;

    // Act/Assert - Copy
    await act(async () => {
      handleCopy('test');
    });
    expect(mockWriteText).toHaveBeenNthCalledWith(1, 'test');
    expect(result.current[0]).toBe(true);

    // Act/Assert - Expiry (clipboard is not cleared)
    act(() => {
      jest.advanceTimersByTime(DEFAULT_UI_DELAY + 1);
    });
    expect(mockWriteText).toHaveBeenCalledTimes(1); // it was not called a second time
    expect(result.current[0]).toBe(false);
  });

  it('resets copied state when invoked', async () => {
    const clearDelay = 1000;
    const { result } = renderHook(() =>
      useCopyToClipboard({ clearDelayMs: clearDelay }),
    );
    const [, handleCopy, resetCopyState] = result.current;

    // Act/Assert - Copy
    await act(async () => {
      handleCopy('test');
    });
    expect(mockWriteText).toHaveBeenNthCalledWith(1, 'test');
    expect(result.current[0]).toBe(true);

    // Act/Assert - Copy State Reset
    act(() => resetCopyState());
    expect(result.current[0]).toBe(false);

    // Act/Assert - No Expiry (as the copy state was reset)
    act(() => {
      jest.advanceTimersByTime(clearDelay + 1);
    });
    expect(mockWriteText).toHaveBeenCalledTimes(1); // it was not called a second time
    expect(result.current[0]).toBe(false);
  });

  it('does not set copied when writeText rejects', async () => {
    mockWriteText.mockRejectedValueOnce(new Error('denied'));
    const { result } = renderHook(() =>
      useCopyToClipboard({ clearDelayMs: null }),
    );
    const [, handleCopy] = result.current;

    await act(async () => {
      handleCopy('test');
    });
    expect(mockWriteText).toHaveBeenCalledWith('test');
    expect(result.current[0]).toBe(false);
  });

  it('does not set copied when writeText is unavailable', () => {
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      configurable: true,
      value: {},
    });
    const { result } = renderHook(() =>
      useCopyToClipboard({ clearDelayMs: null }),
    );
    const [, handleCopy] = result.current;

    act(() => {
      handleCopy('test');
    });
    expect(result.current[0]).toBe(false);
  });
});
