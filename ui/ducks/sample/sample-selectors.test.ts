import {
  selectCounterState,
  selectCounterValue,
  selectCounterError,
} from './sample-selectors';

describe('sample selectors', () => {
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
