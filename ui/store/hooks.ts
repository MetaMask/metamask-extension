import {
  type TypedUseSelectorHook,
  useDispatch,
  useSelector,
} from 'react-redux';
import type { MetaMaskReduxDispatch, MetaMaskReduxState } from './types';

export const useAppSelector: TypedUseSelectorHook<MetaMaskReduxState> =
  useSelector;
export const useAppDispatch = () => useDispatch<MetaMaskReduxDispatch>();
