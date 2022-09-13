import React, { useMemo } from 'react';
import { Provider } from 'react-redux';
import { render } from '@testing-library/react';
import { mount, shallow } from 'enzyme';
import { Router, MemoryRouter } from 'react-router-dom';
import PropTypes from 'prop-types';
import { createMemoryHistory } from 'history';
import { I18nContext, LegacyI18nProvider } from '../../ui/contexts/i18n';
import { LegacyMetaMetricsProvider } from '../../ui/contexts/metametrics';
import { getMessage } from '../../ui/helpers/utils/i18n-helper';
import * as en from '../../app/_locales/en/messages.json';

export function shallowWithContext(jsxComponent) {
  return shallow(jsxComponent, {
    context: { t: (str1, str2) => (str2 ? str1 + str2 : str1) },
  });
}

export function mountWithRouter(component, store = {}, pathname = '/') {
  // Instantiate router context
  const router = {
    history: new MemoryRouter().history,
    route: {
      location: {
        pathname,
      },
      match: {},
    },
  };

  const createContext = () => ({
    context: {
      router,
      t: (str) => str,
      metricsEvent: () => undefined,
      trackEvent: () => undefined,
      store,
    },
    childContextTypes: {
      router: PropTypes.object,
      t: PropTypes.func,
      metricsEvent: PropTypes.func,
      trackEvent: PropTypes.func,
      store: PropTypes.object,
    },
  });

  const Wrapper = () => (
    <MemoryRouter initialEntries={[{ pathname }]} initialIndex={0}>
      {component}
    </MemoryRouter>
  );

  return mount(<Wrapper />, createContext());
}

export const I18nProvider = (props) => {
  const { currentLocale, current, en: eng } = props;

  const t = useMemo(() => {
    return (key, ...args) =>
      getMessage(currentLocale, current, key, ...args) ||
      getMessage(currentLocale, eng, key, ...args);
  }, [currentLocale, current, eng]);

  return (
    <I18nContext.Provider value={t}>{props.children}</I18nContext.Provider>
  );
};

I18nProvider.propTypes = {
  currentLocale: PropTypes.string,
  current: PropTypes.object,
  en: PropTypes.object,
  children: PropTypes.node,
};

I18nProvider.defaultProps = {
  children: undefined,
};

export function renderWithProvider(component, store, pathname = '/') {
  const history = createMemoryHistory({ initialEntries: [pathname] });
  const Wrapper = ({ children }) =>
    store ? (
      <Provider store={store}>
        <Router history={history}>
          <I18nProvider currentLocale="en" current={en} en={en}>
            <LegacyI18nProvider>
              <LegacyMetaMetricsProvider>{children}</LegacyMetaMetricsProvider>
            </LegacyI18nProvider>
          </I18nProvider>
        </Router>
      </Provider>
    ) : (
      <Router history={history}>
        <LegacyI18nProvider>
          <LegacyMetaMetricsProvider>{children}</LegacyMetaMetricsProvider>
        </LegacyI18nProvider>
      </Router>
    );

  Wrapper.propTypes = {
    children: PropTypes.node,
  };
  return {
    ...render(component, { wrapper: Wrapper }),
    history,
  };
}

export function renderWithLocalization(component) {
  const Wrapper = ({ children }) => (
    <I18nProvider currentLocale="en" current={en} en={en}>
      <LegacyI18nProvider>{children}</LegacyI18nProvider>
    </I18nProvider>
  );

  Wrapper.propTypes = {
    children: PropTypes.node,
  };

  return render(component, { wrapper: Wrapper });
}
