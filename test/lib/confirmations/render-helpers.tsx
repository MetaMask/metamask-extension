import React, { ReactChildren, ReactElement } from 'react';

import { ConfirmContextProvider } from '../../../ui/pages/confirmations/context/confirm';
import { DappSwapContextProvider } from '../../../ui/pages/confirmations/context/dapp-swap';
import {
  renderHookWithProvider,
  renderWithProvider,
} from '../render-helpers-navigate';
import { DEFAULT_ROUTE } from '../../../ui/helpers/constants/routes';

export function renderWithConfirmContextProvider(
  component: ReactElement,
  store: unknown,
  pathname = DEFAULT_ROUTE,
  confirmationId?: string,
) {
  return renderWithProvider(
    <ConfirmContextProvider confirmationId={confirmationId}>
      {component}
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
  confirmationId?: string,
) {
  const contextContainer = Container
    ? ({ children }: { children: ReactChildren }) => (
        <ConfirmContextProvider confirmationId={confirmationId}>
          <DappSwapContextProvider>
            <Container>{children}</Container>
          </DappSwapContextProvider>
        </ConfirmContextProvider>
      )
    : ({ children }: { children: ReactElement }) => (
        <ConfirmContextProvider confirmationId={confirmationId}>
          <DappSwapContextProvider>
            {children as ReactElement}
          </DappSwapContextProvider>
        </ConfirmContextProvider>
      );

  return renderHookWithProvider(hook, state, pathname, contextContainer);
}
