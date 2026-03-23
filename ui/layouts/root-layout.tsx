import React from 'react';
import cn from 'clsx';
import { Outlet } from 'react-router-dom';
import { useRedirectToUnlockWhenLocked } from '../hooks/useRedirectToUnlockWhenLocked';

const width = 'max-w-[clamp(var(--width-sm),85vw,var(--width-max))]';
const sidepanel = 'group-[.app--sidepanel]:max-w-[var(--width-max-sidepanel)]';

export const RootLayout = () => {
  useRedirectToUnlockWhenLocked();

  return (
    <div className={cn('w-full h-full flex flex-col', width, sidepanel)}>
      <Outlet />
    </div>
  );
};
