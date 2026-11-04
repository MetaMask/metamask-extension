import React from 'react';
import { it } from '@jest/globals';
import { renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { AppLayoutProvider } from '../contexts/app-layout';
import {
  ACTIVITY_ROUTE,
  DEFAULT_ROUTE,
  SETTINGS_ROUTE,
} from '../helpers/constants/routes';
import configureStore from '../store/store';
import { useMainNavBars } from './useMainNavBars';

const renderUseMainNavBars = (
  pathname: string,
  isWideLayout: boolean,
  withBottomNavBar: boolean,
) => {
  const store = configureStore({
    metamask: {
      remoteFeatureFlags: {
        coreExtensionUxCeux1141AbtestBottomNav: withBottomNavBar
          ? 'treatment'
          : 'control',
      },
    },
  });

  return renderHook(() => useMainNavBars(), {
    wrapper: ({ children }) => (
      <Provider store={store}>
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
      </Provider>
    ),
  }).result.current;
};

describe('useMainNavBars', () => {
  describe('in the treatment variant of the bottom nav A/B test', () => {
    it.each([DEFAULT_ROUTE, ACTIVITY_ROUTE])(
      'shows the bottom nav on %s outside the wide layout',
      (pathname) => {
        expect(renderUseMainNavBars(pathname, false, true)).toStrictEqual({
          hasNavBar: true,
          showSideNav: false,
          showBottomNav: true,
        });
      },
    );

    it.each([DEFAULT_ROUTE, ACTIVITY_ROUTE])(
      'shows the side nav on %s in the wide layout',
      (pathname) => {
        expect(renderUseMainNavBars(pathname, true, true)).toStrictEqual({
          hasNavBar: true,
          showSideNav: true,
          showBottomNav: false,
        });
      },
    );

    it.each([false, true])(
      'shows no nav on a route that is not a main nav route (wide layout: %s)',
      (isWideLayout) => {
        expect(
          renderUseMainNavBars(SETTINGS_ROUTE, isWideLayout, true),
        ).toStrictEqual({
          hasNavBar: false,
          showSideNav: false,
          showBottomNav: false,
        });
      },
    );

    it('shows the bottom nav outside an app layout provider', () => {
      const store = configureStore({
        metamask: {
          remoteFeatureFlags: {
            coreExtensionUxCeux1141AbtestBottomNav: 'treatment',
          },
        },
      });
      const { result } = renderHook(() => useMainNavBars(), {
        wrapper: ({ children }) => (
          <Provider store={store}>
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
          </Provider>
        ),
      });

      expect(result.current.showBottomNav).toBe(true);
    });
  });
});
