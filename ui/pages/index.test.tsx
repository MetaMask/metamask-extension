import React from 'react';
import { render } from '@testing-library/react';
import type { Store } from 'redux';
import type { UIMessenger } from '../messengers/ui-messenger';
import Index from '.';

const mockRouterProvider = jest.fn(() => null);

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  RouterProvider: () => mockRouterProvider(),
  // The real HashRouter logs React Router future-flag warnings on mount.
  HashRouter: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('./routes', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: () => null,
  routeConfig: [],
}));

// The error fallback wraps the page in these providers, which need a real store.
jest.mock('../contexts/metametrics', () => ({
  MetaMetricsProvider: ({ children }: { children: React.ReactNode }) =>
    children,
}));

jest.mock('../contexts/i18n', () => ({
  I18nProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('./error-page/error-page.component', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: ({ error }: { error: Error }) => (
    <div data-testid="error-page">{error.message}</div>
  ),
}));

jest.mock('../../shared/lib/sentry', () => ({
  ...jest.requireActual('../../shared/lib/sentry'),
  captureException: jest.fn(),
}));

const store = {
  getState: () => ({}),
  subscribe: () => () => undefined,
  dispatch: jest.fn(),
} as unknown as Store;

const uiMessenger = {} as UIMessenger;

describe('Index', () => {
  beforeEach(() => {
    mockRouterProvider.mockReset();
    mockRouterProvider.mockReturnValue(null);
  });

  it('renders the app inside the store provider', () => {
    expect(() =>
      render(<Index store={store} uiMessenger={uiMessenger} />),
    ).not.toThrow();
  });

  it('renders the error page when the app throws', () => {
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    mockRouterProvider.mockImplementation(() => {
      throw new Error('boom');
    });
    const { getByTestId } = render(
      <Index store={store} uiMessenger={uiMessenger} />,
    );

    expect(getByTestId('error-page')).toHaveTextContent('boom');

    consoleError.mockRestore();
  });
});
