import type configureStore from './store';

type Store = ReturnType<typeof configureStore>;
export type MetaMaskReduxState = ReturnType<Store['getState']>;
export type MetaMaskReduxDispatch = Store['dispatch'];
