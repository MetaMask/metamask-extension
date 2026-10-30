import React from 'react';
import { it } from '@jest/globals';
import { renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import {
  ACTIVITY_ROUTE,
  DEFAULT_ROUTE,
  SETTINGS_ROUTE,
} from '../helpers/constants/routes';
import { useFullScreenDesign } from './useFullScreenDesign';
import { useMainNavBars } from './useMainNavBars';

jest.mock('./useFullScreenDesign');

const mockUseFullScreenDesign = jest.mocked(useFullScreenDesign);

const renderUseMainNavBars = (pathname: string) =>
  renderHook(() => useMainNavBars(), {
    wrapper: ({ children }) => (
      <MemoryRouter initialEntries={[pathname]}>{children}</MemoryRouter>
    ),
  }).result.current;

describe('useMainNavBars', () => {
  beforeEach(() => {
    mockUseFullScreenDesign.mockReturnValue(false);
  });

  it.each([DEFAULT_ROUTE, ACTIVITY_ROUTE])(
    'shows the bottom nav on %s outside the fullscreen design',
    (pathname) => {
      expect(renderUseMainNavBars(pathname)).toStrictEqual({
        hasNavBar: true,
        showSideNav: false,
        showBottomNav: true,
      });
    },
  );

  it.each([DEFAULT_ROUTE, ACTIVITY_ROUTE])(
    'shows the side nav on %s in the fullscreen design',
    (pathname) => {
      mockUseFullScreenDesign.mockReturnValue(true);

      expect(renderUseMainNavBars(pathname)).toStrictEqual({
        hasNavBar: true,
        showSideNav: true,
        showBottomNav: false,
      });
    },
  );

  it.each([false, true])(
    'shows no nav on a route that is not a main nav route (fullscreen design: %s)',
    (isFullScreenDesign) => {
      mockUseFullScreenDesign.mockReturnValue(isFullScreenDesign);

      expect(renderUseMainNavBars(SETTINGS_ROUTE)).toStrictEqual({
        hasNavBar: false,
        showSideNav: false,
        showBottomNav: false,
      });
    },
  );
});
