import { useSelector, useDispatch } from 'react-redux';
import { MetaMaskReduxDispatch } from '../../store/store';
import { increment } from './sample-reducer';
import { setCounter } from './sample-thunks';
import { selectCounterValue, selectCounterError } from './sample-selectors';

// Hook
export function useSample() {
  const value = useSelector(selectCounterValue);
  const error = useSelector(selectCounterError);
  const dispatch = useDispatch<MetaMaskReduxDispatch>();

  return {
    value,
    increment: () => dispatch(increment()),
    setCounter: (amount: number) => dispatch(setCounter(amount)),
    error,
  };
}
