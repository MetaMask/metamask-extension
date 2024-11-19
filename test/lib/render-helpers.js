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
import { setupInitialStore } from '../../ui';
import Root from '../../ui/pages';

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

export function renderHookWithProvider(hook, state, pathname = '/', Container) {
  const store = state ? configureStore(state) : undefined;

  const { history, Wrapper: ProviderWrapper } = createProviderWrapper(
    store,
    pathname,
  );

  const wrapper = Container
    ? ({ children }) => (
        <ProviderWrapper>
          <Container>{children}</Container>
        </ProviderWrapper>
      )
    : ProviderWrapper;

  return {
    ...renderHook(hook, { wrapper }),
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

/**
 * Helper function to render the UI application for integration tests.
 * It uses the Root component and sets up the store with the provided preloaded state.
 *
 * @param {*} extendedRenderOptions
 * @param {*} extendedRenderOptions.preloadedState - The initial state used to initialised the redux store. For integration tests we rely on a real store instance following the redux recommendations - https://redux.js.org/usage/writing-tests#guiding-principles
 * @param {*} extendedRenderOptions.backgroundConnection - The background connection rpc method. When writing integration tests, we can pass a mock background connection to simulate the background connection methods.
 * @param {*} extendedRenderOptions.activeTab - The active tab object.
 * @returns The rendered result from testing library.
 */
export async function integrationTestRender(extendedRenderOptions) {
  const {
    preloadedState = {},
    backgroundConnection,
    activeTab = {
      id: 113,
      title: 'E2E Test Dapp',
      origin: 'https://metamask.github.io',
      protocol: 'https:',
      url: 'https://metamask.github.io/test-dapp/',
    },
    ...renderOptions
  } = extendedRenderOptions;

  const store = await setupInitialStore(preloadedState, backgroundConnection, {
    activeTab,
  });

  return {
    ...render(<Root store={store} />, { ...renderOptions }),
  };
}
