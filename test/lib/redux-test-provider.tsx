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
  // react-redux v8 enables stability/noop checks by default in development.
  // Unit tests still have many selectors that return new refs; disable the
  // checks here so they do not flood the console baseline. Production keeps
  // the default ('once') via the app Provider.
  return (
    <Provider store={store} stabilityCheck="never" noopCheck="never">
      {children}
    </Provider>
  );
}
