import React from 'react';
import cn from 'clsx';
import { Outlet } from 'react-router-dom';
import { BottomNavBar } from '../components/app/bottom-nav-bar/bottom-nav-bar';
import { useBottomNavBar } from '../hooks/useBottomNavBar';

const width = 'max-w-[clamp(var(--width-sm),85vw,var(--width-max))]';
const sidepanel = 'group-[.app--sidepanel]:max-w-[var(--width-max-sidepanel)]';

export const RootLayout = () => {
  const showBottomNav = useBottomNavBar();

  return (
    <div className={cn('w-full h-full flex flex-col', width, sidepanel)}>
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">
        <Outlet />
      </div>
      {showBottomNav && <BottomNavBar />}
    </div>
  );
};
