import { configureStore } from '@reduxjs/toolkit';
import { setCounter } from './sample-thunks';
import counterReducer, { SampleState } from './sample-reducer';

// Create a test store for Redux tests
const createTestStore = (preloadedState?: { sample: SampleState }) => {
  return configureStore({
    reducer: {
      sample: counterReducer,
    },
    preloadedState,
  });
};

describe('sample thunks', () => {
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
