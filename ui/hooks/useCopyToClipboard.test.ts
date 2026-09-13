import { renderHook, act } from '@testing-library/react';
import { DEFAULT_UI_DELAY, useCopyToClipboard } from './useCopyToClipboard';

describe('useCopyToClipboard', () => {
  const mockCopyToClipboard = globalThis.navigator.clipboard
    .writeText as unknown as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCopyToClipboard.mockResolvedValue(undefined);
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('copies text and resets copy feedback after the default delay', async () => {
    const { result } = renderHook(() => useCopyToClipboard());
    const [, handleCopy] = result.current;

    // Act/Assert - Copy
    const copyResult = handleCopy('test');
    let copied: boolean | undefined;
    await act(async () => {
      copied = await copyResult;
    });
    expect(mockCopyToClipboard).toHaveBeenNthCalledWith(1, 'test');
    expect(copied).toBe(true);
    expect(result.current[0]).toBe(true);

    // Act/Assert - Expiry only resets the UI state.
    act(() => {
      jest.advanceTimersByTime(DEFAULT_UI_DELAY + 1);
    });
    expect(mockCopyToClipboard).toHaveBeenCalledTimes(1);
    expect(result.current[0]).toBe(false);
  });

  it('returns false when copying text fails', async () => {
    mockCopyToClipboard.mockRejectedValueOnce(new Error('Clipboard denied'));
    const { result } = renderHook(() => useCopyToClipboard());
    const [, handleCopy] = result.current;

    const copyResult = handleCopy('test');
    let copied: boolean | undefined;
    await act(async () => {
      copied = await copyResult;
    });
    expect(mockCopyToClipboard).toHaveBeenNthCalledWith(1, 'test');
    expect(copied).toBe(false);
    expect(result.current[0]).toBe(false);
  });

  it('clears sensitive text only when requested', async () => {
    const { result } = renderHook(() =>
      useCopyToClipboard({ sensitive: true }),
    );
    const [, handleCopy, , sensitiveClipboard] = result.current;

    await act(async () => {
      await handleCopy('secret');
    });
    expect(mockCopyToClipboard).toHaveBeenCalledTimes(1);
    expect(sensitiveClipboard.state).toBe('idle');
    expect(result.current[3].state).toBe('ready');

    let cleared: boolean | undefined;
    await act(async () => {
      cleared = await result.current[3].clear();
    });
    expect(mockCopyToClipboard).toHaveBeenNthCalledWith(2, '');
    expect(cleared).toBe(true);
    expect(result.current[3].state).toBe('cleared');
  });

  it('reports a failed sensitive clipboard clear', async () => {
    const { result } = renderHook(() =>
      useCopyToClipboard({ sensitive: true }),
    );
    mockCopyToClipboard.mockRejectedValueOnce(new Error('Clipboard denied'));

    let cleared: boolean | undefined;
    await act(async () => {
      cleared = await result.current[3].clear();
    });

    expect(mockCopyToClipboard).toHaveBeenCalledWith('');
    expect(cleared).toBe(false);
    expect(result.current[3].state).toBe('error');
  });

  it('resets copied state when invoked', async () => {
    const { result } = renderHook(() => useCopyToClipboard());
    const [, handleCopy, resetCopyState] = result.current;

    // Act/Assert - Copy
    const copyResult = handleCopy('test');
    await act(async () => {
      await copyResult;
    });
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
