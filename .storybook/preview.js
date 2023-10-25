/*
  * The addParameters and addDecorator APIs to add global decorators and parameters, exported by the various frameworks (e.g. @storybook/react) and @storybook/client were deprecated in 6.0 and have been removed in 7.0.

Instead, use export const parameters = {}; and export const decorators = []; in your .storybook/preview.js. Addon authors similarly should use such an export in a preview entry file (see Preview entries).
  * */
import React, { useEffect, useState } from 'react';
import { action } from '@storybook/addon-actions';
import { Provider } from 'react-redux';
import configureStore from '../ui/store/store';
import '../ui/css/index.scss';
import localeList from '../app/_locales/index.json';
import * as allLocales from './locales';
import { I18nProvider, LegacyI18nProvider } from './i18n';
import MetaMetricsProviderStorybook from './metametrics';
import testData from './test-data.js';
import { Router } from 'react-router-dom';
import { createBrowserHistory } from 'history';
import { setBackgroundConnection } from '../ui/store/background-connection';
import MetaMaskStorybookTheme from './metamask-storybook-theme';
import { addons } from '@storybook/addons';

export const parameters = {
  backgrounds: {
    default: 'default',
    values: [
      { name: 'default', value: 'var(--color-background-default)' },
      { name: 'alternative', value: 'var(--color-background-alternative)' },
    ],
  },
  docs: {
    theme: MetaMaskStorybookTheme,
  },
  options: {
    storySort: {
      order: [
        'Getting Started',
        'Foundations',
        ['Color', 'Shadow', 'Breakpoints'],
        'Components',
        ['UI', 'App', 'Component Library'],
        'Pages',
      ],
    },
  },
  controls: {
    expanded: true,
  },
};

export const globalTypes = {
  locale: {
    name: 'Locale',
    description: 'internationalization locale',
    defaultValue: 'en',
    toolbar: {
      icon: 'globe',
      items: localeList.map(({ code, name }) => {
        return { value: code, right: code, title: name };
      }),
    },
  },
};

export const getNewState = (state, props) => {
  return Object.assign(state, props);
};

export const store = configureStore(testData);
const history = createBrowserHistory();
const proxiedBackground = new Proxy(
  {},
  {
    get(_, method) {
      return function () {
        action(`Background call: ${method}`)();
        return new Promise(() => {});
      };
    },
  },
);
setBackgroundConnection(proxiedBackground);

const metamaskDecorator = (story, context) => {
  const [isDark, setDark] = useState(false);
  const channel = addons.getChannel();
  const currentLocale = context.globals.locale;
  const current = allLocales[currentLocale];

  useEffect(() => {
    channel.on('DARK_MODE', setDark);
    return () => channel.off('DARK_MODE', setDark);
  }, [channel, setDark]);

  useEffect(() => {
    const currentTheme = document.documentElement.getAttribute('data-theme');

    if (!currentTheme)
      document.documentElement.setAttribute('data-theme', 'light');

    if (currentTheme === 'light' && isDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else if (currentTheme === 'dark' && !isDark) {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, [isDark]);

  return (
    <Provider store={store}>
      <Router history={history}>
        <MetaMetricsProviderStorybook>
          <I18nProvider
            currentLocale={currentLocale}
            current={current}
            en={allLocales.en}
          >
            <LegacyI18nProvider>{story()}</LegacyI18nProvider>
          </I18nProvider>
        </MetaMetricsProviderStorybook>
      </Router>
    </Provider>
  );
};

export const decorators = [
  metamaskDecorator,
];
