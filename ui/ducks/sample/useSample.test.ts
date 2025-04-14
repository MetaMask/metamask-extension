import { act } from '@testing-library/react-hooks';
import { renderHookWithProvider } from '../../../test/lib/render-helpers';
import { useSample } from './useSample';

// Import SampleState type from slice
import { SampleState } from './slice';

describe('useSample hook', () => {
  const setupHook = (
    initialState: SampleState = { counter: 0, error: null },
  ) => {
    return renderHookWithProvider(useSample, {
      sample: initialState,
    });
  };

  describe('initial state', () => {
    it('should return the counter value from state', () => {
      const { result } = setupHook({ counter: 5, error: null });
      expect(result.current.value).toBe(5);
    });

    it('should return error from state', () => {
      const { result } = setupHook({ counter: 0, error: 'test error' });
      expect(result.current.error).toBe('test error');
    });
  });

  describe('actions', () => {
    it('should increment counter when increment is called', () => {
      const { result } = setupHook();

      act(() => {
        result.current.increment();
      });

      expect(result.current.value).toBe(1);
      expect(result.current.error).toBeNull();
    });

    describe('setCounter', () => {
      it('should set counter when called with valid positive value', () => {
        const { result } = setupHook();

        act(() => {
          result.current.setCounter(10);
        });

        expect(result.current.value).toBe(10);
        expect(result.current.error).toBeNull();
      });

      it('should set counter when called with zero', () => {
        const { result } = setupHook({ counter: 5, error: null });

        act(() => {
          result.current.setCounter(0);
        });

        expect(result.current.value).toBe(0);
        expect(result.current.error).toBeNull();
      });

      it('should set error when called with negative value', () => {
        const { result } = setupHook();

        act(() => {
          result.current.setCounter(-5);
        });

        expect(result.current.error).toBe('Counter cannot be negative.');
        expect(result.current.value).toBe(0); // Counter should remain unchanged
      });
    });
  });
});
