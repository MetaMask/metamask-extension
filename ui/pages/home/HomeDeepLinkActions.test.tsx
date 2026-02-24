import React from 'react';
import { render } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import mockState from '../../../test/data/mock-state.json';
import configureStore from '../../store/store';
import { HomeQueryParams } from '../../../shared/lib/deep-links/routes/home';
import { toggleNetworkMenu } from '../../store/actions';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import {
  HomeDeepLinkActions,
  useHomeDeepLinkEffects,
} from './HomeDeepLinkActions';

jest.mock('../../store/actions', () => ({
  toggleNetworkMenu: jest
    .fn()
    .mockReturnValue({ type: 'MOCK_TOGGLE_NETWORK_MENU' }),
}));

const mockToggleNetworkMenu = jest.mocked(toggleNetworkMenu);

const createWrapper = (options: {
  pathname: string;
  search: string;
  isNetworkMenuOpen: boolean;
}) => {
  const { pathname, search, isNetworkMenuOpen } = options;

  const store = configureStore({
    metamask: {
      ...mockState.metamask,
    },
    appState: {
      ...mockState.appState,
      isNetworkMenuOpen,
    },
  });

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <Provider store={store}>
      <MemoryRouter
        initialEntries={[`${pathname}${search}`]}
        // TODO: this is to avoid warnings in test, we can remove this post react-router v7 upgrade
        // eslint-disable-next-line @typescript-eslint/naming-convention
        future={{ v7_startTransition: false, v7_relativeSplatPath: false }}
      >
        {children}
      </MemoryRouter>
    </Provider>
  );

  return { Wrapper, store };
};

type OpenNetworkSelectorDeepLinkTestCase = {
  testName: string;
  searchParams: URLSearchParams;
  inputOptsOverrides?: Partial<{
    pathname: string;
    isNetworkMenuOpen: boolean;
  }>;
  expectedAction: () => void;
};

const openNetworkSelectorDeepLinkCases: OpenNetworkSelectorDeepLinkTestCase[] =
  [
    {
      testName:
        'opens network selector when openNetworkSelector param is "true"',
      searchParams: new URLSearchParams({
        [HomeQueryParams.OpenNetworkSelector]: 'true',
      }),
      expectedAction: () => expect(mockToggleNetworkMenu).toHaveBeenCalled(),
    },
    {
      testName:
        'does not open network selector when openNetworkSelector param is "false"',
      searchParams: new URLSearchParams({
        [HomeQueryParams.OpenNetworkSelector]: 'false',
      }),
      expectedAction: () =>
        expect(mockToggleNetworkMenu).not.toHaveBeenCalled(),
    },
    {
      testName: 'performs no action when no deep link params are provided',
      searchParams: new URLSearchParams(),
      expectedAction: () =>
        expect(mockToggleNetworkMenu).not.toHaveBeenCalled(),
    },
    {
      testName: 'does not toggle network menu when it is already open',
      searchParams: new URLSearchParams({
        [HomeQueryParams.OpenNetworkSelector]: 'true',
      }),
      inputOptsOverrides: {
        isNetworkMenuOpen: true,
      },
      expectedAction: () =>
        expect(mockToggleNetworkMenu).not.toHaveBeenCalled(),
    },
    {
      testName: 'does not handle deep links when not on home route',
      searchParams: new URLSearchParams({
        [HomeQueryParams.OpenNetworkSelector]: 'true',
      }),
      inputOptsOverrides: {
        pathname: '/some-other-route',
      },
      expectedAction: () =>
        expect(mockToggleNetworkMenu).not.toHaveBeenCalled(),
    },
  ];

describe('useHomeDeepLinkEffects', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // @ts-expect-error This is missing from the Mocha type definitions
  it.each(openNetworkSelectorDeepLinkCases)(
    'openNetworkSelectorDeepLink: $testName',
    ({
      searchParams,
      inputOptsOverrides,
      expectedAction,
    }: OpenNetworkSelectorDeepLinkTestCase) => {
      const search = searchParams.size > 0 ? `?${searchParams.toString()}` : '';

      const happyPathOpts = {
        pathname: DEFAULT_ROUTE,
        isNetworkMenuOpen: false,
      };

      const inputOpts = {
        ...happyPathOpts,
        ...inputOptsOverrides,
      };

      const { Wrapper } = createWrapper({
        pathname: inputOpts.pathname,
        search,
        isNetworkMenuOpen: inputOpts.isNetworkMenuOpen,
      });

      renderHook(() => useHomeDeepLinkEffects(), { wrapper: Wrapper });

      expectedAction();
    },
  );
});

describe('HomeDeepLinkActions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // @ts-expect-error This is missing from the Mocha type definitions
  it.each(openNetworkSelectorDeepLinkCases)(
    'openNetworkSelectorDeepLink: $testName',
    ({
      searchParams,
      inputOptsOverrides,
      expectedAction,
    }: OpenNetworkSelectorDeepLinkTestCase) => {
      const search = searchParams.size > 0 ? `?${searchParams.toString()}` : '';

      const happyPathOpts = {
        pathname: DEFAULT_ROUTE,
        isNetworkMenuOpen: false,
      };

      const inputOpts = {
        ...happyPathOpts,
        ...inputOptsOverrides,
      };

      const { Wrapper } = createWrapper({
        pathname: inputOpts.pathname,
        search,
        isNetworkMenuOpen: inputOpts.isNetworkMenuOpen,
      });

      render(<HomeDeepLinkActions />, { wrapper: Wrapper });

      expectedAction();
    },
  );
});
