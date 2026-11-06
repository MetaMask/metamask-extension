import React from 'react';
import classnames from 'clsx';
import { Outlet } from 'react-router-dom';
import { AppLayoutProvider, useAppLayout } from '../contexts/app-layout';
import { useFullScreenDesign } from '../hooks/useFullScreenDesign';
import { useMainNavBars } from '../hooks/useMainNavBars';

const RootLayoutFrame = () => {
  const { isWideLayout } = useAppLayout();
  const { showSideNav } = useMainNavBars();

  return (
    <div
      className={classnames(
        'flex h-full w-full flex-col shadow-sm',
        showSideNav ? 'max-w-[var(--width-max)]' : 'max-w-[var(--width-md)]',
      )}
      data-wide-layout={isWideLayout ? true : undefined}
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
