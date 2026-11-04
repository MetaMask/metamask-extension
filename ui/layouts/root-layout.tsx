import React from 'react';
import classnames from 'clsx';
import { Outlet } from 'react-router-dom';
import { AppLayoutProvider } from '../contexts/app-layout';
import { useFullScreenDesign } from '../hooks/useFullScreenDesign';
import { useMainNavBars } from '../hooks/useMainNavBars';

const RootLayoutFrame = () => {
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

export const RootLayout = () => {
  const isWideLayout = useFullScreenDesign();

  return (
    <AppLayoutProvider isWideLayout={isWideLayout}>
      <RootLayoutFrame />
    </AppLayoutProvider>
  );
};
