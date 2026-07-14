import React, { type ReactNode } from 'react';
import { Provider } from 'react-redux';
import type { Store } from 'redux';

type MetaMaskTestReduxProviderProps = {
  store: Store;
  children?: ReactNode;
};

export function MetaMaskTestReduxProvider({
  store,
  children,
}: MetaMaskTestReduxProviderProps) {
  return (
    <Provider store={store} stabilityCheck={false} noopCheck={false}>
      {children}
    </Provider>
  );
}
