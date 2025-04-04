// Export from slice.ts
import reducer, {
  increment,
  setError,
  setCounter,
  selectCounterState,
  selectCounterValue,
  selectCounterError,
} from './slice';

export {
  increment,
  setError,
  setCounter,
  selectCounterState,
  selectCounterValue,
  selectCounterError,
};
export { useSample } from './useSample';

export default reducer;
