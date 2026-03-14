import React, { ReactChildren, ReactElement } from 'react';
import { Provider } from 'react-redux';
import { render } from '@testing-library/react';
import type { Store } from 'redux';

import {
  ConfirmContext,
  ConfirmContextType,
  ConfirmContextProvider,
} from '../../../ui/pages/confirmations/context/confirm';
import { DappSwapContextProvider } from '../../../ui/pages/confirmations/context/dapp-swap';
import {
  I18nProvider,
  en,
  renderHookWithProvider,
  renderWithProvider,
} from '../render-helpers-navigate';
import { DEFAULT_ROUTE } from '../../../ui/helpers/constants/routes';
import { GasFeeModalContextProvider } from '../../../ui/pages/confirmations/context/gas-fee-modal';

export function renderWithConfirmContextProvider(
  component: ReactElement,
  store: unknown,
  pathname = DEFAULT_ROUTE,
  confirmationId?: string,
) {
  return renderWithProvider(
    <ConfirmContextProvider confirmationId={confirmationId}>
      <DappSwapContextProvider>
        <GasFeeModalContextProvider>{component}</GasFeeModalContextProvider>
      </DappSwapContextProvider>
    </ConfirmContextProvider>,
    store,
    pathname,
  );
}

function renderWithContext(
  component: ReactElement,
  store: Store,
  contextValue: ConfirmContextType,
) {
  const wrapper = ({ children }: { children: ReactElement }) => (
    <Provider store={store}>
      <I18nProvider currentLocale="en" current={en} en={en}>
        <ConfirmContext.Provider value={contextValue}>
          <DappSwapContextProvider>
            <GasFeeModalContextProvider>{children}</GasFeeModalContextProvider>
          </DappSwapContextProvider>
        </ConfirmContext.Provider>
      </I18nProvider>
    </Provider>
  );

  return render(component, { wrapper });
}

export function renderWithConfirmContext(
  component: ReactElement,
  store: Store,
) {
  const state = store.getState() as {
    metamask: {
      unapprovedTypedMessages: Record<
        string,
        ConfirmContextType['currentConfirmation']
      >;
    };
  };

  const currentConfirmation = Object.values(
    state.metamask.unapprovedTypedMessages,
  )[0];

  return renderWithContext(component, store, {
    currentConfirmation,
    isScrollToBottomCompleted: true,
    setIsScrollToBottomCompleted: () => undefined,
  });
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
            <GasFeeModalContextProvider>
              <Container>{children}</Container>
            </GasFeeModalContextProvider>
          </DappSwapContextProvider>
        </ConfirmContextProvider>
      )
    : ({ children }: { children: ReactElement }) => (
        <ConfirmContextProvider confirmationId={confirmationId}>
          <DappSwapContextProvider>
            <GasFeeModalContextProvider>
              {children as ReactElement}
            </GasFeeModalContextProvider>
          </DappSwapContextProvider>
        </ConfirmContextProvider>
      );

  return renderHookWithProvider(hook, state, pathname, contextContainer);
}
