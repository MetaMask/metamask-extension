import React, { useMemo, useState } from 'react';
import { Provider } from 'react-redux';
import { render } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import userEvent from '@testing-library/user-event';
import { Router } from 'react-router-dom';
import PropTypes from 'prop-types';
import { createMemoryHistory } from 'history';
import configureStore from '../../ui/store/store';
import { I18nContext, LegacyI18nProvider } from '../../ui/contexts/i18n';
import { LegacyMetaMetricsProvider } from '../../ui/contexts/metametrics';
import { getMessage } from '../../ui/helpers/utils/i18n-helper';
import * as en from '../../app/_locales/en/messages.json';

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

const createProviderWrapper = (store, pathname = '/') => {
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
    Wrapper,
    history,
  };
};

export function renderWithProvider(component, store, pathname = '/') {
  const { history, Wrapper } = createProviderWrapper(store, pathname);
  return {
    ...render(component, { wrapper: Wrapper }),
    history,
  };
}

export function renderHookWithProvider(hook, state, pathname = '/') {
  const store = state ? configureStore(state) : undefined;
  const { history, Wrapper } = createProviderWrapper(store, pathname);
  return {
    ...renderHook(hook, { wrapper: Wrapper }),
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

export function renderControlledInput(InputComponent, props) {
  const ControlledWrapper = () => {
    const [value, setValue] = useState('');
    return (
      <InputComponent
        value={value}
        onChange={(e) => setValue(e.target.value)}
        {...props}
      />
    );
  };
  return { user: userEvent.setup(), ...render(<ControlledWrapper />) };
}

// userEvent setup function as per testing-library docs
// https://testing-library.com/docs/user-event/intr
export function renderWithUserEvent(jsx) {
  return {
    user: userEvent.setup(),
    ...render(jsx),
  };
}
