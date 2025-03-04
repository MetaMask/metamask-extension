import sampleSlice, { INITIAL_STATE } from './sample-slice';

const { increment, setError } = sampleSlice.actions;

describe('sample reducer', () => {
  describe('reducer', () => {
    it('should return the initial state', () => {
      const nextState = sampleSlice.reducer(undefined, { type: 'unknown' });
      expect(nextState).toEqual(INITIAL_STATE);
    });

    it('should handle increment', () => {
      const initialState = { counter: 0, error: null };
      const nextState = sampleSlice.reducer(initialState, increment());
      expect(nextState.counter).toEqual(1);
      expect(nextState.error).toBeNull();
    });

    it('should handle increment from non-zero starting value', () => {
      const initialState = { counter: 5, error: null };
      const nextState = sampleSlice.reducer(initialState, increment());
      expect(nextState.counter).toEqual(6);
    });

    it('should handle setError', () => {
      const initialState = { counter: 0, error: null };
      const errorMessage = 'Test error message';
      const nextState = sampleSlice.reducer(
        initialState,
        setError(errorMessage),
      );
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
});
