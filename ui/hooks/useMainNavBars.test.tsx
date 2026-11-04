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
import { useBottomNavBar } from './useBottomNavBar';
import { useMainNavBars } from './useMainNavBars';

jest.mock('./useBottomNavBar', () => ({
  useBottomNavBar: jest.fn(),
}));

const mockUseBottomNavBar = jest.mocked(useBottomNavBar);

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
  beforeEach(() => {
    mockUseBottomNavBar.mockReturnValue(true);
  });

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
      // DEBUG
      // eslint-disable-next-line no-console
      console.log('mock calls', mockUseBottomNavBar.mock.calls.length, 'impl', String(mockUseBottomNavBar.getMockImplementation()));
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
        <MemoryRouter initialEntries={[DEFAULT_ROUTE]}>{children}</MemoryRouter>
      ),
    });

    expect(result.current.showBottomNav).toBe(true);
  });

  describe('in the control variant of the bottom nav A/B test', () => {
    beforeEach(() => {
      mockUseBottomNavBar.mockReturnValue(false);
    });

    it('shows no nav outside the wide layout', () => {
      expect(renderUseMainNavBars(DEFAULT_ROUTE, false)).toStrictEqual({
        hasNavBar: false,
        showSideNav: false,
        showBottomNav: false,
      });
    });

    it('shows the side nav in the wide layout', () => {
      expect(renderUseMainNavBars(DEFAULT_ROUTE, true)).toStrictEqual({
        hasNavBar: true,
        showSideNav: true,
        showBottomNav: false,
      });
    });
  });
});
