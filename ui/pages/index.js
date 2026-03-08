import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Provider } from 'react-redux';
import {
  HashRouter,
  Outlet,
  RouterProvider,
  createHashRouter,
  useRouteError,
} from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { captureException } from '../../shared/lib/sentry';
import { I18nProvider, LegacyI18nProvider } from '../contexts/i18n';
import {
  MetaMetricsProvider,
  LegacyMetaMetricsProvider,
} from '../contexts/metametrics';
import { MetamaskNotificationsProvider } from '../contexts/metamask-notifications';
import { AssetPollingProvider } from '../contexts/assetPolling';
import { MetamaskIdentityProvider } from '../contexts/identity';
import { ShieldSubscriptionProvider } from '../contexts/shield/shield-subscription';
import RiveWasmProvider from '../contexts/rive-wasm';
import { queryClient } from '../contexts/query-client';
import { HardwareWalletErrorProvider } from '../contexts/hardware-wallets';
import ErrorPage from './error-page/error-page.component';

import Routes, { routeConfig } from './routes';

/**
 * Error boundary for the data router. When a route component throws,
 * createHashRouter catches it internally instead of letting it reach the
 * React class component boundary. This renders the same ErrorPage used by
 * the class boundary, and reports to Sentry.
 */
function RouteErrorBoundary() {
  const error = useRouteError();

  captureException(error);

  return <ErrorPage error={error} />;
}

/**
 * Root layout route element containing all context providers.
 * Renders <Outlet /> which is replaced by the matched child route (<Routes />).
 */
function AppProviders() {
  return (
    <MetaMetricsProvider>
      <LegacyMetaMetricsProvider>
        <I18nProvider>
          <LegacyI18nProvider>
            <QueryClientProvider client={queryClient}>
              <AssetPollingProvider>
                <MetamaskIdentityProvider>
                  <MetamaskNotificationsProvider>
                    <HardwareWalletErrorProvider>
                      <ShieldSubscriptionProvider>
                        <RiveWasmProvider>
                          <Outlet />
                        </RiveWasmProvider>
                      </ShieldSubscriptionProvider>
                    </HardwareWalletErrorProvider>
                  </MetamaskNotificationsProvider>
                </MetamaskIdentityProvider>
              </AssetPollingProvider>
            </QueryClientProvider>
          </LegacyI18nProvider>
        </I18nProvider>
      </LegacyMetaMetricsProvider>
    </MetaMetricsProvider>
  );
}

const router = createHashRouter([
  {
    element: <AppProviders />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        element: <Routes />,
        errorElement: <RouteErrorBoundary />,
        children: routeConfig,
      },
    ],
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
    const { store } = this.props;

    if (error) {
      return (
        <Provider store={store}>
          <HashRouter>
            <MetaMetricsProvider>
              <I18nProvider>
                <LegacyI18nProvider>
                  <ErrorPage error={error} />
                </LegacyI18nProvider>
              </I18nProvider>
            </MetaMetricsProvider>
          </HashRouter>
        </Provider>
      );
    }

    return (
      <Provider store={store}>
        <RouterProvider router={router} />
      </Provider>
    );
  }
}

Index.propTypes = {
  store: PropTypes.object,
};

export default Index;
