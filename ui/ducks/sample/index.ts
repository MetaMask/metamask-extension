// Export from each file
// Export the reducer as default
import sampleReducer from './sample-reducer';

export {
  default as counterReducer,
  increment,
  setError,
  SLICE_NAME,
  type SampleState,
} from './sample-reducer';
export { setCounter } from './sample-thunks';
export {
  selectCounterState,
  selectCounterValue,
  selectCounterError,
} from './sample-selectors';
export { useSample } from './sample-hooks';

export default sampleReducer;
