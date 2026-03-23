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
import { Messenger } from '@metamask/messenger';
import { queryClient } from '../contexts/query-client';
import { HardwareWalletErrorProvider } from '../contexts/hardware-wallets';
import { UIMessengerProvider } from '../contexts/ui-messenger';
import ErrorPageBase from './error-page/error-page.component';

import Routes, { routeConfig } from './routes';

/**
 * UI messenger instance — parent for all route messengers.
 *
 * Production: created by `getUIMessenger(backgroundConnection)` which bridges
 * actions and events over JSON-RPC to the background messenger. In this PoC,
 * constructed as a local messenger to demonstrate the delegation/enforcement
 * pattern without the bridge infrastructure.
 *
 * @see {@link https://github.com/MetaMask/metamask-extension/compare/main...messenger-ui-integration-prototype}
 */
const uiMessenger = new Messenger({ namespace: 'UI' });

function AppProviders() {
  return (
    <MetaMetricsProvider>
      <LegacyMetaMetricsProvider>
        <I18nProvider>
          <LegacyI18nProvider>
            <QueryClientProvider client={queryClient}>
              <UIMessengerProvider value={uiMessenger}>
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
              </UIMessengerProvider>
            </QueryClientProvider>
          </LegacyI18nProvider>
        </I18nProvider>
      </LegacyMetaMetricsProvider>
    </MetaMetricsProvider>
  );
}

function ErrorPage({ error }) {
  return (
    <MetaMetricsProvider>
      <I18nProvider>
        <LegacyI18nProvider>
          <ErrorPageBase error={error} />
        </LegacyI18nProvider>
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
    const { store } = this.props;

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
        <RouterProvider router={router} />
      </Provider>
    );
  }
}

Index.propTypes = {
  store: PropTypes.object,
};

export default Index;
