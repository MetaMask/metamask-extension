import { useSelector, useDispatch } from 'react-redux';
import type { MetaMaskReduxDispatch } from '../../store/store';
import {
  increment,
  setCounter,
  selectCounterValue,
  selectCounterError,
} from './slice';

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
