import React from 'react';
import classnames from 'clsx';
import { Outlet } from 'react-router-dom';
import { useMainNavBars } from '../hooks/useMainNavBars';

export const RootLayout = () => {
  const { showSideNav } = useMainNavBars();

  return (
    <div
      className={classnames(
        'flex h-full w-full flex-col shadow-sm',
        showSideNav
          ? 'max-w-[var(--width-max-fullscreen-redesign)]'
          : 'max-w-[var(--width-max)]',
      )}
    >
      <Outlet />
    </div>
  );
};
