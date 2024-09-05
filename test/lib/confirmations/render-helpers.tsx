import React, { ReactChildren, ReactElement } from 'react';

import { ConfirmContextProvider } from '../../../ui/pages/confirmations/context/confirm';
import { renderHookWithProvider, renderWithProvider } from '../render-helpers';

export function renderWithConfirmContextProvider(
  component: ReactElement,
  store: unknown,
  pathname = '/',
) {
  return renderWithProvider(
    <ConfirmContextProvider>{component}</ConfirmContextProvider>,
    store,
    pathname,
  );
}

export function renderHookWithConfirmContextProvider(
  hook: () => unknown,
  state: Record<string, unknown>,
  pathname = '/',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Container?: any,
) {
  const contextContainer = Container
    ? ({ children }: { children: ReactChildren }) => (
        <ConfirmContextProvider>
          <Container>{children}</Container>
        </ConfirmContextProvider>
      )
    : ConfirmContextProvider;

  return renderHookWithProvider(hook, state, pathname, contextContainer);
}
