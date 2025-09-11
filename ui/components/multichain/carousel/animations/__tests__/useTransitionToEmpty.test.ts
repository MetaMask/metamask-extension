import { act } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import { useTransitionToEmpty } from '../useTransitionToEmpty';
import { ANIMATION_TIMINGS } from '../animationTimings';

describe('useTransitionToEmpty', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const mockProps = {
    onEmptyStateComplete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Empty State Sequence', () => {
    it('starts with hidden phase', () => {
      const { result } = renderHook(() => useTransitionToEmpty(mockProps));

      expect(result.current.emptyStatePhase).toBe('hidden');
      expect(result.current.isEmptyStateVisible).toBe(false);
      expect(result.current.isEmptyStateFolding).toBe(false);
    });

    it('transitions to showing phase when sequence starts', () => {
      const { result } = renderHook(() => useTransitionToEmpty(mockProps));

      act(() => {
        result.current.startEmptyStateSequence();
      });

      expect(result.current.emptyStatePhase).toBe('showing');
      expect(result.current.isEmptyStateVisible).toBe(true);
      expect(result.current.isEmptyStateFolding).toBe(false);
    });

    it('auto-transitions to folding phase after stabilization', () => {
      const { result } = renderHook(() => useTransitionToEmpty(mockProps));

      act(() => {
        result.current.startEmptyStateSequence();
      });

      // Advance stabilization timer
      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(result.current.emptyStatePhase).toBe('folding');
      expect(result.current.isEmptyStateVisible).toBe(true);
      expect(result.current.isEmptyStateFolding).toBe(true);
    });

    it('completes sequence and calls onComplete after fold duration', () => {
      const onCompleteMock = jest.fn();
      const { result } = renderHook(() =>
        useTransitionToEmpty({ onEmptyStateComplete: onCompleteMock }),
      );

      act(() => {
        result.current.startEmptyStateSequence();
      });

      // Advance through stabilization
      act(() => {
        jest.advanceTimersByTime(100);
      });

      // Advance through fold animation
      act(() => {
        jest.advanceTimersByTime(ANIMATION_TIMINGS.EMPTY_STATE_DURATION);
      });

      expect(onCompleteMock).toHaveBeenCalled();
      expect(result.current.emptyStatePhase).toBe('complete');
    });
  });

  describe('Manual Triggers', () => {
    it('can manually trigger fold animation', () => {
      const { result } = renderHook(() => useTransitionToEmpty(mockProps));

      act(() => {
        result.current.triggerFoldAnimation();
      });

      expect(result.current.emptyStatePhase).toBe('folding');
      expect(result.current.isEmptyStateFolding).toBe(true);
    });

    it('can reset empty state', () => {
      const { result } = renderHook(() => useTransitionToEmpty(mockProps));

      // Start sequence
      act(() => {
        result.current.startEmptyStateSequence();
      });

      expect(result.current.emptyStatePhase).toBe('showing');

      // Reset
      act(() => {
        result.current.resetEmptyState();
      });

      expect(result.current.emptyStatePhase).toBe('hidden');
    });
  });

  describe('State Transitions', () => {
    it('follows correct state sequence: hidden → showing → folding → complete', () => {
      const onCompleteMock = jest.fn();
      const { result } = renderHook(() =>
        useTransitionToEmpty({ onEmptyStateComplete: onCompleteMock }),
      );

      // Initial state
      expect(result.current.emptyStatePhase).toBe('hidden');

      // Start sequence
      act(() => {
        result.current.startEmptyStateSequence();
      });
      expect(result.current.emptyStatePhase).toBe('showing');

      // Stabilization timer
      act(() => {
        jest.advanceTimersByTime(100);
      });
      expect(result.current.emptyStatePhase).toBe('folding');

      // Fold animation timer
      act(() => {
        jest.advanceTimersByTime(ANIMATION_TIMINGS.EMPTY_STATE_DURATION);
      });
      expect(result.current.emptyStatePhase).toBe('complete');
      expect(onCompleteMock).toHaveBeenCalled();
    });
  });

  describe('Callback Dependencies', () => {
    it('updates callbacks when onEmptyStateComplete changes', () => {
      const { result, rerender } = renderHook(
        (props: typeof mockProps) => useTransitionToEmpty(props),
        { initialProps: mockProps },
      );

      const firstCallback = result.current.triggerFoldAnimation;

      rerender({ onEmptyStateComplete: jest.fn() });

      const secondCallback = result.current.triggerFoldAnimation;

      expect(firstCallback).not.toBe(secondCallback);
    });
  });

  describe('Timer Cleanup', () => {
    it('clears stabilization timer on phase change', () => {
      const { result } = renderHook(() => useTransitionToEmpty(mockProps));

      act(() => {
        result.current.startEmptyStateSequence();
      });

      // Manually trigger fold (should clear stabilization timer)
      act(() => {
        result.current.triggerFoldAnimation();
      });

      // Original stabilization timer should not fire
      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(result.current.emptyStatePhase).toBe('folding'); // Should not change
    });
  });
});
