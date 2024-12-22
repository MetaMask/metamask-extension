/*
  * The addParameters and addDecorator APIs to add global decorators and parameters, exported by the various frameworks (e.g. @storybook/react) and @storybook/client were deprecated in 6.0 and have been removed in 7.0.

Instead, use export const parameters = {}; and export const decorators = []; in your .storybook/preview.js. Addon authors similarly should use such an export in a preview entry file (see Preview entries).
  * */
import React, { useEffect } from 'react';
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
import { MemoryRouter } from 'react-router-dom';
import { setBackgroundConnection } from '../ui/store/background-connection';
import { metamaskStorybookTheme } from './metamask-storybook-theme';
import { DocsContainer } from '@storybook/addon-docs';
import { themes } from '@storybook/theming';
import { AlertMetricsProvider } from '../ui/components/app/alert-system/contexts/alertMetricsContext';

// eslint-disable-next-line
/* @ts-expect-error: Avoids error from window property not existing */
window.metamaskFeatureFlags = {};

export const parameters = {
  backgrounds: {
    default: 'default',
    values: [
      { name: 'default', value: 'var(--color-background-default)' },
      { name: 'alternative', value: 'var(--color-background-alternative)' },
    ],
  },
  docs: {
    container: (context) => {
      const theme = context?.globals?.theme || 'both';
      const systemPrefersDark = window.matchMedia(
        '(prefers-color-scheme: dark)',
      ).matches;

      const isDark =
        theme === 'dark' || (theme === 'both' && systemPrefersDark);

      const props = {
        ...context,
        theme: isDark
          ? { ...themes.dark, ...metamaskStorybookTheme }
          : { ...themes.light, ...metamaskStorybookTheme },
        'data-theme': isDark ? 'dark' : 'light',
      };

      return (
        <div data-theme={isDark ? 'dark' : 'light'}>
          <DocsContainer {...props} />
        </div>
      );
    },
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
  theme: {
    name: 'Color Theme',
    description: 'The color theme for the component',
    defaultValue: 'both',
    toolbar: {
      items: [
        { value: 'light', title: 'Light', icon: 'sun' },
        { value: 'dark', title: 'Dark', icon: 'moon' },
        { value: 'both', title: 'Light/Dark', icon: 'paintbrush' },
      ],
      dynamicTitle: true,
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
  const { theme } = context.globals;
  const systemPrefersDark = window.matchMedia(
    '(prefers-color-scheme: dark)',
  ).matches;

  const isDark = theme === 'dark' || (theme === 'both' && systemPrefersDark);

  const currentLocale = context.globals.locale;
  const current = allLocales[currentLocale];

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
      <MemoryRouter>
        <MetaMetricsProviderStorybook>
          <AlertMetricsProvider
            metrics={{
              trackAlertActionClicked: () => undefined,
              trackAlertRender: () => undefined,
              trackInlineAlertClicked: () => undefined,
            }}
          >
            <I18nProvider
              currentLocale={currentLocale}
              current={current}
              en={allLocales.en}
            >
              <LegacyI18nProvider>{story()}</LegacyI18nProvider>
            </I18nProvider>
          </AlertMetricsProvider>
        </MetaMetricsProviderStorybook>
      </MemoryRouter>
    </Provider>
  );
};

// Add the withColorScheme decorator
const withColorScheme = (Story, context) => {
  const { theme } = context.globals;
  const systemPrefersDark = window.matchMedia(
    '(prefers-color-scheme: dark)',
  ).matches;

  const isDark = theme === 'dark' || (theme === 'both' && systemPrefersDark);

  function Wrapper(props) {
    return (
      <div
        {...props}
        style={{
          display: 'flex',
          padding: '1rem',
          backgroundColor: 'var(--color-background-default)',
          color: 'var(--color-text-default)',
        }}
      />
    );
  }

  if (theme === 'light') {
    return (
      <Wrapper data-theme="light">
        <Story />
      </Wrapper>
    );
  }

  if (theme === 'dark') {
    return (
      <Wrapper data-theme="dark">
        <Story />
      </Wrapper>
    );
  }

  return (
    <div data-theme={isDark ? 'dark' : 'light'}>
      <Wrapper data-theme="light">
        <Story />
      </Wrapper>
      <Wrapper data-theme="dark">
        <Story />
      </Wrapper>
    </div>
  );
};

export const decorators = [metamaskDecorator, withColorScheme];
