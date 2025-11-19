import React, { ReactElement } from 'react';

import { ConfirmContextProvider } from '../../../ui/pages/confirmations/context/confirm';
import { DappSwapContextProvider } from '../../../ui/pages/confirmations/context/dapp-swap';
import { renderHookWithProvider, renderWithProvider } from '../render-helpers';

export function renderWithConfirmContextProvider(
  component: ReactElement,
  store: unknown,
  pathname = '/',
) {
  return renderWithProvider(
    <ConfirmContextProvider>
      <DappSwapContextProvider>{component}</DappSwapContextProvider>
    </ConfirmContextProvider>,
    store,
    pathname,
  );
}

export function renderHookWithConfirmContextProvider(
  hook: () => unknown,
  state: Record<string, unknown>,
  pathname = '/',

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Container?: any,
) {
  const contextContainer = Container
    ? ({ children }: { children: ReactElement }) => (
        <ConfirmContextProvider>
          <DappSwapContextProvider>
            <Container>{children}</Container>
          </DappSwapContextProvider>
        </ConfirmContextProvider>
      )
    : ({ children }: { children: ReactElement }) => (
        <ConfirmContextProvider>
          <DappSwapContextProvider>{children}</DappSwapContextProvider>
        </ConfirmContextProvider>
      );

  return renderHookWithProvider(hook, state, pathname, contextContainer);
}
