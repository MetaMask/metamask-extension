import React from 'react';
import { it } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import configureStore from '../store/store';
import {
  ACTIVITY_ROUTE,
  DEFAULT_ROUTE,
  SETTINGS_ROUTE,
} from '../helpers/constants/routes';
import { useAppLayout } from '../contexts/app-layout';
import { useFullScreenDesign } from '../hooks/useFullScreenDesign';
import { RootLayout } from './root-layout';

jest.mock('../hooks/useFullScreenDesign');

const mockUseFullScreenDesign = jest.mocked(useFullScreenDesign);

const AppLayoutProbe = () => {
  const { isWideLayout } = useAppLayout();
  return <div data-testid="child" data-wide-layout={String(isWideLayout)} />;
};

const renderRootLayout = (pathname: string) => {
  const router = createMemoryRouter(
    [
      {
        element: <RootLayout />,
        children: [{ path: '*', element: <AppLayoutProbe /> }],
      },
    ],
    { initialEntries: [pathname] },
  );
  render(
    <Provider store={configureStore({})}>
      <RouterProvider
        router={router}
        future={{
          // eslint-disable-next-line @typescript-eslint/naming-convention
          v7_startTransition: true,
        }}
      />
    </Provider>,
  );

  return screen.getByTestId('child').parentElement as HTMLElement;
};

const columnWidthClass = 'max-w-[var(--width-md)]';
const maxWidthClass = 'max-w-[var(--width-max)]';

describe('RootLayout', () => {
  beforeEach(() => {
    mockUseFullScreenDesign.mockReturnValue(false);
  });

  it.each([DEFAULT_ROUTE, ACTIVITY_ROUTE, SETTINGS_ROUTE])(
    'caps the width of %s when the fullscreen design is off',
    (pathname) => {
      const layout = renderRootLayout(pathname);

      expect(layout).toHaveClass(columnWidthClass);
    },
  );

  it('provides the classic layout to its routes when the fullscreen design is off', () => {
    const layout = renderRootLayout(DEFAULT_ROUTE);

    expect(screen.getByTestId('child')).toHaveAttribute(
      'data-wide-layout',
      'false',
    );
    expect(layout).not.toHaveAttribute('data-wide-layout');
  });

  describe('in the wide layout design', () => {
    beforeEach(() => {
      mockUseFullScreenDesign.mockReturnValue(true);
    });

    it('provides the wide layout to its routes', () => {
      const layout = renderRootLayout(DEFAULT_ROUTE);

      expect(screen.getByTestId('child')).toHaveAttribute(
        'data-wide-layout',
        'true',
      );
      expect(layout).toHaveAttribute('data-wide-layout', 'true');
    });

    it('caps the width of routes that are not main nav routes', () => {
      const layout = renderRootLayout(SETTINGS_ROUTE);

      expect(layout).toHaveClass(columnWidthClass);
    });

    it.each([DEFAULT_ROUTE, ACTIVITY_ROUTE])(
      'uses the full width of the main nav route %s',
      (pathname) => {
        const layout = renderRootLayout(pathname);

        expect(layout).toHaveClass(maxWidthClass);
        expect(layout).not.toHaveClass(columnWidthClass);
      },
    );
  });
});
