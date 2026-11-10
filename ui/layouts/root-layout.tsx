import React from 'react';
import classnames from 'clsx';
import { Outlet } from 'react-router-dom';
import { AppLayoutProvider, useAppLayout } from '../contexts/app-layout';
import { useFullScreenDesign } from '../hooks/useFullScreenDesign';

const RootLayoutFrame = () => {
  const { isWideLayout } = useAppLayout();

  return (
    <div
      className={classnames(
        'flex h-full w-full flex-col shadow-sm',
        'max-w-[var(--width-md)] [--drawer-column-width:var(--width-md)]',
        'has-[.side-nav]:max-w-[var(--width-max)] has-[.side-nav]:[--drawer-column-width:var(--width-max)]',
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
