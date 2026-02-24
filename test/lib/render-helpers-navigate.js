/* eslint-disable no-unused-vars -- ESLint is confused here */
/* global jest */
import React, { useMemo, useState } from 'react';
import { Provider } from 'react-redux';
import { render } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import { userEvent } from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PropTypes from 'prop-types';
import { noop } from 'lodash';
import configureStore from '../../ui/store/store';
import { I18nContext, LegacyI18nProvider } from '../../ui/contexts/i18n';
import {
  MetaMetricsContext,
  LegacyMetaMetricsProvider,
} from '../../ui/contexts/metametrics';
import { getMessage } from '../../ui/helpers/utils/i18n-helper';
import * as enLocaleMessages from '../../app/_locales/en/messages.json';
import { RouteMessengerContext } from '../../ui/contexts/route-messenger';

// Re-export en messages for tests that need direct access
export const en = enLocaleMessages;

// Mock MetaMetrics context for tests
const createMockMetaMetricsContext = (
  getMockTrackEvent = () => jest.fn().mockResolvedValue(undefined),
) => ({
  trackEvent: getMockTrackEvent(),
  bufferedTrace: jest.fn().mockResolvedValue(undefined),
  bufferedEndTrace: jest.fn().mockResolvedValue(undefined),
  onboardingParentContext: { current: null },
});

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

/**
 * Creates a wrapper component with configurable providers for testing.
 *
 * By default, all providers are enabled. Pass `false` to disable a provider,
 * or pass an object to customize its configuration.
 *
 * @param {object} options - Configuration options
 * @param {object} [options.store] - Redux store. If provided, wraps with Provider.
 * @param {object|false} [options.router] - MemoryRouter config. Default: { pathname: '/' }
 * @param {object|false} [options.i18n] - I18n provider config. Default: enabled with 'en' locale
 * @param {object|false} [options.metaMetrics] - MetaMetrics provider config. Default: enabled with default trackEvent mock
 * @param {object|false} [options.queryClient] - QueryClient provider config. Default: enabled using default QueryClient
 * @param {object|false} [options.messenger] - Route messenger. Default: false (disabled)
 * @returns {Function} Wrapper component
 */
