import { configureStore } from '@reduxjs/toolkit';
import { act } from '@testing-library/react-hooks';
import counterReducer, {
  increment,
  setError,
  setCounter,
  selectCounterState,
  selectCounterValue,
  selectCounterError,
  useCounter,
  SampleState,
} from './counter';
import { renderHookWithProvider } from '../../../test/lib/render-helpers';

// Create a test store for Redux tests
const createTestStore = (preloadedState?: { sample: SampleState }) => {
  return configureStore({
    reducer: {
      sample: counterReducer,
    },
    preloadedState,
  });
};

describe('counter duck', () => {
  describe('reducer', () => {
    it('should return the initial state', () => {
      const initialState = { counter: 0, error: null };
      const nextState = counterReducer(undefined, { type: 'unknown' });
      expect(nextState).toEqual(initialState);
    });

    it('should handle increment', () => {
      const initialState = { counter: 0, error: null };
      const nextState = counterReducer(initialState, increment());
      expect(nextState.counter).toEqual(1);
      expect(nextState.error).toBeNull();
    });

    it('should handle increment from non-zero starting value', () => {
      const initialState = { counter: 5, error: null };
      const nextState = counterReducer(initialState, increment());
      expect(nextState.counter).toEqual(6);
    });

    it('should handle setError', () => {
      const initialState = { counter: 0, error: null };
      const errorMessage = 'Test error message';
      const nextState = counterReducer(initialState, setError(errorMessage));
      expect(nextState.error).toEqual(errorMessage);
      expect(nextState.counter).toEqual(initialState.counter);
    });
  });

  describe('actions', () => {
    it('should create an increment action', () => {
      const action = increment();
      expect(action.type).toEqual('sample/increment');
    });

    it('should create a setError action', () => {
      const errorMessage = 'Test error message';
      const action = setError(errorMessage);
      expect(action.type).toEqual('sample/setError');
      expect(action.payload).toEqual(errorMessage);
    });
  });

  describe('thunks', () => {
    it('should set counter when value is valid', () => {
      const store = createTestStore();
      const validAmount = 10;

      store.dispatch(setCounter(validAmount));

      expect(store.getState().sample.counter).toEqual(validAmount);
      expect(store.getState().sample.error).toBeNull();
    });

    it('should dispatch error when amount is negative', () => {
      const store = createTestStore();
      const invalidAmount = -5;

      store.dispatch(setCounter(invalidAmount));

      expect(store.getState().sample.counter).toEqual(0); // Remains unchanged
      expect(store.getState().sample.error).toEqual(
        'Counter cannot be negative.',
      );
    });
  });

  describe('selectors', () => {
    const sampleState = {
      counter: 42,
      error: 'test error',
    };

    const mockState = {
      sample: sampleState,
    };

    it('should select counter state', () => {
      expect(selectCounterState(mockState)).toEqual(sampleState);
    });

    it('should select counter value', () => {
      expect(selectCounterValue(mockState)).toEqual(42);
    });

    it('should select counter error', () => {
      expect(selectCounterError(mockState)).toEqual('test error');
    });
  });

  describe('useCounter hook', () => {
    it('should return the counter value', () => {
      const { result } = renderHookWithProvider(useCounter, {
        sample: { counter: 5, error: null },
      });

      expect(result.current.value).toBe(5);
    });

    it('should return error', () => {
      const { result } = renderHookWithProvider(useCounter, {
        sample: { counter: 0, error: 'test error' },
      });

      expect(result.current.error).toBe('test error');
    });

    it('should increment counter when increment is called', () => {
      const { result } = renderHookWithProvider(useCounter, {
        sample: { counter: 0, error: null },
      });

      act(() => {
        result.current.increment();
      });

      // Check if the value updated in the hook's return value
      expect(result.current.value).toBe(1);
    });

    it('should set counter when setCounter is called with valid value', () => {
      const { result } = renderHookWithProvider(useCounter, {
        sample: { counter: 0, error: null },
      });

      act(() => {
        result.current.setCounter(10);
      });

      // Check if the value updated in the hook's return value
      expect(result.current.value).toBe(10);
    });

    it('should set error when setCounter is called with negative value', () => {
      const { result } = renderHookWithProvider(useCounter, {
        sample: { counter: 0, error: null },
      });

      act(() => {
        result.current.setCounter(-5);
      });

      // Check the error in the hook's return value
      expect(result.current.error).toBe('Counter cannot be negative.');
      // Counter should remain unchanged
      expect(result.current.value).toBe(0);
    });
  });
});
