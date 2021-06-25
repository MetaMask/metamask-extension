import React, { useEffect } from 'react';
import { addDecorator, addParameters } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { withKnobs } from '@storybook/addon-knobs';
import { Provider } from 'react-redux';
import configureStore from '../ui/store/store';
import '../ui/css/index.scss';
import localeList from '../app/_locales/index.json';
import * as allLocales from './locales';
import { I18nProvider, LegacyI18nProvider } from './i18n';
import MetaMetricsProviderStorybook from './metametrics'
import testData from './test-data.js';
import { Router } from "react-router-dom";
import { createBrowserHistory } from "history";
import { _setBackgroundConnection } from '../ui/store/actions'

addParameters({
  backgrounds: {
    default: 'light',
    values: [
      { name: 'light', value: '#FFFFFF' },
      { name: 'dark', value: '#333333' },
    ],
  },
});

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

const styles = {
  height: '100vh',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
};

export const store = configureStore(testData);
const history = createBrowserHistory();
const proxiedBackground = new Proxy({}, {
    get(_, method) {
      return function() {
        action(`Background call: ${method}`)()
        return new Promise(() => {})
      }
    }
  })
_setBackgroundConnection(proxiedBackground)

const metamaskDecorator = (story, context) => {
  const currentLocale = context.globals.locale;
  const current = allLocales[currentLocale];
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
              <div style={styles}>{story()}</div>
            </LegacyI18nProvider>
          </I18nProvider>
        </MetaMetricsProviderStorybook>
      </Router>
    </Provider>
  );
};

addDecorator(withKnobs);
addDecorator(metamaskDecorator);