export function createProviderWrapper({
  store,
  router = {},
  i18n = {},
  metaMetrics = {},
  queryClient: queryClientOption = {},
  messenger = false,
} = {}) {
  const Wrapper = ({ children }) => {
    let content = children;

    //========
    // We need a way to render a component or hook that uses `useMessenger`.
    // With these changes, `messenger` can be passed to `renderWithProvider`
    // or `renderHookWithProvider`.
    //========
    // Messenger (innermost)
    if (messenger) {
      content = (
        <RouteMessengerContext.Provider value={messenger}>
          {content}
        </RouteMessengerContext.Provider>
      );
    }

    // QueryClient
    if (queryClientOption !== false) {
      const queryClient =
        queryClientOption.queryClient ??
        new QueryClient({
          defaultOptions: { queries: { retry: false } },
        });
      content = (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    }

    // MetaMetrics
    if (metaMetrics !== false) {
      const getMockTrackEvent =
        metaMetrics.getMockTrackEvent ||
        (() => jest.fn().mockResolvedValue(undefined));
      const mockMetaMetricsContext =
        createMockMetaMetricsContext(getMockTrackEvent);
      content = (
        <MetaMetricsContext.Provider value={mockMetaMetricsContext}>
          <LegacyMetaMetricsProvider>{content}</LegacyMetaMetricsProvider>
        </MetaMetricsContext.Provider>
      );
    }

    // I18n
    if (i18n !== false) {
      const currentLocale = i18n.currentLocale || 'en';
      const currentMessages = i18n.current || en;
      const enMessages = i18n.en || en;
      content = (
        <I18nProvider
          currentLocale={currentLocale}
          current={currentMessages}
          en={enMessages}
        >
          <LegacyI18nProvider>{content}</LegacyI18nProvider>
        </I18nProvider>
      );
    }

    // Router
    if (router !== false) {
      const pathname = router.pathname || '/';
      content = (
        <MemoryRouter initialEntries={[pathname]}>{content}</MemoryRouter>
      );
    }

    // Redux store (outermost)
    if (store) {
      content = <Provider store={store}>{content}</Provider>;
    }

    return content;
  };

  Wrapper.propTypes = {
    children: PropTypes.node,
  };
  return Wrapper;
}

/**
 * Renders a component with providers for testing.
 *
 * Can be called two ways:
 * 1. Legacy: renderWithProvider(component, store, pathname, renderer)
 * 2. Options: renderWithProvider(component, { store, router, i18n, metaMetrics, renderer })
 *
 * @param {ReactElement} component - The component to render
 * @param {object|Store} storeOrOptions - Either a Redux store (legacy) or options object
 * @param {string} [pathname] - Pathname for router (legacy only)
 * @param {Function} [renderer] - Custom renderer function (legacy only)
 * @returns {RenderResult} The render result
 */
export function renderWithProvider(
  component,
  storeOrOptions,
  pathname = '/',
  renderer = render,
) {
  // Detect if using options bag or legacy positional arguments
  // A Redux store has getState/dispatch, an options bag does not
  const isOptionsObject =
    storeOrOptions &&
    typeof storeOrOptions === 'object' &&
    !('getState' in storeOrOptions);

  if (isOptionsObject) {
    const { renderer: optionsRenderer = render, ...providerOptions } =
      storeOrOptions;
    // Default router.pathname to '/' if router is provided without pathname
    if (
      providerOptions.router &&
      providerOptions.router.pathname === undefined
    ) {
      providerOptions.router = { ...providerOptions.router, pathname: '/' };
    } else if (providerOptions.router === undefined) {
      providerOptions.router = { pathname: '/' };
    }
    const wrapper = createProviderWrapper(providerOptions);
    return optionsRenderer(component, { wrapper });
  }

  // Legacy positional arguments
  const wrapper = createProviderWrapper({
    store: storeOrOptions,
    router: { pathname },
  });
  return renderer(component, { wrapper });
}

/**
 * Renders a hook with providers for testing.
 *
 * Can be called two ways:
 * 1. Legacy: renderHookWithProvider(hook, state, pathname, Container, getMockTrackEvent)
 * 2. Options: renderHookWithProvider(hook, { state, router, metaMetrics, Container, messenger })
 *
 * @param {Function} hook - The hook to render
 * @param {object} stateOrOptions - Either a state object (legacy) or options object
 * @param {string} [pathname] - Pathname for router (legacy only)
 * @param {React.ComponentType} [Container] - Container component (legacy only)
 * @param {Function} [getMockTrackEvent] - Mock track event function (legacy only)
 * @returns {RenderHookResult} The render hook result with store
 */
export function renderHookWithProvider(
  hook,
  stateOrOptions,
  pathname = '/',
  Container,
  getMockTrackEvent = () => jest.fn().mockResolvedValue(undefined),
) {
  // Detect if using options bag or legacy positional arguments
  // An options bag will have known keys like 'state', 'router', 'metaMetrics', etc.
  const isOptionsObject =
    stateOrOptions &&
    typeof stateOrOptions === 'object' &&
    ('state' in stateOrOptions ||
      'router' in stateOrOptions ||
      'metaMetrics' in stateOrOptions ||
      'Container' in stateOrOptions ||
      'messenger' in stateOrOptions ||
      'i18n' in stateOrOptions);

  if (isOptionsObject) {
    const {
      state: optionsState,
      router = {},
      metaMetrics = {},
      Container: OptionsContainer,
      ...restProviderOptions
    } = stateOrOptions;

    const store = optionsState ? configureStore(optionsState) : undefined;

    // Default router.pathname to '/' if not provided
    const routerWithPathname =
      router.pathname === undefined ? { ...router, pathname: '/' } : router;

    // Default metaMetrics.getMockTrackEvent if not provided
    const metaMetricsWithDefault =
      metaMetrics.getMockTrackEvent === undefined
        ? {
            ...metaMetrics,
            getMockTrackEvent: () => jest.fn().mockResolvedValue(undefined),
          }
        : metaMetrics;

    const ProviderWrapper = createProviderWrapper({
      store,
      router: routerWithPathname,
      metaMetrics: metaMetricsWithDefault,
      ...restProviderOptions,
    });

    const wrapper = OptionsContainer
      ? ({ children }) => (
          <ProviderWrapper>
            <OptionsContainer>{children}</OptionsContainer>
          </ProviderWrapper>
        )
      : ProviderWrapper;

    const hookResult = renderHook(hook, { wrapper });

    return {
      ...hookResult,
      store,
    };
  }

  // Legacy positional arguments
  const store = stateOrOptions ? configureStore(stateOrOptions) : undefined;

  const ProviderWrapper = createProviderWrapper({
    store,
    router: { pathname },
    metaMetrics: { getMockTrackEvent },
  });

  const wrapper = Container
    ? ({ children }) => (
        <ProviderWrapper>
          <Container>{children}</Container>
        </ProviderWrapper>
      )
    : ProviderWrapper;

  const hookResult = renderHook(hook, { wrapper });

  return {
    ...hookResult,
    store,
  };
}

/**
 * Renders a hook with a provider and optional container.
 *
 * @template {(...args: any) => any} Hook
 * @template {Parameters<Hook>} HookParams
 * @template {ReturnType<Hook>} HookReturn
 * @template {import('@testing-library/react-hooks').RenderHookResult<HookParams, HookReturn>} RenderHookResult
 * @param {Hook} hook - The hook to be rendered.
 * @param [state] - The initial state for the store.
 * @param [pathname] - The initial pathname for the history.
 * @param [Container] - An optional container component.
 * @param {() => () => Promise<void>} [getMockTrackEvent] - A placeholder function for tracking a MetaMetrics event.
 * @returns {RenderHookResult & { history: History }} The result of the rendered hook and the history object.
 */
export const renderHookWithProviderTyped = (
  hook,
  state,
  pathname = '/',
  Container,
  getMockTrackEvent = () => jest.fn().mockResolvedValue(undefined),
) =>
  renderHookWithProvider(hook, state, pathname, Container, getMockTrackEvent);

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
 * Note: This function dynamically imports Root and setupInitialStore to avoid
 * triggering the full UI import chain during test setup, which can interfere
 * with Jest mocks.
 *
 * @param {*} extendedRenderOptions
 * @param {*} extendedRenderOptions.preloadedState - The initial state used to initialize the redux store. For integration tests we rely on a real store instance following the redux recommendations - https://redux.js.org/usage/writing-tests#guiding-principles
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

  // Dynamically import to avoid triggering full UI import chain during test setup
  const { setupInitialStore, connectToBackground } = await import('../../ui');
  const { default: Root } = await import('../../ui/pages');

  connectToBackground(backgroundConnection, noop);

  const store = await setupInitialStore(preloadedState, activeTab);

  return {
    ...render(<Root store={store} />, { ...renderOptions }),
  };
}
