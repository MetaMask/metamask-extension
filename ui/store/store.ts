import { Reducer, StoreEnhancer } from 'redux';
import { type TypedUseSelectorHook, useSelector } from 'react-redux';
import { configureStore as baseConfigureStore } from '@reduxjs/toolkit';
import devtoolsEnhancer from 'remote-redux-devtools';
import rootReducer from '../ducks';
import type { AppSliceState } from '../ducks/app/app';
import type { FlattenedBackgroundStateProxy } from '../../shared/types/background';

/**
 * Universal message type for decrypt/encrypt messages.
 * This replaces the temporary TemporaryMessageDataType.
 *
 * Note: AbstractMessage from @metamask/message-manager may not have all the fields we need,
 * so we define a compatible type structure here.
 */
export type MessageDataType = {
  id: string;
  type: string;
  msgParams: {
    metamaskId: string;
    data: string;
  };
  // Additional fields that may be present from AbstractMessage
  time?: number;
  status?: string;
  rawSig?: string;
};

export type MessagesIndexedById = {
  [id: string]: MessageDataType;
};

type RootReducerReturnType = ReturnType<typeof rootReducer>;

/**
 * `ReduxState` overrides incorrectly typed properties of `RootReducerReturnType`, and is only intended to be used as an input for `configureStore`.
 * The `MetaMaskReduxState` type (derived from the returned output of `configureStore`) is to be used consistently as the single source-of-truth and representation of Redux state shape.
 *
 * Redux slice reducers that are passed an `AnyAction`-type `action` parameter are inferred to have a return type of `never`.
 * TODO: Supply exhaustive action types to all Redux slices (specifically `metamask` and `appState`)
 */
type ReduxState = {
  activeTab: {
    origin: string;
  };
  metamask: FlattenedBackgroundStateProxy;
  appState: AppSliceState['appState'];
} & Omit<RootReducerReturnType, 'activeTab' | 'metamask' | 'appState'>;

/**
 * Configure the Redux store with proper type safety.
 *
 * @param preloadedState - Optional initial state to preload into the store.
 * @returns Configured Redux store instance.
 */
export default function configureStore(
  preloadedState?: Partial<ReduxState>,
) {
  const reduxDevtoolsEnabled = process.env.METAMASK_REACT_REDUX_DEVTOOLS;
  const runningTests = process.env.IN_TEST;
  const enhancers: StoreEnhancer[] = [];

  if (reduxDevtoolsEnabled && !runningTests) {
    enhancers.push(
      devtoolsEnhancer({
        name: 'MetaMask',
        hostname: 'localhost',
        port: 8000,
        realtime: true,
      }) as StoreEnhancer,
    );
  }

  return baseConfigureStore({
    reducer: rootReducer as unknown as Reducer<ReduxState>,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        /**
         * We do not persist the redux tree for rehydration, so checking for
         * serializable state keys is not relevant for now. Any state that persists
         * is managed in the background. We may at some point want this, but we can
         * gradually implement by using the ignore options to ignore those actions
         * and state keys that are not serializable, preventing us from adding new
         * actions and state that would violate our ability to persist state keys.
         * NOTE: redux-thunk is included by default in the middleware below.
         */
        serializableCheck: false,
        /**
         * immutableCheck controls whether we get warnings about mutation of
         * state, this is turned off by default for now since it heavily affects
         * performance due to the Redux state growing larger.
         */
        immutableCheck: false,
      }),
    devTools: false,
    enhancers,
    preloadedState,
  });
}
type Store = ReturnType<typeof configureStore>;
export type MetaMaskReduxState = ReturnType<Store['getState']>;
export type MetaMaskReduxDispatch = Store['dispatch'];
export const useAppSelector: TypedUseSelectorHook<MetaMaskReduxState> =
  useSelector;
