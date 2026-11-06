import React from 'react';
import { it } from '@jest/globals';
import { renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppLayoutProvider } from '../contexts/app-layout';
import {
  ACTIVITY_ROUTE,
  DEFAULT_ROUTE,
  SETTINGS_ROUTE,
} from '../helpers/constants/routes';
import { useMainNavBars } from './useMainNavBars';

const renderUseMainNavBars = (pathname: string, isWideLayout: boolean) =>
  renderHook(() => useMainNavBars(), {
    wrapper: ({ children }) => (
      <MemoryRouter
        initialEntries={[pathname]}
        future={{
          // eslint-disable-next-line @typescript-eslint/naming-convention
          v7_startTransition: true,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          v7_relativeSplatPath: true,
        }}
      >
        <AppLayoutProvider isWideLayout={isWideLayout}>
          {children}
        </AppLayoutProvider>
      </MemoryRouter>
    ),
  }).result.current;

describe('useMainNavBars', () => {
  it.each([DEFAULT_ROUTE, ACTIVITY_ROUTE])(
    'shows the bottom nav on %s outside the wide layout',
    (pathname) => {
      expect(renderUseMainNavBars(pathname, false)).toStrictEqual({
        hasNavBar: true,
        showSideNav: false,
        showBottomNav: true,
      });
    },
  );

  it.each([DEFAULT_ROUTE, ACTIVITY_ROUTE])(
    'shows the side nav on %s in the wide layout',
    (pathname) => {
      expect(renderUseMainNavBars(pathname, true)).toStrictEqual({
        hasNavBar: true,
        showSideNav: true,
        showBottomNav: false,
      });
    },
  );

  it.each([false, true])(
    'shows no nav on a route that is not a main nav route (wide layout: %s)',
    (isWideLayout) => {
      expect(renderUseMainNavBars(SETTINGS_ROUTE, isWideLayout)).toStrictEqual({
        hasNavBar: false,
        showSideNav: false,
        showBottomNav: false,
      });
    },
  );

  it('shows the bottom nav outside an app layout provider', () => {
    const { result } = renderHook(() => useMainNavBars(), {
      wrapper: ({ children }) => (
        <MemoryRouter
          initialEntries={[DEFAULT_ROUTE]}
          future={{
            // eslint-disable-next-line @typescript-eslint/naming-convention
            v7_startTransition: true,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            v7_relativeSplatPath: true,
          }}
        >
          {children}
        </MemoryRouter>
      ),
    });

    expect(result.current).toStrictEqual({
      hasNavBar: true,
      showSideNav: false,
      showBottomNav: true,
    });
  });
});
