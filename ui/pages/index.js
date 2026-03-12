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

function AppProviders() {
  return (
    <MetaMetricsProvider>
      <LegacyMetaMetricsProvider>
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
      </LegacyMetaMetricsProvider>
    </MetaMetricsProvider>
  );
}

function RouteErrorBoundary() {
  const error = useRouteError();
  return (
    <MetaMetricsProvider>
      <ErrorPage error={error} />
    </MetaMetricsProvider>
  );
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
        <QueryClientProvider client={queryClient}>
          <I18nProvider>
            <LegacyI18nProvider>
              <RouterProvider router={router} />
            </LegacyI18nProvider>
          </I18nProvider>
        </QueryClientProvider>
      </Provider>
    );
  }
}

Index.propTypes = {
  store: PropTypes.object,
};

export default Index;
