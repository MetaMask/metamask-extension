/*
  * The addParameters and addDecorator APIs to add global decorators and parameters, exported by the various frameworks (e.g. @storybook/react) and @storybook/client were deprecated in 6.0 and have been removed in 7.0.

Instead, use export const parameters = {}; and export const decorators = []; in your .storybook/preview.js. Addon authors similarly should use such an export in a preview entry file (see Preview entries).
  * */
import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import configureStore from '../ui/store/store';
import '../ui/css/index.scss';
import localeList from '../app/_locales/index.json';
import * as allLocalesModule1 from '../app/_locales/am/messages.json';
import * as allLocalesModule2 from '../app/_locales/ar/messages.json';
import * as allLocalesModule3 from '../app/_locales/bg/messages.json';
import * as allLocalesModule4 from '../app/_locales/bn/messages.json';
import * as allLocalesModule5 from '../app/_locales/ca/messages.json';
import * as allLocalesModule6 from '../app/_locales/cs/messages.json';
import * as allLocalesModule7 from '../app/_locales/da/messages.json';
import * as allLocalesModule8 from '../app/_locales/de/messages.json';
import * as allLocalesModule9 from '../app/_locales/el/messages.json';
import * as allLocalesModule10 from '../app/_locales/en/messages.json';
import * as allLocalesModule11 from '../app/_locales/es_419/messages.json';
import * as allLocalesModule12 from '../app/_locales/et/messages.json';
import * as allLocalesModule13 from '../app/_locales/fa/messages.json';
import * as allLocalesModule14 from '../app/_locales/fi/messages.json';
import * as allLocalesModule15 from '../app/_locales/fr/messages.json';
import * as allLocalesModule16 from '../app/_locales/gu/messages.json';
import * as allLocalesModule17 from '../app/_locales/he/messages.json';
import * as allLocalesModule18 from '../app/_locales/hi/messages.json';
import * as allLocalesModule19 from '../app/_locales/hn/messages.json';
import * as allLocalesModule20 from '../app/_locales/hr/messages.json';
import * as allLocalesModule21 from '../app/_locales/ht/messages.json';
import * as allLocalesModule22 from '../app/_locales/hu/messages.json';
import * as allLocalesModule23 from '../app/_locales/id/messages.json';
import * as allLocalesModule24 from '../app/_locales/it/messages.json';
import * as allLocalesModule25 from '../app/_locales/ja/messages.json';
import * as allLocalesModule26 from '../app/_locales/kn/messages.json';
import * as allLocalesModule27 from '../app/_locales/ko/messages.json';
import * as allLocalesModule28 from '../app/_locales/lt/messages.json';
import * as allLocalesModule29 from '../app/_locales/lv/messages.json';
import * as allLocalesModule30 from '../app/_locales/ml/messages.json';
import * as allLocalesModule31 from '../app/_locales/mr/messages.json';
import * as allLocalesModule32 from '../app/_locales/ms/messages.json';
import * as allLocalesModule33 from '../app/_locales/nl/messages.json';
import * as allLocalesModule34 from '../app/_locales/no/messages.json';
import * as allLocalesModule35 from '../app/_locales/pl/messages.json';
import * as allLocalesModule36 from '../app/_locales/pt/messages.json';
import * as allLocalesModule37 from '../app/_locales/pt_BR/messages.json';
import * as allLocalesModule38 from '../app/_locales/pt_PT/messages.json';
import * as allLocalesModule39 from '../app/_locales/ro/messages.json';
import * as allLocalesModule40 from '../app/_locales/ru/messages.json';
import * as allLocalesModule41 from '../app/_locales/sk/messages.json';
import * as allLocalesModule42 from '../app/_locales/sl/messages.json';
import * as allLocalesModule43 from '../app/_locales/sr/messages.json';
import * as allLocalesModule44 from '../app/_locales/sv/messages.json';
import * as allLocalesModule45 from '../app/_locales/sw/messages.json';
import * as allLocalesModule46 from '../app/_locales/ta/messages.json';
import * as allLocalesModule47 from '../app/_locales/te/messages.json';
import * as allLocalesModule48 from '../app/_locales/th/messages.json';
import * as allLocalesModule49 from '../app/_locales/tl/messages.json';
import * as allLocalesModule50 from '../app/_locales/tr/messages.json';
import * as allLocalesModule51 from '../app/_locales/uk/messages.json';
import * as allLocalesModule52 from '../app/_locales/vi/messages.json';
import * as allLocalesModule53 from '../app/_locales/zh_CN/messages.json';
import * as allLocalesModule54 from '../app/_locales/zh_TW/messages.json';
const allLocales = {
  get am() {
    return allLocalesModule1;
  },
  get ar() {
    return allLocalesModule2;
  },
  get bg() {
    return allLocalesModule3;
  },
  get bn() {
    return allLocalesModule4;
  },
  get ca() {
    return allLocalesModule5;
  },
  get cs() {
    return allLocalesModule6;
  },
  get da() {
    return allLocalesModule7;
  },
  get de() {
    return allLocalesModule8;
  },
  get el() {
    return allLocalesModule9;
  },
  get en() {
    return allLocalesModule10;
  },
  get es_419() {
    return allLocalesModule11;
  },
  get et() {
    return allLocalesModule12;
  },
  get fa() {
    return allLocalesModule13;
  },
  get fi() {
    return allLocalesModule14;
  },
  get fr() {
    return allLocalesModule15;
  },
  get gu() {
    return allLocalesModule16;
  },
  get he() {
    return allLocalesModule17;
  },
  get hi() {
    return allLocalesModule18;
  },
  get hn() {
    return allLocalesModule19;
  },
  get hr() {
    return allLocalesModule20;
  },
  get ht() {
    return allLocalesModule21;
  },
  get hu() {
    return allLocalesModule22;
  },
  get id() {
    return allLocalesModule23;
  },
  get it() {
    return allLocalesModule24;
  },
  get ja() {
    return allLocalesModule25;
  },
  get kn() {
    return allLocalesModule26;
  },
  get ko() {
    return allLocalesModule27;
  },
  get lt() {
    return allLocalesModule28;
  },
  get lv() {
    return allLocalesModule29;
  },
  get ml() {
    return allLocalesModule30;
  },
  get mr() {
    return allLocalesModule31;
  },
  get ms() {
    return allLocalesModule32;
  },
  get nl() {
    return allLocalesModule33;
  },
  get no() {
    return allLocalesModule34;
  },
  get pl() {
    return allLocalesModule35;
  },
  get pt() {
    return allLocalesModule36;
  },
  get pt_BR() {
    return allLocalesModule37;
  },
  get pt_PT() {
    return allLocalesModule38;
  },
  get ro() {
    return allLocalesModule39;
  },
  get ru() {
    return allLocalesModule40;
  },
  get sk() {
    return allLocalesModule41;
  },
  get sl() {
    return allLocalesModule42;
  },
  get sr() {
    return allLocalesModule43;
  },
  get sv() {
    return allLocalesModule44;
  },
  get sw() {
    return allLocalesModule45;
  },
  get ta() {
    return allLocalesModule46;
  },
  get te() {
    return allLocalesModule47;
  },
  get th() {
    return allLocalesModule48;
  },
  get tl() {
    return allLocalesModule49;
  },
  get tr() {
    return allLocalesModule50;
  },
  get uk() {
    return allLocalesModule51;
  },
  get vi() {
    return allLocalesModule52;
  },
  get zh_CN() {
    return allLocalesModule53;
  },
  get zh_TW() {
    return allLocalesModule54;
  },
};
import { I18nProvider } from './i18n';
import testData from './test-data.js';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { setBackgroundConnection } from '../ui/store/background-connection';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AlertMetricsProvider } from '../ui/components/app/alert-system/contexts/alertMetricsContext';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

/* @ts-expect-error: Avoids error from window property not existing */
window.metamaskFeatureFlags = {};

export const parameters = {
  backgrounds: {
    options: {
      default: { name: 'default', value: 'var(--color-background-default)' },
      alternative: {
        name: 'alternative',
        value: 'var(--color-background-alternative)',
      },
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
const proxiedBackground = new Proxy(
  {},
  {
    get(_, method) {
      return function () {
        // No-op function for background calls in Storybook
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

  // Get initial entries from story parameters, default to ['/'] if not provided
  const initialEntries = context.parameters?.initialEntries || ['/'];
  const path = context.parameters?.path || '*';

  // Wrap story in a component to defer execution until route matches
  const StoryComponent = () => story();

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={initialEntries}>
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
              en={allLocalesModule10}
            >
              <Routes>
                <Route path={path} element={<StoryComponent />} />
              </Routes>
            </I18nProvider>
          </AlertMetricsProvider>
        </MemoryRouter>
      </QueryClientProvider>
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

export const initialGlobals = {
  backgrounds: {
    value: 'default',
  },
};
