import {
  type TypedUseSelectorHook,
  useDispatch as useReduxDispatch,
  useSelector,
} from 'react-redux';
import type { MetaMaskReduxDispatch, MetaMaskReduxState } from './types';

export const useAppSelector: TypedUseSelectorHook<MetaMaskReduxState> =
  useSelector;
export const useDispatch = () => useReduxDispatch<MetaMaskReduxDispatch>();
