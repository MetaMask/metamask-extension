import React, { ReactChildren, ReactElement } from 'react';

import { ConfirmContextProvider } from '../../../ui/pages/confirmations/context/confirm';
import { DappSwapContextProvider } from '../../../ui/pages/confirmations/context/dapp-swap';
import {
  renderHookWithProvider,
  renderWithProvider,
} from '../render-helpers-navigate';
import { DEFAULT_ROUTE } from '../../../ui/helpers/constants/routes';
import { GasFeeModalContextProvider } from '../../../ui/pages/confirmations/context/gas-fee-modal';
import { HardwareWalletErrorProvider } from '../../../ui/contexts/hardware-wallets';

export function renderWithConfirmContextProvider(
  component: ReactElement,
  store: unknown,
  pathname = DEFAULT_ROUTE,
  confirmationId?: string,
) {
  return renderWithProvider(
    <HardwareWalletErrorProvider>
      <ConfirmContextProvider confirmationId={confirmationId}>
        <DappSwapContextProvider>
          <GasFeeModalContextProvider>{component}</GasFeeModalContextProvider>
        </DappSwapContextProvider>
      </ConfirmContextProvider>
    </HardwareWalletErrorProvider>,
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
    : ({ children }: { children: ReactElement }) => (
        <HardwareWalletErrorProvider>
          <ConfirmContextProvider confirmationId={confirmationId}>
            <DappSwapContextProvider>
              <GasFeeModalContextProvider>
                {children as ReactElement}
              </GasFeeModalContextProvider>
            </DappSwapContextProvider>
          </ConfirmContextProvider>
        </HardwareWalletErrorProvider>
      );

  return renderHookWithProvider(hook, state, pathname, contextContainer);
}
