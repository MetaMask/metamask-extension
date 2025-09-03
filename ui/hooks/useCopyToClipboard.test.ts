import { act } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import copyToClipboard from 'copy-to-clipboard';
import { COPY_OPTIONS } from '../../shared/constants/copy';
import { useCopyToClipboard } from './useCopyToClipboard';

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

  it('copies text and expires after timeout', () => {
    const delay = 1000;
    const { result } = renderHook(() => useCopyToClipboard(delay));
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
      jest.advanceTimersByTime(delay + 1);
    });
    expect(mockCopyToClipboard).toHaveBeenCalledTimes(2);
    expect(mockCopyToClipboard).toHaveBeenNthCalledWith(2, ' ', COPY_OPTIONS);
    expect(result.current[0]).toBe(false);
  });

  it('copies text and does not expire after timeout', () => {
    const delay = 1000;
    const { result } = renderHook(() =>
      useCopyToClipboard(delay, { expireClipboard: false }),
    );
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
      jest.advanceTimersByTime(delay + 1);
    });
    expect(mockCopyToClipboard).toHaveBeenCalledTimes(1); // it was not called a second time
    expect(result.current[0]).toBe(false);
  });

  it('resets copied state when invoked', () => {
    const delay = 1000;
    const { result } = renderHook(() => useCopyToClipboard(delay));
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
      jest.advanceTimersByTime(delay + 1);
    });
    expect(mockCopyToClipboard).toHaveBeenCalledTimes(1); // it was not called a second time
    expect(result.current[0]).toBe(false);
  });
});
