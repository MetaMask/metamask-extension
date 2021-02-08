import React, { useEffect } from 'react';
import { addDecorator, addParameters } from '@storybook/react';
import { useGlobals } from '@storybook/api';
import { withKnobs } from '@storybook/addon-knobs';
import { Provider } from 'react-redux';
import configureStore from '../ui/app/store/store';
import '../ui/app/css/index.scss';
import localeList from '../app/_locales/index.json';
import * as allLocales from './locales';
import { I18nProvider, LegacyI18nProvider } from './i18n';
import testData from './test-data.js'

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

const store = configureStore(testData)

const metamaskDecorator = (story, context) => {
  const currentLocale = context.globals.locale;
  const current = allLocales[currentLocale];
  return (
    <Provider store={store}>
      <I18nProvider
        currentLocale={currentLocale}
        current={current}
        en={allLocales.en}
      >
        <LegacyI18nProvider>
          <div style={styles}>{story()}</div>
        </LegacyI18nProvider>
      </I18nProvider>
    </Provider>
  );
};

addDecorator(withKnobs);
addDecorator(metamaskDecorator);
