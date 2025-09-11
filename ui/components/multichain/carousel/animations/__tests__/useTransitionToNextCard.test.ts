import { act } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import { useTransitionToNextCard } from '../useTransitionToNextCard';
import { ANIMATION_TIMINGS } from '../animationTimings';

describe('useTransitionToNextCard', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const mockProps = {
    onSlideRemove: jest.fn(),
    isTransitioning: false,
    setIsTransitioning: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Transition Management', () => {
    it('returns transition function and state', () => {
      const { result } = renderHook(() => useTransitionToNextCard(mockProps));

      expect(result.current.transitionToNextCard).toBeInstanceOf(Function);
      expect(result.current.isTransitioning).toBe(false);
    });

    it('sets isTransitioning to true when transition starts', () => {
      const setIsTransitioningMock = jest.fn();
      const { result } = renderHook(() =>
        useTransitionToNextCard({
          ...mockProps,
          setIsTransitioning: setIsTransitioningMock,
        }),
      );

      act(() => {
        result.current.transitionToNextCard('test-slide', false);
      });

      expect(setIsTransitioningMock).toHaveBeenCalledWith(true);
    });

    it('calls onSlideRemove with correct parameters', () => {
      const onSlideRemoveMock = jest.fn();
      const { result } = renderHook(() =>
        useTransitionToNextCard({
          ...mockProps,
          onSlideRemove: onSlideRemoveMock,
        }),
      );

      act(() => {
        result.current.transitionToNextCard('test-slide-id', true);
      });

      expect(onSlideRemoveMock).toHaveBeenCalledWith('test-slide-id', true);
    });

    it('resets isTransitioning after animation duration', () => {
      const setIsTransitioningMock = jest.fn();
      const { result } = renderHook(() =>
        useTransitionToNextCard({
          ...mockProps,
          setIsTransitioning: setIsTransitioningMock,
        }),
      );

      act(() => {
        result.current.transitionToNextCard('test-slide', false);
      });

      // Reset call should not have happened yet
      expect(setIsTransitioningMock).toHaveBeenCalledTimes(1);
      expect(setIsTransitioningMock).toHaveBeenCalledWith(true);

      // Advance time to complete animation
      act(() => {
        jest.advanceTimersByTime(ANIMATION_TIMINGS.CARD_EXIT_DURATION + 50);
      });

      expect(setIsTransitioningMock).toHaveBeenCalledTimes(2);
      expect(setIsTransitioningMock).toHaveBeenLastCalledWith(false);
    });
  });

  describe('Transition Prevention', () => {
    it('ignores new transitions when already transitioning', () => {
      const onSlideRemoveMock = jest.fn();
      const { result } = renderHook(() =>
        useTransitionToNextCard({
          ...mockProps,
          isTransitioning: true, // Already transitioning
          onSlideRemove: onSlideRemoveMock,
        }),
      );

      act(() => {
        result.current.transitionToNextCard('test-slide', false);
      });

      // Should not call onSlideRemove when already transitioning
      expect(onSlideRemoveMock).not.toHaveBeenCalled();
    });
  });

  describe('Callback Dependencies', () => {
    it('updates callback when dependencies change', () => {
      const { result, rerender } = renderHook(
        (props: typeof mockProps) => useTransitionToNextCard(props),
        { initialProps: mockProps },
      );

      const firstCallback = result.current.transitionToNextCard;

      // Update props
      rerender({
        ...mockProps,
        onSlideRemove: jest.fn(),
      });

      const secondCallback = result.current.transitionToNextCard;

      // Callback should be different due to dependency change
      expect(firstCallback).not.toBe(secondCallback);
    });

    it('maintains stable callback when dependencies do not change', () => {
      const { result, rerender } = renderHook(
        (props: typeof mockProps) => useTransitionToNextCard(props),
        { initialProps: mockProps },
      );

      const firstCallback = result.current.transitionToNextCard;

      // Re-render with same props
      rerender(mockProps);

      const secondCallback = result.current.transitionToNextCard;

      // Callback should be the same
      expect(firstCallback).toBe(secondCallback);
    });
  });

  describe('Timing Consistency', () => {
    it('uses consistent timing from constants', () => {
      const setIsTransitioningMock = jest.fn();
      const { result } = renderHook(() =>
        useTransitionToNextCard({
          ...mockProps,
          setIsTransitioning: setIsTransitioningMock,
        }),
      );

      act(() => {
        result.current.transitionToNextCard('test-slide', false);
      });

      // Should not complete before the expected time
      act(() => {
        jest.advanceTimersByTime(ANIMATION_TIMINGS.CARD_EXIT_DURATION);
      });

      expect(setIsTransitioningMock).toHaveBeenCalledWith(true);
      expect(setIsTransitioningMock).not.toHaveBeenCalledWith(false);

      // Should complete after buffer time
      act(() => {
        jest.advanceTimersByTime(50);
      });

      expect(setIsTransitioningMock).toHaveBeenCalledWith(false);
    });
  });
});
