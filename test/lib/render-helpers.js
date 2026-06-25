import React, { useMemo, useState } from 'react';
import { render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import PropTypes from 'prop-types';
import { noop } from 'lodash';
import { I18nContext } from '../../ui/contexts/i18n';
import { getMessage } from '../../ui/helpers/utils/i18n-helper';
import * as en from '../../app/_locales/en/messages.json';
import { setupInitialStore, connectToBackground } from '../../ui';
import Root from '../../ui/pages';

/** @type {import('react').FC<{ currentLocale?: string; current?: object; en?: object; children?: import('react').ReactNode }>} */
export const I18nProvider = ({ currentLocale, current, en: eng, children }) => {
  const t = useMemo(() => {
    return (key, ...args) =>
      getMessage(currentLocale, current, key, ...args) ||
      getMessage(currentLocale, eng, key, ...args);
  }, [currentLocale, current, eng]);

  return <I18nContext.Provider value={t}>{children}</I18nContext.Provider>;
};

I18nProvider.propTypes = {
  currentLocale: PropTypes.string,
  current: PropTypes.object,
  en: PropTypes.object,
  children: PropTypes.node,
};

export function renderWithLocalization(component) {
  const Wrapper = ({ children }) => (
    <I18nProvider currentLocale="en" current={en} en={en}>
      {children}
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

  connectToBackground(backgroundConnection, noop);

  const store = await setupInitialStore(preloadedState, activeTab);

  return {
    ...render(<Root store={store} />, { ...renderOptions }),
  };
}
