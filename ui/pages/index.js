import PropTypes from 'prop-types';
import React, { PureComponent, Suspense } from 'react';
// import { Provider } from 'react-redux';
import { HashRouter } from 'react-router-dom';
// import * as Sentry from '@sentry/browser';
// import { I18nProvider, LegacyI18nProvider } from '../contexts/i18n';
import { MetaMetricsProvider } from '../contexts/metametrics';
// import { MetamaskNotificationsProvider } from '../contexts/metamask-notifications';
// import { CurrencyRateProvider } from '../contexts/currencyRate';
const Routes = React.lazy(() => import('./routes'));

class Root extends PureComponent {
  state = {};

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    // Sentry.captureException(error);
  }

  render() {
    const { error, errorId } = this.state;
    const { store } = this.props;

    if (error) {
      return (
        <div>Error! {error.message}</div>
        // <Provider store={store}>
        //   <I18nProvider>
        //     <LegacyI18nProvider>
        // <ErrorPage error={error} errorId={errorId} />
        //     </LegacyI18nProvider>
        //   </I18nProvider>
        // </Provider>
      );
    }

    return (
      // <Provider store={store}>
      <HashRouter hashType="noslash">
        <MetaMetricsProvider>
          {/* <LegacyMetaMetricsProvider>
              <I18nProvider>
                <LegacyI18nProvider>
                  <CurrencyRateProvider>
                    <MetamaskNotificationsProvider> */}
          <Suspense fallback={<div />}>
            <Routes />
          </Suspense>
          <div>Hello World Root</div>
          {/* </MetamaskNotificationsProvider>
                  </CurrencyRateProvider>
                </LegacyI18nProvider>
              </I18nProvider>
            </LegacyMetaMetricsProvider> */}
        </MetaMetricsProvider>
      </HashRouter>
      // </Provider>
    );
  }
}

Root.propTypes = {
  store: PropTypes.object,
};

export default Root;
