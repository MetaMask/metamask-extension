import { act } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import copyToClipboard from 'copy-to-clipboard';
import { COPY_OPTIONS } from '../../shared/constants/copy';
import { DEFAULT_UI_DELAY, useCopyToClipboard } from './useCopyToClipboard';

// Mock dependencies
jest.mock('copy-to-clipboard');
const mockCopyToClipboard = jest.mocked(copyToClipboard);

describe('useCopyToClipboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('copies text and expires if clearDelay = 1000', () => {
    const clearDelay = 1000;
    const { result } = renderHook(() => useCopyToClipboard(clearDelay));
    const [, handleCopy] = result.current;

    // Act/Assert - Copy
    act(() => handleCopy('test'));
    expect(mockCopyToClipboard).toHaveBeenNthCalledWith(
      1,
      'test',
      COPY_OPTIONS,
    );
    expect(result.current[0]).toBe(true);

    // Act/Assert - Expiry (clipboard is cleared)
    act(() => {
      jest.advanceTimersByTime(clearDelay + 1);
    });
    expect(mockCopyToClipboard).toHaveBeenCalledTimes(2);
    expect(mockCopyToClipboard).toHaveBeenNthCalledWith(2, ' ', COPY_OPTIONS);
    expect(result.current[0]).toBe(false);
  });

  it('copies text and does not expire if clearDelay = -1', () => {
    const { result } = renderHook(() => useCopyToClipboard(-1));
    const [, handleCopy] = result.current;

    // Act/Assert - Copy
    act(() => handleCopy('test'));
    expect(mockCopyToClipboard).toHaveBeenNthCalledWith(
      1,
      'test',
      COPY_OPTIONS,
    );
    expect(result.current[0]).toBe(true);

    // Act/Assert - Expiry (clipboard is not cleared)
    act(() => {
      jest.advanceTimersByTime(DEFAULT_UI_DELAY + 1);
    });
    expect(mockCopyToClipboard).toHaveBeenCalledTimes(1); // it was not called a second time
    expect(result.current[0]).toBe(false);
  });

  it('resets copied state when invoked', () => {
    const clearDelay = 1000;
    const { result } = renderHook(() => useCopyToClipboard(clearDelay));
    const [, handleCopy, resetCopyState] = result.current;

    // Act/Assert - Copy
    act(() => handleCopy('test'));
    expect(mockCopyToClipboard).toHaveBeenNthCalledWith(
      1,
      'test',
      COPY_OPTIONS,
    );
    expect(result.current[0]).toBe(true);

    // Act/Assert - Copy State Reset
    act(() => resetCopyState());
    expect(result.current[0]).toBe(false);

    // Act/Assert - No Expiry (as the copy state was reset)
    act(() => {
      jest.advanceTimersByTime(clearDelay + 1);
    });
    expect(mockCopyToClipboard).toHaveBeenCalledTimes(1); // it was not called a second time
    expect(result.current[0]).toBe(false);
  });
});
