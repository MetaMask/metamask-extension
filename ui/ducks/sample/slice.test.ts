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

// --- Test Helpers ---

/**
 * Creates a test store with optional preloaded state
 *
 * @param preloadedState
 * @param preloadedState.sample
 */
const createTestStore = (preloadedState?: { sample: SampleState }) => {
  return configureStore({
    reducer: {
      sample: reducer,
    },
    preloadedState,
  });
};

/**
 * Creates a sample state with default or custom values
 *
 * @param overrides
 */
const createSampleState = (overrides?: Partial<SampleState>): SampleState => ({
  counter: 0,
  error: null,
  ...overrides,
});

/**
 * Creates a root state with sample state
 *
 * @param sampleState
 */
const createRootState = (sampleState?: Partial<SampleState>) => ({
  sample: createSampleState(sampleState),
});

describe('sample slice', () => {
  // REDUCER TESTS
  describe('reducer', () => {
    it('should return the initial state', () => {
      const nextState = reducer(undefined, { type: 'unknown' });
      expect(nextState).toEqual(INITIAL_STATE);
    });

    it('should handle increment from zero', () => {
      const initialState = createSampleState();
      const nextState = reducer(initialState, increment());
      expect(nextState.counter).toEqual(1);
      expect(nextState.error).toBeNull();
    });

    it('should handle increment from non-zero starting value', () => {
      const initialState = createSampleState({ counter: 5 });
      const nextState = reducer(initialState, increment());
      expect(nextState.counter).toEqual(6);
      expect(nextState.error).toBeNull();
    });

    it('should handle setError', () => {
      const initialState = createSampleState();
      const errorMessage = 'Test error message';
      const nextState = reducer(initialState, setError(errorMessage));
      expect(nextState.error).toEqual(errorMessage);
      expect(nextState.counter).toEqual(initialState.counter);
    });

    it('should clear error when incrementing', () => {
      const initialState = createSampleState({ error: 'Previous error' });
      const nextState = reducer(initialState, increment());
      expect(nextState.error).toBeNull();
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
    it('should select counter state', () => {
      const mockState = createRootState({ counter: 42, error: 'test error' });
      expect(selectCounterState(mockState)).toEqual(mockState.sample);
    });

    it('should select counter value', () => {
      const mockState = createRootState({ counter: 42 });
      expect(selectCounterValue(mockState)).toEqual(42);
    });

    it('should select counter error', () => {
      const mockState = createRootState({ error: 'test error' });
      expect(selectCounterError(mockState)).toEqual('test error');
    });

    it('should select null error when no error exists', () => {
      const mockState = createRootState();
      expect(selectCounterError(mockState)).toBeNull();
    });
  });

  // THUNK TESTS
  describe('thunks', () => {
    describe('setCounter', () => {
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

      it('should set counter to zero', () => {
        const store = createTestStore(createRootState({ counter: 10 }));

        store.dispatch(setCounter(0));

        expect(store.getState().sample.counter).toEqual(0);
        expect(store.getState().sample.error).toBeNull();
      });

      it('should clear previous errors when setting valid counter', () => {
        const store = createTestStore(
          createRootState({ error: 'Previous error' }),
        );

        store.dispatch(setCounter(10));

        expect(store.getState().sample.counter).toEqual(10);
        expect(store.getState().sample.error).toBeNull();
      });
    });
  });
});
