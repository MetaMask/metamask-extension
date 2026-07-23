import React from 'react';
import cn from 'clsx';
import { Outlet } from 'react-router-dom';
import { BottomNavBar } from '../components/app/bottom-nav-bar/bottom-nav-bar';
import { useBottomNavBar } from '../hooks/useBottomNavBar';

const width = 'max-w-[var(--width-max)]';

export const RootLayout = () => {
  const showBottomNav = useBottomNavBar();

  return (
    <div className={cn('w-full h-full flex flex-col', width)}>
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">
        <Outlet />
      </div>
      {showBottomNav && <BottomNavBar />}
    </div>
  );
};
