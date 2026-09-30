import React, { ReactElement } from 'react';
import { render } from '@testing-library/react';
import type { Store } from 'redux';

import { MetaMaskTestReduxProvider } from '../redux-test-provider';

import {
  ConfirmContext,
  ConfirmContextType,
  ConfirmContextProvider,
} from '../../../ui/pages/confirmations/context/confirm';
import { DappSwapContextProvider } from '../../../ui/pages/confirmations/context/dapp-swap';
import {
  createProviderWrapper,
  I18nProvider,
  en,
  renderHookWithProvider,
} from '../render-helpers-navigate';
import { DEFAULT_ROUTE } from '../../../ui/helpers/constants/routes';
import { GasFeeModalContextProvider } from '../../../ui/pages/confirmations/context/gas-fee-modal';
import { HardwareWalletErrorProvider } from '../../../ui/contexts/hardware-wallets';

export function renderWithConfirmContextProvider(
  component: ReactElement,
  store: unknown,
  pathname = DEFAULT_ROUTE,
  confirmationId?: string,
  getMockTrackEvent?: () => jest.Mock,
) {
  const ConfirmContextContainer = ({
    children,
  }: {
    children: React.ReactNode;
  }) => (
    <HardwareWalletErrorProvider>
      <ConfirmContextProvider confirmationId={confirmationId}>
        <DappSwapContextProvider>
          <GasFeeModalContextProvider>{children}</GasFeeModalContextProvider>
        </DappSwapContextProvider>
      </ConfirmContextProvider>
    </HardwareWalletErrorProvider>
  );

  const ProviderWrapper = createProviderWrapper(
    store,
    pathname,
    getMockTrackEvent ?? (() => jest.fn().mockResolvedValue(undefined)),
  );

  const wrapper = ({ children }: { children: React.ReactNode }) => {
    const confirmContext = (
      <ConfirmContextContainer>{children}</ConfirmContextContainer>
    );

    return (
      // @ts-expect-error: React 18 ReactElement.key is Key|null, incompatible with @types/prop-types ReactNodeLike
      <ProviderWrapper>{confirmContext}</ProviderWrapper>
    );
  };

  return render(component, { wrapper });
}

function renderWithContext(
  component: ReactElement,
  store: Store,
  contextValue: ConfirmContextType,
) {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <MetaMaskTestReduxProvider store={store}>
      <I18nProvider currentLocale="en" current={en} en={en}>
        <ConfirmContext.Provider value={contextValue}>
          <DappSwapContextProvider>
            <GasFeeModalContextProvider>{children}</GasFeeModalContextProvider>
          </DappSwapContextProvider>
        </ConfirmContext.Provider>
      </I18nProvider>
    </MetaMaskTestReduxProvider>
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
    goBackTo: undefined,
    suppressAutoExit: () => undefined,
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
    ? ({ children }: { children: React.ReactNode }) => (
        <HardwareWalletErrorProvider>
          <ConfirmContextProvider confirmationId={confirmationId}>
            <DappSwapContextProvider>
              <GasFeeModalContextProvider>
                <Container>{children}</Container>
              </GasFeeModalContextProvider>
            </DappSwapContextProvider>
          </ConfirmContextProvider>
        </HardwareWalletErrorProvider>
      )
    : ({ children }: { children: React.ReactNode }) => (
        <HardwareWalletErrorProvider>
          <ConfirmContextProvider confirmationId={confirmationId}>
            <DappSwapContextProvider>
              <GasFeeModalContextProvider>
                {children}
              </GasFeeModalContextProvider>
            </DappSwapContextProvider>
          </ConfirmContextProvider>
        </HardwareWalletErrorProvider>
      );

  return renderHookWithProvider(hook, state, pathname, contextContainer);
}
