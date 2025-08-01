import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Provider } from 'react-redux';
import { HashRouter } from 'react-router-dom';
import { CompatRouter } from 'react-router-dom-v5-compat';
import { captureException } from '../../shared/lib/sentry';
import { I18nProvider, LegacyI18nProvider } from '../contexts/i18n';
import {
  MetaMetricsProvider,
  LegacyMetaMetricsProvider,
} from '../contexts/metametrics';
import { MetamaskNotificationsProvider } from '../contexts/metamask-notifications';
import { AssetPollingProvider } from '../contexts/assetPolling';
import { MetamaskIdentityProvider } from '../contexts/identity';
import ErrorPage from './error-page/error-page.component';

import Routes from './routes';

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
          <I18nProvider>
            <LegacyI18nProvider>
              <ErrorPage error={error} />
            </LegacyI18nProvider>
          </I18nProvider>
        </Provider>
      );
    }

    return (
      <Provider store={store}>
        <HashRouter hashType="noslash">
          <CompatRouter>
            <MetaMetricsProvider>
              <LegacyMetaMetricsProvider>
                <I18nProvider>
                  <LegacyI18nProvider>
                    <AssetPollingProvider>
                      <MetamaskIdentityProvider>
                        <MetamaskNotificationsProvider>
                          <Routes />
                        </MetamaskNotificationsProvider>
                      </MetamaskIdentityProvider>
                    </AssetPollingProvider>
                  </LegacyI18nProvider>
                </I18nProvider>
              </LegacyMetaMetricsProvider>
            </MetaMetricsProvider>
          </CompatRouter>
        </HashRouter>
      </Provider>
    );
  }
}

Index.propTypes = {
  store: PropTypes.object,
};

export default Index;
