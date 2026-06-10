import type { MetaMaskReduxDispatch } from '../ui/store/store';

/**
 * react-redux v8 types `useDispatch()` as `Dispatch<AnyAction>`, which rejects
 * thunks. MetaMask's store is configured with RTK thunk middleware, so we
 * augment the hook to return the store's dispatch type.
 */
declare module 'react-redux' {
  export function useDispatch<
    TDispatch extends MetaMaskReduxDispatch = MetaMaskReduxDispatch,
  >(): TDispatch;
}
