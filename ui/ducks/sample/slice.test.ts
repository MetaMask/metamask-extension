import { configureStore } from '@reduxjs/toolkit';
import reducer, {
  increment,
  setError,
  setCounter,
  selectCounterState,
  selectCounterValue,
  selectCounterError,
  INITIAL_STATE,
  SampleState,
} from './slice';

// Create a test store for Redux tests
const createTestStore = (preloadedState?: { sample: SampleState }) => {
  return configureStore({
    reducer: {
      sample: reducer,
    },
    preloadedState,
  });
};

describe('sample', () => {
  // REDUCER TESTS
  describe('reducer', () => {
    it('should return the initial state', () => {
      const nextState = reducer(undefined, { type: 'unknown' });
      expect(nextState).toEqual(INITIAL_STATE);
    });

    it('should handle increment', () => {
      const initialState = { counter: 0, error: null };
      const nextState = reducer(initialState, increment());
      expect(nextState.counter).toEqual(1);
      expect(nextState.error).toBeNull();
    });

    it('should handle increment from non-zero starting value', () => {
      const initialState = { counter: 5, error: null };
      const nextState = reducer(initialState, increment());
      expect(nextState.counter).toEqual(6);
    });

    it('should handle setError', () => {
      const initialState = { counter: 0, error: null };
      const errorMessage = 'Test error message';
      const nextState = reducer(initialState, setError(errorMessage));
      expect(nextState.error).toEqual(errorMessage);
      expect(nextState.counter).toEqual(initialState.counter);
    });
  });

  // ACTION TESTS
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

  // SELECTOR TESTS
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

  // THUNK TESTS
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
});
