import type { MetaMaskReduxDispatch } from '../ui/store/store';

declare module 'react-redux' {
  // react-redux@8 defaults `useDispatch()` to `Dispatch<AnyAction>`, which
  // rejects thunk actions. Default to our store dispatch type instead.
  export function useDispatch<TDispatch = MetaMaskReduxDispatch>(): TDispatch;
}
