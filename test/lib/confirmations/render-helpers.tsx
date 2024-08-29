import React, { ReactElement } from 'react';

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
  Container?: ReactElement,
) {
  const contextContainer = Container ? (
    <ConfirmContextProvider>{Container}</ConfirmContextProvider>
  ) : (
    ConfirmContextProvider
  );

  return renderHookWithProvider(hook, state, pathname, contextContainer);
}
