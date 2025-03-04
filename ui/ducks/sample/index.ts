// Export from each file
// Export the reducer as default

import sampleSlice from './sample-slice';

export const { increment, setError } = sampleSlice.actions;
export { setCounter } from './sample-thunks';
export {
  selectCounterState,
  selectCounterValue,
  selectCounterError,
} from './sample-selectors';
export { useSample } from './useSample';

export default sampleSlice.reducer;
