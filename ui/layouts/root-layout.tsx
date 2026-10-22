import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { isSideNavRoute } from '../helpers/utils/main-nav';
import { useFullScreenDesign } from '../hooks/useFullScreenDesign';

export const RootLayout = () => {
  const isFullScreenDesign = useFullScreenDesign();
  const { pathname } = useLocation();
  // When full screen design is used, pages corresponding to main nav routes
  // render next to the side nav and use the full page width.
  const useFullScreenWidth = isFullScreenDesign && isSideNavRoute(pathname);

  return (
    <div
      className={
        useFullScreenWidth
          ? 'flex h-full w-full flex-col'
          : 'flex h-full w-full max-w-[var(--width-max)] flex-col'
      }
    >
      <Outlet />
    </div>
  );
};
