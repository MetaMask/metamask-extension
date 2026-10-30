import React from 'react';
import { Outlet } from 'react-router-dom';
import { useMainNavBars } from '../hooks/useMainNavBars';

export const RootLayout = () => {
  const { showSideNav } = useMainNavBars();

  return (
    <div
      className={
        showSideNav
          ? 'flex h-full w-full max-w-[1200px] flex-col shadow-sm' // TODO: pick non-arbitrary value for max-width
          : 'flex h-full w-full max-w-[var(--width-max)] flex-col shadow-sm'
      }
    >
      <Outlet />
    </div>
  );
};
