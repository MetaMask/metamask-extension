import React, { Component, useLayoutEffect, type ReactNode } from 'react';
import { Provider } from 'react-redux';
import {
  HashRouter,
  RouterProvider,
  createHashRouter,
  useRouteError,
} from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import type { Store } from 'redux';
import { captureException } from '../../shared/lib/sentry';
import { I18nProvider } from '../contexts/i18n';
import { MetaMetricsProvider } from '../contexts/metametrics';
import { MetamaskNotificationsProvider } from '../contexts/metamask-notifications';
import { AssetPollingProvider } from '../contexts/assetPolling';
import { MetamaskIdentityProvider } from '../contexts/identity';
import { ShieldSubscriptionProvider } from '../contexts/shield/shield-subscription';
import RiveWasmProvider from '../contexts/rive-wasm';
import { queryClient } from '../contexts/query-client';
import RampsBootstrap from '../hooks/ramps/RampsBootstrap';
import { HardwareWalletErrorProvider } from '../contexts/hardware-wallets';
import { UIMessengerProvider } from '../contexts/ui-messenger';
import type { UIMessenger } from '../messengers/ui-messenger';
import ErrorPageBase from './error-page/error-page.component';

import Routes, { routeConfig } from './routes';

const isStrictModeEnabled =
  process.env.NODE_ENV === 'development' && !process.env.IN_TEST;

/**
 * Dev-only StrictMode in the app shell. Individual unit tests that need to
 * exercise double-mount behavior can import `test/jest/strict-mode.js` helpers.
 */

function withStrictMode(children: ReactNode) {
  return isStrictModeEnabled ? (
    <React.StrictMode>{children}</React.StrictMode>
  ) : (
    children
  );
}

const AppProviders = () => {
  return (
    <MetaMetricsProvider>
      <I18nProvider>
        <QueryClientProvider client={queryClient}>
          <RampsBootstrap />
          <AssetPollingProvider>
            <MetamaskIdentityProvider>
              <MetamaskNotificationsProvider>
                <HardwareWalletErrorProvider>
                  <ShieldSubscriptionProvider>
                    <RiveWasmProvider>
                      <Routes />
                    </RiveWasmProvider>
                  </ShieldSubscriptionProvider>
                </HardwareWalletErrorProvider>
              </MetamaskNotificationsProvider>
            </MetamaskIdentityProvider>
          </AssetPollingProvider>
        </QueryClientProvider>
      </I18nProvider>
    </MetaMetricsProvider>
  );
};

const ErrorPage = ({ error }: { error: Error }) => {
  return (
    <MetaMetricsProvider>
      <I18nProvider>
        <ErrorPageBase error={error} />
      </I18nProvider>
    </MetaMetricsProvider>
  );
};

const RouteErrorBoundary = () => {
  const error = useRouteError();
  return <ErrorPage error={error as Error} />;
};

export const router = createHashRouter([
  {
    element: <AppProviders />,
    errorElement: <RouteErrorBoundary />,
    children: routeConfig,
  },
]);

type IndexProps = {
  store: Store;
  uiMessenger: UIMessenger;
  onFirstCommit?: () => void;
};

type RootErrorBoundaryProps = {
  fallback: (error: Error) => ReactNode;
  children: ReactNode;
};

// React has no hook-based error boundary, so this must be a class.
class RootErrorBoundary extends Component<
  RootErrorBoundaryProps,
  { error?: Error }
> {
  state: { error?: Error } = {};

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    captureException(error);
  }

  render() {
    const { error } = this.state;
    const { fallback, children } = this.props;
    return error ? fallback(error) : children;
  }
}

export default function Index({
  store,
  uiMessenger,
  onFirstCommit,
}: IndexProps) {
  // Runs in the commit phase of the first render, as the legacy synchronous
  // `ReactDOM.render` did before `createRoot` made rendering asynchronous.
  useLayoutEffect(() => {
    onFirstCommit?.();
    // Only the first commit is of interest.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Provider store={store}>
      <RootErrorBoundary
        fallback={(error) => (
          <HashRouter>
            <ErrorPage error={error} />
          </HashRouter>
        )}
      >
        <UIMessengerProvider value={uiMessenger}>
          {withStrictMode(<RouterProvider router={router} />)}
        </UIMessengerProvider>
      </RootErrorBoundary>
    </Provider>
  );
}
