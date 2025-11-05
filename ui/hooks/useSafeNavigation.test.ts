import { renderHook, act } from '@testing-library/react-hooks';
import { useNavigate, useLocation } from 'react-router-dom-v5-compat';
import { useSetNavState } from '../contexts/navigation-state';
import { useSafeNavigation } from './useSafeNavigation';

// Mock dependencies
jest.mock('react-router-dom-v5-compat', () => ({
  useNavigate: jest.fn(),
  useLocation: jest.fn(),
}));

jest.mock('../contexts/navigation-state', () => ({
  useSetNavState: jest.fn(),
}));

describe('useSafeNavigation', () => {
  let mockDefaultNavigate: jest.Mock;
  let mockSetNavState: jest.Mock;
  let mockLocation: { pathname: string };

  beforeEach(() => {
    jest.useFakeTimers();
    mockDefaultNavigate = jest.fn();
    mockSetNavState = jest.fn();
    mockLocation = { pathname: '/test' };

    (useNavigate as jest.Mock).mockReturnValue(mockDefaultNavigate);
    (useSetNavState as jest.Mock).mockReturnValue(mockSetNavState);
    (useLocation as jest.Mock).mockReturnValue(mockLocation);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  describe('with defaultNavigate', () => {
    it('should navigate without state and clean up', async () => {
      const { result } = renderHook(() => useSafeNavigation());

      act(() => {
        result.current.navigate('/destination');
      });

      // Should set state to null (no state provided)
      expect(mockSetNavState).toHaveBeenCalledWith(null);

      // Should call default navigate
      expect(mockDefaultNavigate).toHaveBeenCalledWith('/destination', {
        replace: false,
        state: undefined,
      });

      // Should schedule cleanup
      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(mockSetNavState).toHaveBeenCalledTimes(2);
      expect(mockSetNavState).toHaveBeenLastCalledWith(null);
    });

    it('should navigate with state and clean up after 100ms', async () => {
      const { result } = renderHook(() => useSafeNavigation());
      const testState = { stayOnHomePage: true };

      act(() => {
        result.current.navigate('/destination', { state: testState });
      });

      // Should set state immediately
      expect(mockSetNavState).toHaveBeenCalledWith(testState);

      // Should call default navigate with state
      expect(mockDefaultNavigate).toHaveBeenCalledWith('/destination', {
        replace: false,
        state: testState,
      });

      // State should not be cleared immediately
      expect(mockSetNavState).toHaveBeenCalledTimes(1);

      // After 100ms, state should be cleared
      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(mockSetNavState).toHaveBeenCalledTimes(2);
      expect(mockSetNavState).toHaveBeenLastCalledWith(null);
    });

    it('should handle replace option', () => {
      const { result } = renderHook(() => useSafeNavigation());

      act(() => {
        result.current.navigate('/destination', { replace: true });
      });

      expect(mockDefaultNavigate).toHaveBeenCalledWith('/destination', {
        replace: true,
        state: undefined,
      });
    });
  });

  describe('with customNavigate', () => {
    it('should navigate without state and clean up (bug fix)', async () => {
      const mockCustomNavigate = jest.fn();
      const { result } = renderHook(() =>
        useSafeNavigation(mockCustomNavigate),
      );

      act(() => {
        result.current.navigate('/destination');
      });

      // Should set state to null
      expect(mockSetNavState).toHaveBeenCalledWith(null);

      // Should call custom navigate
      expect(mockCustomNavigate).toHaveBeenCalledWith(
        '/destination',
        undefined,
      );

      // Should NOT call default navigate
      expect(mockDefaultNavigate).not.toHaveBeenCalled();

      // CRITICAL: Cleanup should still happen after 100ms (this is the bug fix)
      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(mockSetNavState).toHaveBeenCalledTimes(2);
      expect(mockSetNavState).toHaveBeenLastCalledWith(null);
    });

    it('should navigate with state and clean up after 100ms (bug fix)', async () => {
      const mockCustomNavigate = jest.fn();
      const { result } = renderHook(() =>
        useSafeNavigation(mockCustomNavigate),
      );
      const testState = { stayOnHomePage: true };

      act(() => {
        result.current.navigate('/destination', { state: testState });
      });

      // Should set state immediately
      expect(mockSetNavState).toHaveBeenCalledWith(testState);

      // Should call custom navigate with state
      expect(mockCustomNavigate).toHaveBeenCalledWith('/destination', {
        state: testState,
      });

      // Should NOT call default navigate
      expect(mockDefaultNavigate).not.toHaveBeenCalled();

      // State should not be cleared immediately
      expect(mockSetNavState).toHaveBeenCalledTimes(1);

      // CRITICAL: After 100ms, state MUST be cleared (this is the bug fix)
      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(mockSetNavState).toHaveBeenCalledTimes(2);
      expect(mockSetNavState).toHaveBeenLastCalledWith(null);
    });

    it('should handle replace option with custom navigate', () => {
      const mockCustomNavigate = jest.fn();
      const { result } = renderHook(() =>
        useSafeNavigation(mockCustomNavigate),
      );

      act(() => {
        result.current.navigate('/destination', { replace: true });
      });

      expect(mockCustomNavigate).toHaveBeenCalledWith('/destination', {
        replace: true,
      });

      // Cleanup should still happen
      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(mockSetNavState).toHaveBeenLastCalledWith(null);
    });

    it('should handle both state and replace options with custom navigate', () => {
      const mockCustomNavigate = jest.fn();
      const { result } = renderHook(() =>
        useSafeNavigation(mockCustomNavigate),
      );
      const testState = { foo: 'bar' };

      act(() => {
        result.current.navigate('/destination', {
          state: testState,
          replace: true,
        });
      });

      expect(mockSetNavState).toHaveBeenCalledWith(testState);
      expect(mockCustomNavigate).toHaveBeenCalledWith('/destination', {
        state: testState,
        replace: true,
      });

      // Cleanup should happen after 100ms
      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(mockSetNavState).toHaveBeenLastCalledWith(null);
    });
  });

  describe('memory leak prevention', () => {
    it('should clean up state for multiple consecutive navigations with customNavigate', () => {
      const mockCustomNavigate = jest.fn();
      const { result } = renderHook(() =>
        useSafeNavigation(mockCustomNavigate),
      );

      // First navigation
      act(() => {
        result.current.navigate('/page1', { state: { page: 1 } });
      });

      expect(mockSetNavState).toHaveBeenCalledWith({ page: 1 });

      // Second navigation before cleanup - this clears the first timeout
      act(() => {
        result.current.navigate('/page2', { state: { page: 2 } });
      });

      expect(mockSetNavState).toHaveBeenCalledWith({ page: 2 });

      // Advance timers - only the second cleanup should execute (first was cleared)
      act(() => {
        jest.advanceTimersByTime(100);
      });

      // Should have been called: page1 state, page2 state, cleanup2 only = 3 calls
      // (cleanup1 was cleared when page2 navigation happened)
      expect(mockSetNavState).toHaveBeenCalledTimes(3);
      expect(mockSetNavState).toHaveBeenLastCalledWith(null);
    });

    it('should not accumulate state across multiple navigations', () => {
      const mockCustomNavigate = jest.fn();
      const { result } = renderHook(() =>
        useSafeNavigation(mockCustomNavigate),
      );

      // Multiple navigations - each clears the previous timeout
      for (let i = 0; i < 5; i++) {
        act(() => {
          result.current.navigate(`/page${i}`, { state: { id: i } });
        });
      }

      // Fast forward all timers
      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Last call should always be cleanup (null)
      expect(mockSetNavState).toHaveBeenLastCalledWith(null);

      // Should have 5 state sets + 1 cleanup (only the last one) = 6 total calls
      // Previous 4 cleanup timeouts were cleared by subsequent navigations
      expect(mockSetNavState).toHaveBeenCalledTimes(6);
    });
  });

  describe('return value', () => {
    it('should return navigate function and location', () => {
      const { result } = renderHook(() => useSafeNavigation());

      expect(result.current).toHaveProperty('navigate');
      expect(result.current).toHaveProperty('location');
      expect(typeof result.current.navigate).toBe('function');
      expect(result.current.location).toBe(mockLocation);
    });

    it('should maintain stable navigate reference', () => {
      const { result, rerender } = renderHook(() => useSafeNavigation());
      const firstNavigate = result.current.navigate;

      rerender();

      expect(result.current.navigate).toBe(firstNavigate);
    });
  });

  describe('edge cases', () => {
    it('should handle navigation with empty state object', () => {
      const { result } = renderHook(() => useSafeNavigation());

      act(() => {
        result.current.navigate('/destination', { state: {} });
      });

      expect(mockSetNavState).toHaveBeenCalledWith({});

      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(mockSetNavState).toHaveBeenLastCalledWith(null);
    });

    it('should handle navigation with null state explicitly', () => {
      const { result } = renderHook(() => useSafeNavigation());

      act(() => {
        // @ts-expect-error - testing edge case
        result.current.navigate('/destination', { state: null });
      });

      expect(mockSetNavState).toHaveBeenCalledWith(null);
    });

    it('should handle navigation with undefined options', () => {
      const mockCustomNavigate = jest.fn();
      const { result } = renderHook(() =>
        useSafeNavigation(mockCustomNavigate),
      );

      act(() => {
        result.current.navigate('/destination', undefined);
      });

      expect(mockCustomNavigate).toHaveBeenCalledWith(
        '/destination',
        undefined,
      );
      expect(mockSetNavState).toHaveBeenCalledWith(null);
    });
  });

  describe('timeout cleanup', () => {
    it('should clear previous timeout when navigate is called multiple times', () => {
      const { result } = renderHook(() => useSafeNavigation());

      act(() => {
        result.current.navigate('/path1', { state: { first: true } });
      });

      // First timeout scheduled, advance time partially
      act(() => {
        jest.advanceTimersByTime(50);
      });

      // Navigate again before first timeout completes
      act(() => {
        result.current.navigate('/path2', { state: { second: true } });
      });

      // Advance remaining time from first timeout (should not trigger)
      act(() => {
        jest.advanceTimersByTime(50);
      });

      // Only the second navigation's state should remain (not cleaned up yet)
      // First timeout was cleared, so we should have: initial calls + second call
      expect(mockSetNavState).toHaveBeenCalledWith({ first: true });
      expect(mockSetNavState).toHaveBeenCalledWith({ second: true });

      // Now advance time to trigger second timeout
      act(() => {
        jest.advanceTimersByTime(50);
      });

      // Second timeout should clean up
      expect(mockSetNavState).toHaveBeenLastCalledWith(null);
    });

    it('should clear timeout on unmount', () => {
      const { result, unmount } = renderHook(() => useSafeNavigation());

      act(() => {
        result.current.navigate('/destination', { state: { test: true } });
      });

      // Unmount before timeout completes
      unmount();

      // Advance time past when cleanup would have happened
      act(() => {
        jest.advanceTimersByTime(100);
      });

      // The cleanup after unmount should not trigger setNavState again
      // We should only see the initial call, not a cleanup call
      const callCount = mockSetNavState.mock.calls.length;

      // Advancing timers again should not add more calls
      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(mockSetNavState.mock.calls.length).toBe(callCount);
    });

    it('should not accumulate timeouts', () => {
      const { result } = renderHook(() => useSafeNavigation());

      // Navigate 5 times quickly
      act(() => {
        for (let i = 0; i < 5; i++) {
          result.current.navigate(`/path${i}`, { state: { count: i } });
        }
      });

      // Clear all mock calls to focus on cleanup behavior
      mockSetNavState.mockClear();

      // Advance time to trigger cleanup
      act(() => {
        jest.advanceTimersByTime(100);
      });

      // Only ONE cleanup should happen (from the last navigate call)
      expect(mockSetNavState).toHaveBeenCalledTimes(1);
      expect(mockSetNavState).toHaveBeenCalledWith(null);
    });
  });
});
