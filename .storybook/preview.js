import React, { useEffect } from 'react';
import { addDecorator, addParameters } from '@storybook/react';
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
import { _setBackgroundConnection } from '../ui/store/actions';
import MetaMaskStorybookTheme from './metamask-storybook-theme';

addParameters({
  layout: 'fullscreen',
  backgrounds: { disable: true },
  docs: {
    theme: MetaMaskStorybookTheme,
  },
  options: {
    storySort: {
      order: [
        'Getting Started',
        'Design Tokens',
        'Components',
        ['UI', 'App'],
        'Pages',
      ],
    },
  },
});

export const globalTypes = {
  theme: {
    name: 'Theme',
    description: 'Global theme for components',
    defaultValue: 'light',
    toolbar: {
      icon: 'photo',
      // array of plain string values or MenuItem shape (see below)
      items: ['light', 'dark'],
    },
  },
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
_setBackgroundConnection(proxiedBackground);

const metamaskDecorator = (story, context) => {
  const theme = context.globals.theme;
  const currentLocale = context.globals.locale;
  const current = allLocales[currentLocale];
  console.log('theme', theme);
  return (
    <Provider store={store}>
      <Router history={history}>
        <MetaMetricsProviderStorybook>
          <I18nProvider
            currentLocale={currentLocale}
            current={current}
            en={allLocales.en}
          >
            <LegacyI18nProvider>
              <div
                style={{
                  padding: 16,
                  backgroundColor: 'var(--color-background-default)',
                }}
                data-theme={theme === 'dark' ? 'dark' : ''}
              >
                {story()}
              </div>
            </LegacyI18nProvider>
          </I18nProvider>
        </MetaMetricsProviderStorybook>
      </Router>
    </Provider>
  );
};

addDecorator(metamaskDecorator);
