import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Provider } from 'react-redux';
import {
  HashRouter,
  RouterProvider,
  createHashRouter,
  useRouteError,
} from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
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
import { AppPureBlackProvider } from '../contexts/pure-black/pure-black-provider';
import ErrorPageBase from './error-page/error-page.component';

import Routes, { routeConfig } from './routes';

const isStrictModeEnabled =
  process.env.NODE_ENV === 'development' && !process.env.IN_TEST;

/**
 * Dev-only StrictMode in the app shell. Individual unit tests that need to
 * exercise double-mount behavior can import `test/jest/strict-mode.js` helpers.
 */

function withStrictMode(children) {
  return isStrictModeEnabled ? (
    <React.StrictMode>{children}</React.StrictMode>
  ) : (
    children
  );
}

function AppProviders() {
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
                      <AppPureBlackProvider>
                        <Routes />
                      </AppPureBlackProvider>
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
}

function ErrorPage({ error }) {
  return (
    <MetaMetricsProvider>
      <I18nProvider>
        <ErrorPageBase error={error} />
      </I18nProvider>
    </MetaMetricsProvider>
  );
}

ErrorPage.propTypes = {
  error: PropTypes.object,
};

function RouteErrorBoundary() {
  const error = useRouteError();
  return <ErrorPage error={error} />;
}

const router = createHashRouter([
  {
    element: <AppProviders />,
    errorElement: <RouteErrorBoundary />,
    children: routeConfig,
  },
]);

class Index extends PureComponent {
  state = {};

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    captureException(error);
  }

  render() {
    const { error } = this.state;
    const { store, uiMessenger } = this.props;

    if (error) {
      return (
        <Provider store={store}>
          <HashRouter>
            <ErrorPage error={error} />
          </HashRouter>
        </Provider>
      );
    }

    return (
      <Provider store={store}>
        <UIMessengerProvider value={uiMessenger}>
          {withStrictMode(<RouterProvider router={router} />)}
        </UIMessengerProvider>
      </Provider>
    );
  }
}

Index.propTypes = {
  store: PropTypes.object,
  uiMessenger: PropTypes.object,
};

export default Index;
