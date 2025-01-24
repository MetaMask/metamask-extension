import { createSelector } from 'reselect';
import { SampleGlobalState } from '../ducks/sample/sample';

type State = {
  sample: SampleGlobalState;
};

export function selectSample(state: State): SampleGlobalState {
  return state.sample;
}

export const selectSampleCounter = createSelector(
  selectSample,
  (sample) => sample.counter,
);
