import React from 'react';
import { Outlet, useMatches } from 'react-router-dom';
import { useFullScreenDesign } from '../hooks/useFullScreenDesign';

/**
 * Route `handle` flag for routes rendered inside a layout that provides its
 * own side navigation. These routes use the full window width.
 */
export type RouteHandle = { hasSideNav?: boolean };

export const RootLayout = () => {
  const isFullScreenDesign = useFullScreenDesign();
  const matches = useMatches();
  const hasSideNav = matches.some(
    (match) => (match.handle as RouteHandle | undefined)?.hasSideNav,
  );
  const isFullWidth = isFullScreenDesign && hasSideNav;

  return (
    <div
      className={
        isFullWidth
          ? 'flex h-full w-full flex-col'
          : 'flex h-full w-full max-w-[var(--width-max)] flex-col'
      }
    >
      <Outlet />
    </div>
  );
};
